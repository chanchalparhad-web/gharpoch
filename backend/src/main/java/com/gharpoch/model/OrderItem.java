package com.gharpoch.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @JsonIgnore
    private Order order;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "menu_item_id", nullable = false)
    private MenuItem menuItem;

    @Column(name = "item_name_mr_snapshot", nullable = false, length = 150)
    private String itemNameMrSnapshot;

    @Column(name = "item_name_en_snapshot", nullable = false, length = 150)
    private String itemNameEnSnapshot;

    @Column(name = "unit_price_paise", nullable = false)
    private long unitPricePaise;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "line_total_paise", nullable = false)
    private long lineTotalPaise;

    @Column(name = "portion_size", length = 100)
    private String portionSize;

    public OrderItem() {}

    public OrderItem(Order order, MenuItem menuItem, String itemNameMr, String itemNameEn,
                     long unitPricePaise, int quantity, String portionSize) {
        this.order = order;
        this.menuItem = menuItem;
        this.itemNameMrSnapshot = itemNameMr;
        this.itemNameEnSnapshot = itemNameEn;
        this.unitPricePaise = unitPricePaise;
        this.quantity = quantity;
        this.lineTotalPaise = unitPricePaise * quantity;
        this.portionSize = portionSize;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }

    public MenuItem getMenuItem() { return menuItem; }
    public void setMenuItem(MenuItem menuItem) { this.menuItem = menuItem; }

    public String getItemNameMrSnapshot() { return itemNameMrSnapshot; }
    public void setItemNameMrSnapshot(String itemNameMrSnapshot) { this.itemNameMrSnapshot = itemNameMrSnapshot; }

    public String getItemNameEnSnapshot() { return itemNameEnSnapshot; }
    public void setItemNameEnSnapshot(String itemNameEnSnapshot) { this.itemNameEnSnapshot = itemNameEnSnapshot; }

    public long getUnitPricePaise() { return unitPricePaise; }
    public void setUnitPricePaise(long unitPricePaise) { this.unitPricePaise = unitPricePaise; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public long getLineTotalPaise() { return lineTotalPaise; }
    public void setLineTotalPaise(long lineTotalPaise) { this.lineTotalPaise = lineTotalPaise; }

    public String getPortionSize() { return portionSize; }
    public void setPortionSize(String portionSize) { this.portionSize = portionSize; }
}
