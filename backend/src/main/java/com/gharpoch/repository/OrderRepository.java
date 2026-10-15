package com.gharpoch.repository;

import com.gharpoch.model.Order;
import com.gharpoch.model.OrderStatus;
import com.gharpoch.model.Restaurant;
import com.gharpoch.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {
    Optional<Order> findByPublicOrderNumber(String publicOrderNumber);
    Optional<Order> findByIdempotencyKey(String idempotencyKey);
    List<Order> findByCustomerOrderByCreatedAtDesc(User customer);
    List<Order> findByRestaurantOrderByCreatedAtDesc(Restaurant restaurant);
    List<Order> findByRestaurantAndStatusOrderByCreatedAtDesc(Restaurant restaurant, OrderStatus status);
    List<Order> findAllByOrderByCreatedAtDesc();

    @Query("SELECT COUNT(o) FROM Order o WHERE o.status = :status")
    long countByStatus(OrderStatus status);

    @Query("SELECT COALESCE(SUM(o.totalPaise), 0) FROM Order o WHERE o.status = 'DELIVERED'")
    long sumDeliveredTotalPaise();
}
