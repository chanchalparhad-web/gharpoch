package com.gharpoch.service;

import com.gharpoch.dto.AuthResponse;
import com.gharpoch.dto.LoginRequest;
import com.gharpoch.dto.RegisterRequest;
import com.gharpoch.model.RestaurantUser;
import com.gharpoch.model.Role;
import com.gharpoch.model.User;
import com.gharpoch.repository.RestaurantUserRepository;
import com.gharpoch.repository.UserRepository;
import com.gharpoch.security.JwtTokenProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RestaurantUserRepository restaurantUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthService(UserRepository userRepository,
                       RestaurantUserRepository restaurantUserRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.restaurantUserRepository = restaurantUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    @Transactional
    public AuthResponse registerCustomer(RegisterRequest request) {
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new IllegalArgumentException("Phone number already registered. Please login.");
        }

        User user = new User(
                request.getPhone().trim(),
                request.getName().trim(),
                passwordEncoder.encode(request.getPassword()),
                Role.ROLE_CUSTOMER
        );
        user = userRepository.save(user);

        String token = tokenProvider.generateToken(user.getPhone(), user.getRole().name(), user.getName(), user.getId().toString());
        return new AuthResponse(token, user.getId(), user.getPhone(), user.getName(), user.getRole().name());
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByPhone(request.getPhone().trim())
                .orElseThrow(() -> new BadCredentialsException("Invalid mobile number or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid mobile number or password");
        }

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new IllegalStateException("Account is suspended or deactivated. Contact GharPoch Admin.");
        }

        String token = tokenProvider.generateToken(user.getPhone(), user.getRole().name(), user.getName(), user.getId().toString());
        AuthResponse response = new AuthResponse(token, user.getId(), user.getPhone(), user.getName(), user.getRole().name());

        if (user.getRole() == Role.ROLE_RESTAURANT_STAFF) {
            Optional<RestaurantUser> ru = restaurantUserRepository.findByUser(user);
            ru.ifPresent(restaurantUser -> {
                response.setRestaurantId(restaurantUser.getRestaurant().getId());
                response.setRestaurantName(restaurantUser.getRestaurant().getName());
            });
        }

        return response;
    }

    public User getCurrentAuthenticatedUser() {
        String phone = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByPhone(phone)
                .orElseThrow(() -> new BadCredentialsException("Authenticated user not found"));
    }
}
