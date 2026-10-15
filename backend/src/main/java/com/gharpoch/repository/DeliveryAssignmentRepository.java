package com.gharpoch.repository;

import com.gharpoch.model.DeliveryAssignment;
import com.gharpoch.model.DeliveryPartner;
import com.gharpoch.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DeliveryAssignmentRepository extends JpaRepository<DeliveryAssignment, UUID> {
    List<DeliveryAssignment> findByPartnerOrderByAssignedAtDesc(DeliveryPartner partner);
    Optional<DeliveryAssignment> findByOrderAndPartner(Order order, DeliveryPartner partner);
    Optional<DeliveryAssignment> findFirstByOrderOrderByAssignedAtDesc(Order order);
}
