package com.gharpoch.repository;

import com.gharpoch.model.ServiceArea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ServiceAreaRepository extends JpaRepository<ServiceArea, UUID> {
    Optional<ServiceArea> findByVillageNameIgnoreCase(String villageName);
    List<ServiceArea> findByActiveTrue();
}
