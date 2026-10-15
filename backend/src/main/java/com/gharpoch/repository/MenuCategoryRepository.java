package com.gharpoch.repository;

import com.gharpoch.model.MenuCategory;
import com.gharpoch.model.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MenuCategoryRepository extends JpaRepository<MenuCategory, UUID> {
    List<MenuCategory> findByRestaurantAndActiveTrueOrderBySortOrderAsc(Restaurant restaurant);
    List<MenuCategory> findByRestaurantOrderBySortOrderAsc(Restaurant restaurant);
}
