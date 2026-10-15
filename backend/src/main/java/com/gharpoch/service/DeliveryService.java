package com.gharpoch.service;

import com.gharpoch.dto.CompleteDeliveryRequest;
import com.gharpoch.dto.OrderResponse;
import com.gharpoch.dto.ReportDeliveryFailureRequest;
import com.gharpoch.model.*;
import com.gharpoch.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DeliveryService {

    private final DeliveryPartnerRepository partnerRepository;
    private final DeliveryAssignmentRepository assignmentRepository;
    private final OrderRepository orderRepository;
    private final OrderStatusHistoryRepository statusHistoryRepository;
    private final OrderService orderService;
    private final EventService eventService;

    public DeliveryService(DeliveryPartnerRepository partnerRepository,
                           DeliveryAssignmentRepository assignmentRepository,
                           OrderRepository orderRepository,
                           OrderStatusHistoryRepository statusHistoryRepository,
                           OrderService orderService,
                           EventService eventService) {
        this.partnerRepository = partnerRepository;
        this.assignmentRepository = assignmentRepository;
        this.orderRepository = orderRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.orderService = orderService;
        this.eventService = eventService;
    }

    public DeliveryPartner getPartnerForUser(User user) {
        return partnerRepository.findByUser(user)
                .orElseThrow(() -> new IllegalStateException("User is not registered as a delivery partner."));
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getMyAssignments(User user) {
        DeliveryPartner partner = getPartnerForUser(user);
        return assignmentRepository.findByPartnerOrderByAssignedAtDesc(partner)
                .stream()
                .map(assignment -> orderService.mapToOrderResponse(assignment.getOrder()))
                .collect(Collectors.toList());
    }

    @Transactional
    public DeliveryPartner updateAvailability(User user, String status) {
        DeliveryPartner partner = getPartnerForUser(user);
        partner.setAvailabilityStatus(status.toUpperCase());
        partner.setLastActiveAt(LocalDateTime.now());
        return partnerRepository.save(partner);
    }

    @Transactional
    public OrderResponse acceptAssignment(UUID orderId, User user) {
        DeliveryPartner partner = getPartnerForUser(user);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        DeliveryAssignment assignment = assignmentRepository.findByOrderAndPartner(order, partner)
                .orElseThrow(() -> new IllegalStateException("No active assignment for this partner on order: " + order.getPublicOrderNumber()));

        OrderStatus oldStatus = order.getStatus();
        order.setStatus(OrderStatus.PARTNER_ACCEPTED);
        order.setUpdatedAt(LocalDateTime.now());
        Order saved = orderRepository.save(order);

        assignment.setStatus("ACCEPTED");
        assignment.setAcceptedAt(LocalDateTime.now());
        assignmentRepository.save(assignment);

        OrderStatusHistory history = new OrderStatusHistory(
                saved, oldStatus, OrderStatus.PARTNER_ACCEPTED, user, "ROLE_DELIVERY_PARTNER",
                "Delivery partner " + user.getName() + " accepted assignment."
        );
        statusHistoryRepository.save(history);

        OrderResponse res = orderService.mapToOrderResponse(saved);
        eventService.broadcastOrderEvent(res);
        return res;
    }

    @Transactional
    public OrderResponse pickupOrder(UUID orderId, User user) {
        DeliveryPartner partner = getPartnerForUser(user);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        DeliveryAssignment assignment = assignmentRepository.findByOrderAndPartner(order, partner)
                .orElseThrow(() -> new IllegalStateException("Assignment not found"));

        OrderStatus oldStatus = order.getStatus();
        order.setStatus(OrderStatus.OUT_FOR_DELIVERY);
        order.setUpdatedAt(LocalDateTime.now());
        Order saved = orderRepository.save(order);

        assignment.setStatus("PICKED_UP");
        assignment.setPickedUpAt(LocalDateTime.now());
        assignmentRepository.save(assignment);

        OrderStatusHistory history = new OrderStatusHistory(
                saved, oldStatus, OrderStatus.OUT_FOR_DELIVERY, user, "ROLE_DELIVERY_PARTNER",
                "Order picked up from " + order.getRestaurant().getName() + ". On the way to customer."
        );
        statusHistoryRepository.save(history);

        OrderResponse res = orderService.mapToOrderResponse(saved);
        eventService.broadcastOrderEvent(res);
        return res;
    }

    @Transactional
    public OrderResponse completeDelivery(UUID orderId, CompleteDeliveryRequest request, User user) {
        DeliveryPartner partner = getPartnerForUser(user);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        DeliveryAssignment assignment = assignmentRepository.findByOrderAndPartner(order, partner)
                .orElseThrow(() -> new IllegalStateException("Assignment not found"));

        // Verify Delivery OTP
        if (order.getDeliveryOtp() != null && !order.getDeliveryOtp().trim().equalsIgnoreCase(request.getDeliveryOtp().trim())) {
            throw new IllegalArgumentException("Invalid Delivery OTP. Please verify with customer.");
        }

        OrderStatus oldStatus = order.getStatus();
        order.setStatus(OrderStatus.DELIVERED);
        order.setPaymentStatus(PaymentStatus.PAID); // COD cash collected
        order.setUpdatedAt(LocalDateTime.now());
        Order saved = orderRepository.save(order);

        assignment.setStatus("DELIVERED");
        assignment.setDeliveredAt(LocalDateTime.now());
        assignmentRepository.save(assignment);

        // Update partner stats and earnings (rider gets delivery fee)
        partner.setTotalDeliveries(partner.getTotalDeliveries() + 1);
        partner.setTotalEarningsPaise(partner.getTotalEarningsPaise() + order.getDeliveryFeePaise());
        partnerRepository.save(partner);

        OrderStatusHistory history = new OrderStatusHistory(
                saved, oldStatus, OrderStatus.DELIVERED, user, "ROLE_DELIVERY_PARTNER",
                "Order delivered successfully to customer. COD cash ₹" + (order.getTotalPaise() / 100) + " collected."
        );
        statusHistoryRepository.save(history);

        OrderResponse res = orderService.mapToOrderResponse(saved);
        eventService.broadcastOrderEvent(res);
        return res;
    }

    @Transactional
    public OrderResponse reportFailure(UUID orderId, ReportDeliveryFailureRequest request, User user) {
        DeliveryPartner partner = getPartnerForUser(user);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        DeliveryAssignment assignment = assignmentRepository.findByOrderAndPartner(order, partner)
                .orElseThrow(() -> new IllegalStateException("Assignment not found"));

        OrderStatus oldStatus = order.getStatus();
        order.setStatus(OrderStatus.DELIVERY_FAILED);
        order.setCancellationReason(request.getReason());
        order.setUpdatedAt(LocalDateTime.now());
        Order saved = orderRepository.save(order);

        assignment.setStatus("FAILED");
        assignment.setFailureReason(request.getReason());
        assignmentRepository.save(assignment);

        OrderStatusHistory history = new OrderStatusHistory(
                saved, oldStatus, OrderStatus.DELIVERY_FAILED, user, "ROLE_DELIVERY_PARTNER",
                "Delivery failed: " + request.getReason()
        );
        statusHistoryRepository.save(history);

        OrderResponse res = orderService.mapToOrderResponse(saved);
        eventService.broadcastOrderEvent(res);
        return res;
    }
}
