package com.gharpoch.dto;

import java.util.UUID;

public class OrderStatusHistoryResponse {
    private UUID id;
    private String oldStatus;
    private String newStatus;
    private String changedByName;
    private String roleAtChange;
    private String reason;
    private String createdAt;

    public OrderStatusHistoryResponse() {}

    public OrderStatusHistoryResponse(UUID id, String oldStatus, String newStatus, String changedByName, String roleAtChange, String reason, String createdAt) {
        this.id = id;
        this.oldStatus = oldStatus;
        this.newStatus = newStatus;
        this.changedByName = changedByName;
        this.roleAtChange = roleAtChange;
        this.reason = reason;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getOldStatus() { return oldStatus; }
    public void setOldStatus(String oldStatus) { this.oldStatus = oldStatus; }

    public String getNewStatus() { return newStatus; }
    public void setNewStatus(String newStatus) { this.newStatus = newStatus; }

    public String getChangedByName() { return changedByName; }
    public void setChangedByName(String changedByName) { this.changedByName = changedByName; }

    public String getRoleAtChange() { return roleAtChange; }
    public void setRoleAtChange(String roleAtChange) { this.roleAtChange = roleAtChange; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
