package com.gharpoch.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "menu_items")
public class MenuItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    @JsonIgnore
    private Restaurant restaurant;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id", nullable = false)
    private MenuCategory category;

    @Column(name = "name_mr", nullable = false, length = 150)
    private String nameMr;

    @Column(name = "name_en", nullable = false, length = 150)
    private String nameEn;

    @Column(name = "description_mr", length = 500)
    private String descriptionMr;

    @Column(name = "description_en", length = 500)
    private String descriptionEn;

    @Column(name = "price_paise", nullable = false)
    private long pricePaise;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "is_veg", nullable = false)
    private boolean veg = true;

    @Column(name = "is_available", nullable = false)
    private boolean available = true;

    @Column(name = "portion_size", length = 100)
    private String portionSize;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    public MenuItem() {}

    public MenuItem(Restaurant restaurant, MenuCategory category, String nameMr, String nameEn,
                    String descriptionMr, String descriptionEn, long pricePaise,
                    String imageUrl, boolean veg, String portionSize) {
        this.restaurant = restaurant;
        this.category = category;
        this.nameMr = nameMr;
        this.nameEn = nameEn;
        this.descriptionMr = descriptionMr;
        this.descriptionEn = descriptionEn;
        this.pricePaise = pricePaise;
        this.imageUrl = imageUrl;
        this.veg = veg;
        this.portionSize = portionSize;
        this.available = true;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Restaurant getRestaurant() { return restaurant; }
    public void setRestaurant(Restaurant restaurant) { this.restaurant = restaurant; }

    public MenuCategory getCategory() { return category; }
    public void setCategory(MenuCategory category) { this.category = category; }

    public String getNameMr() { return nameMr; }
    public void setNameMr(String nameMr) { this.nameMr = nameMr; }

    public String getNameEn() { return nameEn; }
    public void setNameEn(String nameEn) { this.nameEn = nameEn; }

    public String getDescriptionMr() { return descriptionMr; }
    public void setDescriptionMr(String descriptionMr) { this.descriptionMr = descriptionMr; }

    public String getDescriptionEn() { return descriptionEn; }
    public void setDescriptionEn(String descriptionEn) { this.descriptionEn = descriptionEn; }

    public long getPricePaise() { return pricePaise; }
    public void setPricePaise(long pricePaise) { this.pricePaise = pricePaise; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public boolean isVeg() { return veg; }
    public void setVeg(boolean veg) { this.veg = veg; }

    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }

    public String getPortionSize() { return portionSize; }
    public void setPortionSize(String portionSize) { this.portionSize = portionSize; }

    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
}
