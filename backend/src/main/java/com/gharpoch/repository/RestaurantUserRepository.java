package com.gharpoch.repository;

import com.gharpoch.model.Restaurant;
import com.gharpoch.model.RestaurantUser;
import com.gharpoch.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RestaurantUserRepository extends JpaRepository<RestaurantUser, UUID> {
    Optional<RestaurantUser> findByUser(User user);
    Optional<RestaurantUser> findByRestaurant(Restaurant restaurant);
}
