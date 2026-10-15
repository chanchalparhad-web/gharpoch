package com.gharpoch.dto;

import java.util.UUID;

public class CreateRestaurantResponse {
    private UUID id;
    private String name;
    private String nameMr;
    private String village;
    private String address;
    private String contactPhone;
    private String managerPhone;
    private String managerPassword;
    private String managerRole;

    public CreateRestaurantResponse() {}

    public CreateRestaurantResponse(UUID id, String name, String nameMr, String village, String address, String contactPhone, String managerPhone, String managerPassword, String managerRole) {
        this.id = id;
        this.name = name;
        this.nameMr = nameMr;
        this.village = village;
        this.address = address;
        this.contactPhone = contactPhone;
        this.managerPhone = managerPhone;
        this.managerPassword = managerPassword;
        this.managerRole = managerRole;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getNameMr() { return nameMr; }
    public void setNameMr(String nameMr) { this.nameMr = nameMr; }

    public String getVillage() { return village; }
    public void setVillage(String village) { this.village = village; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }

    public String getManagerPhone() { return managerPhone; }
    public void setManagerPhone(String managerPhone) { this.managerPhone = managerPhone; }

    public String getManagerPassword() { return managerPassword; }
    public void setManagerPassword(String managerPassword) { this.managerPassword = managerPassword; }

    public String getManagerRole() { return managerRole; }
    public void setManagerRole(String managerRole) { this.managerRole = managerRole; }
}
