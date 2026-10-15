package com.gharpoch.repository;

import com.gharpoch.model.MenuCategory;
import com.gharpoch.model.MenuItem;
import com.gharpoch.model.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, UUID> {
    List<MenuItem> findByRestaurantOrderBySortOrderAsc(Restaurant restaurant);
    List<MenuItem> findByRestaurantAndAvailableTrueOrderBySortOrderAsc(Restaurant restaurant);
    List<MenuItem> findByCategoryOrderBySortOrderAsc(MenuCategory category);
}
