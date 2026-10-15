package com.gharpoch.controller;

import com.gharpoch.dto.*;
import com.gharpoch.model.OrderStatus;
import com.gharpoch.model.User;
import com.gharpoch.service.AuthService;
import com.gharpoch.service.RestaurantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/restaurant")
@PreAuthorize("hasAnyAuthority('ROLE_RESTAURANT_STAFF', 'ROLE_ADMIN')")
@Tag(name = "Restaurant Dashboard", description = "Endpoints for kitchen display, incoming order alerts, prep status, and item availability")
public class RestaurantController {

    private final RestaurantService restaurantService;
    private final AuthService authService;

    public RestaurantController(RestaurantService restaurantService, AuthService authService) {
        this.restaurantService = restaurantService;
        this.authService = authService;
    }

    @GetMapping("/orders")
    @Operation(summary = "Get incoming and active kitchen orders")
    public ResponseEntity<List<OrderResponse>> getOrders() {
        User staff = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(restaurantService.getOrders(staff));
    }

    @PatchMapping("/orders/{id}/accept")
    @Operation(summary = "Accept incoming order with prep time estimate")
    public ResponseEntity<OrderResponse> acceptOrder(@PathVariable UUID id,
                                                    @Valid @RequestBody AcceptOrderRequest request) {
        User staff = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(restaurantService.acceptOrder(id, request, staff));
    }

    @PatchMapping("/orders/{id}/status")
    @Operation(summary = "Update kitchen prep status (PREPARING, READY_FOR_PICKUP)")
    public ResponseEntity<OrderResponse> updateKitchenStatus(@PathVariable UUID id,
                                                            @RequestParam String status) {
        User staff = authService.getCurrentAuthenticatedUser();
        OrderStatus newStatus = OrderStatus.valueOf(status.toUpperCase().trim());
        return ResponseEntity.ok(restaurantService.updateKitchenStatus(id, newStatus, staff));
    }

    @PatchMapping("/orders/{id}/reject")
    @Operation(summary = "Reject incoming order with reason")
    public ResponseEntity<OrderResponse> rejectOrder(@PathVariable UUID id,
                                                    @Valid @RequestBody RejectOrderRequest request) {
        User staff = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(restaurantService.rejectOrder(id, request, staff));
    }

    @GetMapping("/menu")
    @Operation(summary = "Get full restaurant menu for availability management")
    public ResponseEntity<List<MenuCategoryResponse>> getMenu() {
        User staff = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(restaurantService.getRestaurantMenu(staff));
    }

    @PatchMapping("/menu-items/{id}/availability")
    @Operation(summary = "Toggle dish availability (Available / Out of Stock 86)")
    public ResponseEntity<MenuItemResponse> toggleAvailability(@PathVariable UUID id,
                                                              @RequestBody UpdateItemAvailabilityRequest request) {
        User staff = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(restaurantService.toggleItemAvailability(id, request.isAvailable(), staff));
    }
}
