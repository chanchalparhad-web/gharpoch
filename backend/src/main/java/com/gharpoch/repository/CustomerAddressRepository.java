package com.gharpoch.repository;

import com.gharpoch.model.CustomerAddress;
import com.gharpoch.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CustomerAddressRepository extends JpaRepository<CustomerAddress, UUID> {
    List<CustomerAddress> findByUserOrderByCreatedAtDesc(User user);
}
