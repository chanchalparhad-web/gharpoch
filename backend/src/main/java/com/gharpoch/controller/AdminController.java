package com.gharpoch.controller;

import com.gharpoch.dto.*;
import com.gharpoch.model.MenuCategory;
import com.gharpoch.model.MenuItem;
import com.gharpoch.model.Restaurant;
import com.gharpoch.model.ServiceArea;
import com.gharpoch.model.User;
import com.gharpoch.service.AdminService;
import com.gharpoch.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
@Tag(name = "Admin Operations Hub", description = "Endpoints for central dispatch, overrides, rider fleet, fees, hotels, and menus")
public class AdminController {

    private final AdminService adminService;
    private final AuthService authService;

    public AdminController(AdminService adminService, AuthService authService) {
        this.adminService = adminService;
        this.authService = authService;
    }

    @GetMapping("/dashboard/stats")
    @Operation(summary = "Get central operational statistics and metrics")
    public ResponseEntity<DashboardStatsResponse> getStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    @GetMapping("/orders")
    @Operation(summary = "Get master order book with filters for status and village")
    public ResponseEntity<List<OrderResponse>> getOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String village) {
        return ResponseEntity.ok(adminService.getAllOrders(status, village));
    }

    @GetMapping("/orders/{id}/history")
    @Operation(summary = "Get complete chronological audit history of an order")
    public ResponseEntity<List<OrderStatusHistoryResponse>> getOrderHistory(@PathVariable UUID id) {
        return ResponseEntity.ok(adminService.getOrderHistory(id));
    }

    @PostMapping("/orders/{id}/assign-delivery")
    @Operation(summary = "Assign or reassign an order to a delivery partner")
    public ResponseEntity<OrderResponse> assignDelivery(@PathVariable UUID id,
                                                       @Valid @RequestBody AssignDeliveryRequest request) {
        User admin = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(adminService.assignDeliveryPartner(id, request.getPartnerId(), admin));
    }

    @PatchMapping("/orders/{id}/override")
    @Operation(summary = "Administrative status override with mandatory audit reason")
    public ResponseEntity<OrderResponse> overrideOrder(@PathVariable UUID id,
                                                      @Valid @RequestBody AdminOverrideOrderRequest request) {
        User admin = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(adminService.overrideOrderStatus(id, request, admin));
    }

    @GetMapping("/delivery-partners")
    @Operation(summary = "Get delivery partner fleet with active status and workload")
    public ResponseEntity<List<Map<String, Object>>> getDeliveryPartners() {
        return ResponseEntity.ok(adminService.getDeliveryPartners());
    }

    @GetMapping("/reports/reconciliation")
    @Operation(summary = "Financial reconciliation report separating restaurant sales, delivery fees, and platform revenue")
    public ResponseEntity<List<Map<String, Object>>> getReconciliation() {
        return ResponseEntity.ok(adminService.getReconciliationReport());
    }

    @GetMapping("/service-areas")
    @Operation(summary = "Get all configured service areas and fees")
    public ResponseEntity<List<ServiceArea>> getServiceAreas() {
        return ResponseEntity.ok(adminService.getServiceAreas());
    }

    @PutMapping("/service-areas/{id}")
    @Operation(summary = "Update village delivery fee and minimum order threshold")
    public ResponseEntity<ServiceArea> updateServiceAreaFee(@PathVariable UUID id,
                                                           @RequestParam long deliveryFeePaise,
                                                           @RequestParam long minOrderPaise) {
        return ResponseEntity.ok(adminService.updateServiceAreaFee(id, deliveryFeePaise, minOrderPaise));
    }

    // ---------------- HOTEL & MENU MANAGEMENT ---------------- //

    @GetMapping("/restaurants")
    @Operation(summary = "List all restaurants with their menus for admin control")
    public ResponseEntity<List<RestaurantDetailResponse>> getAllRestaurants() {
        return ResponseEntity.ok(adminService.getAllRestaurantsAdmin());
    }

    @PostMapping("/restaurants")
    @Operation(summary = "Onboard a new restaurant in admin panel")
    public ResponseEntity<CreateRestaurantResponse> createRestaurant(@Valid @RequestBody CreateRestaurantRequest request) {
        User admin = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(adminService.createRestaurant(request, admin));
    }

    @PutMapping("/restaurants/{id}")
    @Operation(summary = "Update restaurant details, photo, timing, and fee configurations")
    public ResponseEntity<RestaurantDetailResponse> updateRestaurant(@PathVariable UUID id,
                                                                   @RequestBody UpdateRestaurantRequest request) {
        User admin = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(adminService.updateRestaurant(id, request, admin));
    }

    @PostMapping("/restaurants/{id}/categories")
    @Operation(summary = "Add a new menu category to a restaurant")
    public ResponseEntity<MenuCategory> createMenuCategory(@PathVariable UUID id,
                                                          @Valid @RequestBody CreateMenuCategoryRequest request) {
        return ResponseEntity.ok(adminService.createMenuCategory(id, request));
    }

    @PostMapping("/restaurants/{id}/menu-items")
    @Operation(summary = "Add a new menu item / dish to a restaurant")
    public ResponseEntity<MenuItem> createMenuItem(@PathVariable UUID id,
                                                  @Valid @RequestBody CreateMenuItemRequest request) {
        return ResponseEntity.ok(adminService.createMenuItem(id, request));
    }

    @PutMapping("/menu-items/{id}")
    @Operation(summary = "Update menu item / dish details and photo")
    public ResponseEntity<MenuItem> updateMenuItem(@PathVariable UUID id,
                                                  @RequestBody UpdateMenuItemRequest request) {
        User admin = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(adminService.updateMenuItem(id, request, admin));
    }

    @DeleteMapping("/menu-items/{id}")
    @Operation(summary = "Delete menu item")
    public ResponseEntity<Void> deleteMenuItem(@PathVariable UUID id) {
        adminService.deleteMenuItem(id);
        return ResponseEntity.noContent().build();
    }
}
