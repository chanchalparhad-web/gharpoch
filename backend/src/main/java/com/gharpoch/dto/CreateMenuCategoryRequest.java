package com.gharpoch.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateMenuCategoryRequest {
    @NotBlank(message = "Category Marathi name is required")
    private String nameMr;

    @NotBlank(message = "Category English name is required")
    private String nameEn;

    private int sortOrder = 0;

    public CreateMenuCategoryRequest() {}

    public String getNameMr() { return nameMr; }
    public void setNameMr(String nameMr) { this.nameMr = nameMr; }

    public String getNameEn() { return nameEn; }
    public void setNameEn(String nameEn) { this.nameEn = nameEn; }

    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
}
