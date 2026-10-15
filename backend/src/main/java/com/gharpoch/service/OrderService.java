package com.gharpoch.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gharpoch.dto.*;
import com.gharpoch.model.*;
import com.gharpoch.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderStatusHistoryRepository statusHistoryRepository;
    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;
    private final ServiceAreaRepository serviceAreaRepository;
    private final EventService eventService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public OrderService(OrderRepository orderRepository,
                        OrderItemRepository orderItemRepository,
                        OrderStatusHistoryRepository statusHistoryRepository,
                        RestaurantRepository restaurantRepository,
                        MenuItemRepository menuItemRepository,
                        ServiceAreaRepository serviceAreaRepository,
                        EventService eventService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.restaurantRepository = restaurantRepository;
        this.menuItemRepository = menuItemRepository;
        this.serviceAreaRepository = serviceAreaRepository;
        this.eventService = eventService;
    }

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request, User customer) {
        // 1. Idempotency Check
        if (request.getIdempotencyKey() != null && !request.getIdempotencyKey().isBlank()) {
            Optional<Order> existingOrder = orderRepository.findByIdempotencyKey(request.getIdempotencyKey());
            if (existingOrder.isPresent()) {
                return mapToOrderResponse(existingOrder.get());
            }
        }

        // 2. Validate Restaurant
        Restaurant restaurant = restaurantRepository.findById(request.getRestaurantId())
                .orElseThrow(() -> new IllegalArgumentException("Restaurant not found"));

        if (!restaurant.isActive() || !restaurant.isOpen()) {
            throw new IllegalStateException("Restaurant is currently closed or not accepting orders.");
        }

        // 3. Validate Service Area & Delivery Fee
        ServiceArea serviceArea = serviceAreaRepository.findByVillageNameIgnoreCase(request.getVillage().trim())
                .orElseThrow(() -> new IllegalArgumentException("Delivery not available for village: " + request.getVillage() +
                        ". We currently serve Karodi, Asegaon, Sajapur."));

        if (!serviceArea.isActive()) {
            throw new IllegalStateException("Delivery service temporarily paused in " + request.getVillage());
        }

        long deliveryFeePaise = serviceArea.getDeliveryFeePaise();
        long platformFeePaise = 500L; // ₹5 platform fee

        // 4. Validate Items and Calculate Subtotal Server-Side
        long subtotalPaise = 0L;
        List<OrderItem> itemsToSave = new ArrayList<>();

        Order order = new Order();
        order.setCustomer(customer);
        order.setRestaurant(restaurant);
        order.setStatus(OrderStatus.PLACED);
        order.setPaymentMethod(PaymentMethod.COD);
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.setSpecialInstructions(request.getSpecialInstructions());
        order.setIdempotencyKey(request.getIdempotencyKey());

        for (OrderItemRequest itemReq : request.getItems()) {
            MenuItem menuItem = menuItemRepository.findById(itemReq.getMenuItemId())
                    .orElseThrow(() -> new IllegalArgumentException("Menu item not found: " + itemReq.getMenuItemId()));

            if (!menuItem.isAvailable()) {
                throw new IllegalStateException("Dish '" + menuItem.getNameEn() + " (" + menuItem.getNameMr() + ")' is currently out of stock.");
            }

            if (!menuItem.getRestaurant().getId().equals(restaurant.getId())) {
                throw new IllegalArgumentException("Cart cannot contain items from multiple restaurants.");
            }

            long itemPrice = menuItem.getPricePaise();
            long lineTotal = itemPrice * itemReq.getQuantity();
            subtotalPaise += lineTotal;

            OrderItem orderItem = new OrderItem(
                    order,
                    menuItem,
                    menuItem.getNameMr(),
                    menuItem.getNameEn(),
                    itemPrice,
                    itemReq.getQuantity(),
                    menuItem.getPortionSize()
            );
            itemsToSave.add(orderItem);
        }

        // 5. Minimum Order Validation
        if (subtotalPaise < restaurant.getMinOrderPaise()) {
            long minRs = restaurant.getMinOrderPaise() / 100;
            throw new IllegalArgumentException("Minimum order value for " + restaurant.getName() + " is ₹" + minRs);
        }

        long totalPaise = subtotalPaise + deliveryFeePaise + platformFeePaise;

        // 6. Generate Public Order Number and 4-digit Delivery OTP
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int randomCode = 1000 + new Random().nextInt(9000);
        String publicOrderNumber = "GP-" + dateStr + "-" + randomCode;

        int otpCode = 1000 + new Random().nextInt(9000);
        String deliveryOtp = String.valueOf(otpCode);

        // 7. Freeze Snapshots
        Map<String, String> addressSnapshot = new HashMap<>();
        addressSnapshot.put("name", request.getCustomerName());
        addressSnapshot.put("phone", request.getCustomerPhone());
        addressSnapshot.put("village", request.getVillage());
        addressSnapshot.put("addressLine", request.getAddressLine());
        addressSnapshot.put("landmark", request.getLandmark() != null ? request.getLandmark() : "");

        String addressSnapshotJson;
        try {
            addressSnapshotJson = objectMapper.writeValueAsString(addressSnapshot);
        } catch (Exception e) {
            addressSnapshotJson = request.getAddressLine() + ", " + request.getVillage();
        }

        order.setPublicOrderNumber(publicOrderNumber);
        order.setSubtotalPaise(subtotalPaise);
        order.setDeliveryFeePaise(deliveryFeePaise);
        order.setPlatformFeePaise(platformFeePaise);
        order.setDiscountPaise(0L);
        order.setTotalPaise(totalPaise);
        order.setCustomerNameSnapshot(request.getCustomerName());
        order.setCustomerPhoneSnapshot(request.getCustomerPhone());
        order.setAddressSnapshotJson(addressSnapshotJson);
        order.setRestaurantNameSnapshot(restaurant.getName());
        order.setRestaurantPhoneSnapshot(restaurant.getContactPhone());
        order.setDeliveryOtp(deliveryOtp);
        order.setItems(itemsToSave);

        Order savedOrder = orderRepository.save(order);

        // 8. Record Status History Log
        OrderStatusHistory history = new OrderStatusHistory(
                savedOrder,
                null,
                OrderStatus.PLACED,
                customer,
                "ROLE_CUSTOMER",
                "Order placed by customer via GharPoch PWA"
        );
        statusHistoryRepository.save(history);

        OrderResponse response = mapToOrderResponse(savedOrder);
        // 9. Real-time broadcast to Restaurant KDS & Admin Hub
        eventService.broadcastOrderEvent(response);

        return response;
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        return mapToOrderResponse(order);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getCustomerOrders(User customer) {
        return orderRepository.findByCustomerOrderByCreatedAtDesc(customer)
                .stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderResponse cancelOrderByCustomer(UUID orderId, User customer, String reason) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (!order.getCustomer().getId().equals(customer.getId())) {
            throw new IllegalStateException("Unauthorized to cancel this order.");
        }

        if (order.getStatus() != OrderStatus.PLACED) {
            throw new IllegalStateException("Order has already been confirmed by restaurant and cannot be cancelled.");
        }

        OrderStatus oldStatus = order.getStatus();
        order.setStatus(OrderStatus.CANCELLED_BY_CUSTOMER);
        order.setCancellationReason(reason != null ? reason : "Cancelled by customer before restaurant acceptance");
        order.setUpdatedAt(LocalDateTime.now());
        Order updated = orderRepository.save(order);

        OrderStatusHistory history = new OrderStatusHistory(
                updated, oldStatus, OrderStatus.CANCELLED_BY_CUSTOMER, customer, "ROLE_CUSTOMER", reason
        );
        statusHistoryRepository.save(history);

        OrderResponse res = mapToOrderResponse(updated);
        eventService.broadcastOrderEvent(res);
        return res;
    }

    public OrderResponse mapToOrderResponse(Order order) {
        OrderResponse res = new OrderResponse();
        res.setId(order.getId());
        res.setPublicOrderNumber(order.getPublicOrderNumber());
        res.setRestaurantId(order.getRestaurant().getId());
        res.setRestaurantName(order.getRestaurantNameSnapshot() != null ? order.getRestaurantNameSnapshot() : order.getRestaurant().getName());
        res.setRestaurantNameMr(order.getRestaurant().getNameMr());
        res.setRestaurantPhone(order.getRestaurantPhoneSnapshot() != null ? order.getRestaurantPhoneSnapshot() : order.getRestaurant().getContactPhone());
        res.setStatus(order.getStatus().name());
        res.setStatusDisplay(getStatusDisplayName(order.getStatus(), false));
        res.setStatusDisplayMr(getStatusDisplayName(order.getStatus(), true));
        res.setPaymentMethod(order.getPaymentMethod().name());
        res.setPaymentStatus(order.getPaymentStatus().name());
        res.setSubtotalPaise(order.getSubtotalPaise());
        res.setDeliveryFeePaise(order.getDeliveryFeePaise());
        res.setPlatformFeePaise(order.getPlatformFeePaise());
        res.setDiscountPaise(order.getDiscountPaise());
        res.setTotalPaise(order.getTotalPaise());
        res.setCustomerName(order.getCustomerNameSnapshot());
        res.setCustomerPhone(order.getCustomerPhoneSnapshot());
        res.setSpecialInstructions(order.getSpecialInstructions());
        res.setCancellationReason(order.getCancellationReason());
        res.setDeliveryOtp(order.getDeliveryOtp());

        if (order.getAssignedPartner() != null) {
            res.setAssignedPartnerName(order.getAssignedPartner().getUser().getName());
            res.setAssignedPartnerPhone(order.getAssignedPartner().getUser().getPhone());
        }

        // Parse address snapshot
        try {
            Map<?, ?> map = objectMapper.readValue(order.getAddressSnapshotJson(), Map.class);
            res.setVillage((String) map.get("village"));
            res.setAddressLine((String) map.get("addressLine"));
            res.setLandmark((String) map.get("landmark"));
        } catch (Exception e) {
            res.setAddressLine(order.getAddressSnapshotJson());
        }

        List<OrderItemResponse> itemResponses = order.getItems().stream().map(item -> {
            OrderItemResponse ir = new OrderItemResponse();
            ir.setId(item.getId());
            ir.setMenuItemId(item.getMenuItem().getId());
            ir.setItemNameMr(item.getItemNameMrSnapshot());
            ir.setItemNameEn(item.getItemNameEnSnapshot());
            ir.setUnitPricePaise(item.getUnitPricePaise());
            ir.setQuantity(item.getQuantity());
            ir.setLineTotalPaise(item.getLineTotalPaise());
            ir.setPortionSize(item.getPortionSize());
            return ir;
        }).collect(Collectors.toList());

        res.setItems(itemResponses);
        res.setCreatedAt(order.getCreatedAt().toString());
        res.setUpdatedAt(order.getUpdatedAt() != null ? order.getUpdatedAt().toString() : order.getCreatedAt().toString());
        return res;
    }

    private String getStatusDisplayName(OrderStatus status, boolean isMarathi) {
        if (isMarathi) {
            return switch (status) {
                case PLACED -> "ऑर्डर नोंदवली";
                case RESTAURANT_ACCEPTED -> "हॉटेलने स्वीकारली";
                case PREPARING -> "जेवण तयार होत आहे";
                case READY_FOR_PICKUP -> "पिकअपसाठी तयार";
                case ASSIGNED -> "डिलिव्हरी पार्टनर नियुक्त";
                case PARTNER_ACCEPTED -> "पार्टनरने स्वीकारले";
                case OUT_FOR_DELIVERY -> "डिलिव्हरीसाठी निघाले";
                case DELIVERED -> "घरपोच पोहोचवले";
                case CANCELLED_BY_RESTAURANT -> "हॉटेलने नाकारली";
                case CANCELLED_BY_ADMIN -> "प्रशासनाने रद्द केली";
                case CANCELLED_BY_CUSTOMER -> "ग्राहकाने रद्द केली";
                case DELIVERY_FAILED -> "डिलिव्हरी अयशस्वी";
            };
        } else {
            return switch (status) {
                case PLACED -> "Order Placed";
                case RESTAURANT_ACCEPTED -> "Restaurant Confirmed";
                case PREPARING -> "Preparing Food";
                case READY_FOR_PICKUP -> "Ready for Pickup";
                case ASSIGNED -> "Partner Assigned";
                case PARTNER_ACCEPTED -> "Partner Accepted";
                case OUT_FOR_DELIVERY -> "Out for Delivery";
                case DELIVERED -> "Delivered";
                case CANCELLED_BY_RESTAURANT -> "Cancelled by Restaurant";
                case CANCELLED_BY_ADMIN -> "Cancelled by Admin";
                case CANCELLED_BY_CUSTOMER -> "Cancelled by Customer";
                case DELIVERY_FAILED -> "Delivery Failed";
            };
        }
    }
}
