package com.gharpoch.controller;

import com.gharpoch.dto.*;
import com.gharpoch.model.MenuCategory;
import com.gharpoch.model.MenuItem;
import com.gharpoch.model.Restaurant;
import com.gharpoch.model.ServiceArea;
import com.gharpoch.model.User;
import com.gharpoch.repository.MenuCategoryRepository;
import com.gharpoch.repository.MenuItemRepository;
import com.gharpoch.repository.RestaurantRepository;
import com.gharpoch.repository.ServiceAreaRepository;
import com.gharpoch.service.AuthService;
import com.gharpoch.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Customer Experience", description = "Endpoints for restaurant discovery, menu browsing, cart checkout, and tracking")
public class CustomerController {

    private final ServiceAreaRepository serviceAreaRepository;
    private final RestaurantRepository restaurantRepository;
    private final MenuCategoryRepository categoryRepository;
    private final MenuItemRepository menuItemRepository;
    private final OrderService orderService;
    private final AuthService authService;

    public CustomerController(ServiceAreaRepository serviceAreaRepository,
                              RestaurantRepository restaurantRepository,
                              MenuCategoryRepository categoryRepository,
                              MenuItemRepository menuItemRepository,
                              OrderService orderService,
                              AuthService authService) {
        this.serviceAreaRepository = serviceAreaRepository;
        this.restaurantRepository = restaurantRepository;
        this.categoryRepository = categoryRepository;
        this.menuItemRepository = menuItemRepository;
        this.orderService = orderService;
        this.authService = authService;
    }

    @GetMapping("/service-areas")
    @Operation(summary = "List all serviceable villages with delivery fees")
    public ResponseEntity<List<ServiceArea>> getServiceAreas() {
        return ResponseEntity.ok(serviceAreaRepository.findByActiveTrue());
    }

    @GetMapping("/restaurants")
    @Operation(summary = "Discover restaurants with optional village filtering")
    public ResponseEntity<List<RestaurantSummaryResponse>> getRestaurants(
            @RequestParam(required = false) String village) {
        List<Restaurant> list = (village != null && !village.isBlank())
                ? restaurantRepository.findByActiveTrueAndVillageIgnoreCase(village.trim())
                : restaurantRepository.findByActiveTrue();

        List<RestaurantSummaryResponse> responses = list.stream().map(r -> {
            RestaurantSummaryResponse res = new RestaurantSummaryResponse();
            res.setId(r.getId());
            res.setName(r.getName());
            res.setNameMr(r.getNameMr());
            res.setVillage(r.getVillage());
            res.setAddress(r.getAddress());
            res.setContactPhone(r.getContactPhone());
            res.setCoverImageUrl(r.getCoverImageUrl());
            res.setLogoUrl(r.getLogoUrl());
            res.setOpeningTime(r.getOpeningTime());
            res.setClosingTime(r.getClosingTime());
            res.setOpen(r.isOpen());
            res.setPrepTimeMinutes(r.getPrepTimeMinutes());
            res.setMinOrderPaise(r.getMinOrderPaise());
            res.setCuisineTypes(r.getCuisineTypes());
            return res;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/restaurants/{id}")
    @Operation(summary = "Get restaurant details and full categorized digital menu")
    public ResponseEntity<RestaurantDetailResponse> getRestaurantDetails(@PathVariable UUID id) {
        Restaurant r = restaurantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Restaurant not found"));

        RestaurantDetailResponse res = new RestaurantDetailResponse();
        res.setId(r.getId());
        res.setName(r.getName());
        res.setNameMr(r.getNameMr());
        res.setVillage(r.getVillage());
        res.setAddress(r.getAddress());
        res.setContactPhone(r.getContactPhone());
        res.setCoverImageUrl(r.getCoverImageUrl());
        res.setLogoUrl(r.getLogoUrl());
        res.setOpeningTime(r.getOpeningTime());
        res.setClosingTime(r.getClosingTime());
        res.setOpen(r.isOpen());
        res.setPrepTimeMinutes(r.getPrepTimeMinutes());
        res.setMinOrderPaise(r.getMinOrderPaise());
        res.setCuisineTypes(r.getCuisineTypes());

        List<MenuCategory> categories = categoryRepository.findByRestaurantAndActiveTrueOrderBySortOrderAsc(r);
        List<MenuItem> allItems = menuItemRepository.findByRestaurantOrderBySortOrderAsc(r);

        List<MenuCategoryResponse> categoryResponses = categories.stream().map(cat -> {
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

        res.setCategories(categoryResponses);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/orders")
    @Operation(summary = "Place COD order with multi-item cart")
    public ResponseEntity<OrderResponse> placeOrder(@Valid @RequestBody CreateOrderRequest request,
                                                    @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKeyHeader) {
        if (idempotencyKeyHeader != null && !idempotencyKeyHeader.isBlank()) {
            request.setIdempotencyKey(idempotencyKeyHeader.trim());
        }
        User customer = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(orderService.createOrder(request, customer));
    }

    @GetMapping("/orders/my")
    @Operation(summary = "Get order history for currently logged in customer")
    public ResponseEntity<List<OrderResponse>> getMyOrders() {
        User customer = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(orderService.getCustomerOrders(customer));
    }

    @GetMapping("/orders/{id}")
    @Operation(summary = "Get live order tracking status and details")
    public ResponseEntity<OrderResponse> getOrder(@PathVariable UUID id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    @GetMapping("/orders/{id}/poll")
    @Operation(summary = "Lightweight polling fallback for village 2G/3G connections")
    public ResponseEntity<OrderResponse> pollOrder(@PathVariable UUID id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    @PostMapping("/orders/{id}/cancel")
    @Operation(summary = "Cancel order if not yet confirmed by hotel")
    public ResponseEntity<OrderResponse> cancelOrder(@PathVariable UUID id,
                                                    @RequestParam(required = false) String reason) {
        User customer = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(orderService.cancelOrderByCustomer(id, customer, reason));
    }
}
