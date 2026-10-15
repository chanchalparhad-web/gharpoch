package com.gharpoch.controller;

import com.gharpoch.dto.AuthResponse;
import com.gharpoch.dto.LoginRequest;
import com.gharpoch.dto.RegisterRequest;
import com.gharpoch.model.Order;
import com.gharpoch.model.Role;
import com.gharpoch.model.User;
import com.gharpoch.repository.DeliveryPartnerRepository;
import com.gharpoch.repository.OrderRepository;
import com.gharpoch.repository.RestaurantUserRepository;
import com.gharpoch.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Endpoints for customer registration, login, and identity verification")
public class AuthController {

    private final AuthService authService;
    private final RestaurantUserRepository restaurantUserRepository;
    private final DeliveryPartnerRepository deliveryPartnerRepository;
    private final OrderRepository orderRepository;

    public AuthController(AuthService authService,
                          RestaurantUserRepository restaurantUserRepository,
                          DeliveryPartnerRepository deliveryPartnerRepository,
                          OrderRepository orderRepository) {
        this.authService = authService;
        this.restaurantUserRepository = restaurantUserRepository;
        this.deliveryPartnerRepository = deliveryPartnerRepository;
        this.orderRepository = orderRepository;
    }

    @PostMapping("/register")
    @Operation(summary = "Register customer account")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.registerCustomer(request));
    }

    @PostMapping("/login")
    @Operation(summary = "Login for Customer, Restaurant Staff, Delivery Partner, or Admin")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user info")
    public ResponseEntity<Map<String, Object>> getCurrentUser() {
        User user = authService.getCurrentAuthenticatedUser();
        Map<String, Object> map = new HashMap<>();
        map.put("id", user.getId());
        map.put("name", user.getName());
        map.put("phone", user.getPhone());
        map.put("role", user.getRole().name());
        map.put("status", user.getStatus());
        map.put("createdAt", user.getCreatedAt().toString());

        if (user.getRole() == Role.ROLE_RESTAURANT_STAFF) {
            restaurantUserRepository.findByUser(user).ifPresent(ru -> {
                map.put("restaurantId", ru.getRestaurant().getId());
                map.put("restaurantName", ru.getRestaurant().getName());
                map.put("restaurantNameMr", ru.getRestaurant().getNameMr());
                map.put("village", ru.getRestaurant().getVillage());
                map.put("address", ru.getRestaurant().getAddress());
            });
        } else if (user.getRole() == Role.ROLE_DELIVERY_PARTNER) {
            deliveryPartnerRepository.findByUser(user).ifPresent(dp -> {
                map.put("partnerId", dp.getId());
                map.put("vehicleNumber", dp.getVehicleNumber());
                map.put("availabilityStatus", dp.getAvailabilityStatus());
            });
        } else if (user.getRole() == Role.ROLE_CUSTOMER) {
            List<Order> orders = orderRepository.findByCustomerOrderByCreatedAtDesc(user);
            map.put("orderCount", orders.size());
            if (!orders.isEmpty()) {
                map.put("latestAddressJson", orders.get(0).getAddressSnapshotJson());
            }
        }

        return ResponseEntity.ok(map);
    }
}
