package com.gharpoch.repository;

import com.gharpoch.model.DeliveryPartner;
import com.gharpoch.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DeliveryPartnerRepository extends JpaRepository<DeliveryPartner, UUID> {
    Optional<DeliveryPartner> findByUser(User user);
    List<DeliveryPartner> findByActiveTrue();
    List<DeliveryPartner> findByActiveTrueAndAvailabilityStatus(String availabilityStatus);
}
