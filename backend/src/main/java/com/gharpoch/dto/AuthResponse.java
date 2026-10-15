package com.gharpoch.dto;

import java.util.UUID;

public class AuthResponse {
    private String token;
    private UUID userId;
    private String phone;
    private String name;
    private String role;
    private UUID restaurantId; // Only if role is RESTAURANT_STAFF
    private String restaurantName;

    public AuthResponse() {}

    public AuthResponse(String token, UUID userId, String phone, String name, String role) {
        this.token = token;
        this.userId = userId;
        this.phone = phone;
        this.name = name;
        this.role = role;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public UUID getRestaurantId() { return restaurantId; }
    public void setRestaurantId(UUID restaurantId) { this.restaurantId = restaurantId; }

    public String getRestaurantName() { return restaurantName; }
    public void setRestaurantName(String restaurantName) { this.restaurantName = restaurantName; }
}
