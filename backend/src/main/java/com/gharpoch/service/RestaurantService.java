package com.gharpoch.service;

import com.gharpoch.dto.*;
import com.gharpoch.model.*;
import com.gharpoch.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;
    private final RestaurantUserRepository restaurantUserRepository;
    private final OrderRepository orderRepository;
    private final MenuItemRepository menuItemRepository;
    private final MenuCategoryRepository categoryRepository;
    private final OrderStatusHistoryRepository statusHistoryRepository;
    private final OrderService orderService;
    private final EventService eventService;

    public RestaurantService(RestaurantRepository restaurantRepository,
                             RestaurantUserRepository restaurantUserRepository,
                             OrderRepository orderRepository,
                             MenuItemRepository menuItemRepository,
                             MenuCategoryRepository categoryRepository,
                             OrderStatusHistoryRepository statusHistoryRepository,
                             OrderService orderService,
                             EventService eventService) {
        this.restaurantRepository = restaurantRepository;
        this.restaurantUserRepository = restaurantUserRepository;
        this.orderRepository = orderRepository;
        this.menuItemRepository = menuItemRepository;
        this.categoryRepository = categoryRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.orderService = orderService;
        this.eventService = eventService;
    }

    public Restaurant getRestaurantForStaff(User staffUser) {
        if (staffUser.getRole() == Role.ROLE_ADMIN) {
            // Admin can access first restaurant or default
            return restaurantRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new IllegalStateException("No restaurants onboarded."));
        }
        return restaurantUserRepository.findByUser(staffUser)
                .map(RestaurantUser::getRestaurant)
                .orElseThrow(() -> new IllegalStateException("User is not assigned to any restaurant."));
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrders(User staffUser) {
        Restaurant restaurant = getRestaurantForStaff(staffUser);
        return orderRepository.findByRestaurantOrderByCreatedAtDesc(restaurant)
                .stream()
                .map(orderService::mapToOrderResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderResponse acceptOrder(UUID orderId, AcceptOrderRequest request, User staffUser) {
        Restaurant restaurant = getRestaurantForStaff(staffUser);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (!order.getRestaurant().getId().equals(restaurant.getId()) && staffUser.getRole() != Role.ROLE_ADMIN) {
            throw new IllegalStateException("Unauthorized access to another restaurant's order.");
        }

        if (order.getStatus() != OrderStatus.PLACED) {
            throw new IllegalStateException("Order is not in PLACED status (Current: " + order.getStatus() + ")");
        }

        OrderStatus oldStatus = order.getStatus();
        order.setStatus(OrderStatus.RESTAURANT_ACCEPTED);
        order.setUpdatedAt(LocalDateTime.now());
        Order saved = orderRepository.save(order);

        OrderStatusHistory history = new OrderStatusHistory(
                saved, oldStatus, OrderStatus.RESTAURANT_ACCEPTED, staffUser, "ROLE_RESTAURANT_STAFF",
                "Hotel confirmed order. Estimated prep time: " + request.getEstimatedPrepMinutes() + " mins"
        );
        statusHistoryRepository.save(history);

        OrderResponse res = orderService.mapToOrderResponse(saved);
        eventService.broadcastOrderEvent(res);
        return res;
    }

    @Transactional
    public OrderResponse updateKitchenStatus(UUID orderId, OrderStatus newStatus, User staffUser) {
        Restaurant restaurant = getRestaurantForStaff(staffUser);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (!order.getRestaurant().getId().equals(restaurant.getId()) && staffUser.getRole() != Role.ROLE_ADMIN) {
            throw new IllegalStateException("Unauthorized access to this order.");
        }

        if (newStatus != OrderStatus.PREPARING && newStatus != OrderStatus.READY_FOR_PICKUP) {
            throw new IllegalArgumentException("Invalid kitchen status transition to " + newStatus);
        }

        OrderStatus oldStatus = order.getStatus();
        order.setStatus(newStatus);
        order.setUpdatedAt(LocalDateTime.now());
        Order saved = orderRepository.save(order);

        OrderStatusHistory history = new OrderStatusHistory(
                saved, oldStatus, newStatus, staffUser, "ROLE_RESTAURANT_STAFF",
                "Kitchen status updated to: " + newStatus
        );
        statusHistoryRepository.save(history);

        OrderResponse res = orderService.mapToOrderResponse(saved);
        eventService.broadcastOrderEvent(res);
        return res;
    }

    @Transactional
    public OrderResponse rejectOrder(UUID orderId, RejectOrderRequest request, User staffUser) {
        Restaurant restaurant = getRestaurantForStaff(staffUser);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (!order.getRestaurant().getId().equals(restaurant.getId()) && staffUser.getRole() != Role.ROLE_ADMIN) {
            throw new IllegalStateException("Unauthorized access to this order.");
        }

        OrderStatus oldStatus = order.getStatus();
        order.setStatus(OrderStatus.CANCELLED_BY_RESTAURANT);
        order.setCancellationReason(request.getReason());
        order.setUpdatedAt(LocalDateTime.now());
        Order saved = orderRepository.save(order);

        OrderStatusHistory history = new OrderStatusHistory(
                saved, oldStatus, OrderStatus.CANCELLED_BY_RESTAURANT, staffUser, "ROLE_RESTAURANT_STAFF",
                "Order rejected by restaurant: " + request.getReason()
        );
        statusHistoryRepository.save(history);

        OrderResponse res = orderService.mapToOrderResponse(saved);
        eventService.broadcastOrderEvent(res);
        return res;
    }

    @Transactional
    public MenuItemResponse toggleItemAvailability(UUID itemId, boolean available, User staffUser) {
        Restaurant restaurant = getRestaurantForStaff(staffUser);
        MenuItem item = menuItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Menu item not found"));

        if (!item.getRestaurant().getId().equals(restaurant.getId()) && staffUser.getRole() != Role.ROLE_ADMIN) {
            throw new IllegalStateException("Unauthorized access to modify item of another hotel.");
        }

        item.setAvailable(available);
        MenuItem saved = menuItemRepository.save(item);

        MenuItemResponse res = new MenuItemResponse();
        res.setId(saved.getId());
        res.setCategoryId(saved.getCategory().getId());
        res.setNameMr(saved.getNameMr());
        res.setNameEn(saved.getNameEn());
        res.setPricePaise(saved.getPricePaise());
        res.setVeg(saved.isVeg());
        res.setAvailable(saved.isAvailable());
        res.setPortionSize(saved.getPortionSize());
        return res;
    }

    @Transactional(readOnly = true)
    public List<MenuCategoryResponse> getRestaurantMenu(User staffUser) {
        Restaurant restaurant = getRestaurantForStaff(staffUser);
        List<MenuCategory> categories = categoryRepository.findByRestaurantOrderBySortOrderAsc(restaurant);
        List<MenuItem> allItems = menuItemRepository.findByRestaurantOrderBySortOrderAsc(restaurant);

        return categories.stream().map(cat -> {
            MenuCategoryResponse cr = new MenuCategoryResponse(cat.getId(), cat.getNameMr(), cat.getNameEn(), cat.getSortOrder());
            List<MenuItemResponse> catItems = allItems.stream()
                    .filter(item -> item.getCategory().getId().equals(cat.getId()))
                    .map(item -> {
                        MenuItemResponse ir = new MenuItemResponse();
                        ir.setId(item.getId());
                        ir.setCategoryId(cat.getId());
                        ir.setNameMr(item.getNameMr());
                        ir.setNameEn(item.getNameEn());
                        ir.setDescriptionMr(item.getDescriptionMr());
                        ir.setDescriptionEn(item.getDescriptionEn());
                        ir.setPricePaise(item.getPricePaise());
                        ir.setImageUrl(item.getImageUrl());
                        ir.setVeg(item.isVeg());
                        ir.setAvailable(item.isAvailable());
                        ir.setPortionSize(item.getPortionSize());
                        ir.setSortOrder(item.getSortOrder());
                        return ir;
                    }).collect(Collectors.toList());
            cr.setItems(catItems);
            return cr;
        }).collect(Collectors.toList());
    }
}
