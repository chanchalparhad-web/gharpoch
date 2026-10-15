package com.gharpoch.dto;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class MenuCategoryResponse {
    private UUID id;
    private String nameMr;
    private String nameEn;
    private int sortOrder;
    private List<MenuItemResponse> items = new ArrayList<>();

    public MenuCategoryResponse() {}

    public MenuCategoryResponse(UUID id, String nameMr, String nameEn, int sortOrder) {
        this.id = id;
        this.nameMr = nameMr;
        this.nameEn = nameEn;
        this.sortOrder = sortOrder;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getNameMr() { return nameMr; }
    public void setNameMr(String nameMr) { this.nameMr = nameMr; }

    public String getNameEn() { return nameEn; }
    public void setNameEn(String nameEn) { this.nameEn = nameEn; }

    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }

    public List<MenuItemResponse> getItems() { return items; }
    public void setItems(List<MenuItemResponse> items) { this.items = items; }
}
