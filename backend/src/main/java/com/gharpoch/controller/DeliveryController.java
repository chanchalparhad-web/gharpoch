package com.gharpoch.controller;

import com.gharpoch.dto.CompleteDeliveryRequest;
import com.gharpoch.dto.DeliveryStatusUpdateRequest;
import com.gharpoch.dto.OrderResponse;
import com.gharpoch.dto.ReportDeliveryFailureRequest;
import com.gharpoch.model.DeliveryPartner;
import com.gharpoch.model.User;
import com.gharpoch.service.AuthService;
import com.gharpoch.service.DeliveryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/delivery")
@PreAuthorize("hasAnyAuthority('ROLE_DELIVERY_PARTNER', 'ROLE_ADMIN')")
@Tag(name = "Delivery Partner Dashboard", description = "Endpoints for rider availability, job assignments, pickup, and OTP completion")
public class DeliveryController {

    private final DeliveryService deliveryService;
    private final AuthService authService;

    public DeliveryController(DeliveryService deliveryService, AuthService authService) {
        this.deliveryService = deliveryService;
        this.authService = authService;
    }

    @GetMapping("/assignments")
    @Operation(summary = "Get assigned orders for current delivery partner")
    public ResponseEntity<List<OrderResponse>> getAssignments() {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(deliveryService.getMyAssignments(user));
    }

    @PatchMapping("/status")
    @Operation(summary = "Toggle partner availability status (ONLINE, OFFLINE)")
    public ResponseEntity<Map<String, Object>> updateStatus(@Valid @RequestBody DeliveryStatusUpdateRequest request) {
        User user = authService.getCurrentAuthenticatedUser();
        DeliveryPartner partner = deliveryService.updateAvailability(user, request.getAvailabilityStatus());
        Map<String, Object> map = new HashMap<>();
        map.put("partnerId", partner.getId());
        map.put("availabilityStatus", partner.getAvailabilityStatus());
        map.put("totalDeliveries", partner.getTotalDeliveries());
        map.put("totalEarningsRs", partner.getTotalEarningsPaise() / 100.0);
        return ResponseEntity.ok(map);
    }

    @PostMapping("/assignments/{id}/accept")
    @Operation(summary = "Accept assigned delivery order")
    public ResponseEntity<OrderResponse> acceptAssignment(@PathVariable UUID id) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(deliveryService.acceptAssignment(id, user));
    }

    @PostMapping("/assignments/{id}/pickup")
    @Operation(summary = "Mark food picked up from hotel counter")
    public ResponseEntity<OrderResponse> pickup(@PathVariable UUID id) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(deliveryService.pickupOrder(id, user));
    }

    @PostMapping("/assignments/{id}/deliver")
    @Operation(summary = "Complete delivery by verifying 4-digit customer OTP & COD cash collection")
    public ResponseEntity<OrderResponse> completeDelivery(@PathVariable UUID id,
                                                         @Valid @RequestBody CompleteDeliveryRequest request) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(deliveryService.completeDelivery(id, request, user));
    }

    @PostMapping("/assignments/{id}/fail")
    @Operation(summary = "Report delivery failure with reason")
    public ResponseEntity<OrderResponse> reportFailure(@PathVariable UUID id,
                                                      @Valid @RequestBody ReportDeliveryFailureRequest request) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(deliveryService.reportFailure(id, request, user));
    }
}
