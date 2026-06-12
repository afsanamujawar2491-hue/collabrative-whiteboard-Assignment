package com.itv.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "whiteboard_sessions")
public class WhiteboardSession {

    @Id
    private UUID id;

    private String name;

    @Column(name = "owner_id")
    private String ownerId;

    @Column(name = "owner_name")
    private String ownerName;

    @Column(columnDefinition = "TEXT")
    private String canvasJson;

    @Column(name = "created_at")
    private Instant createdAt;

    public WhiteboardSession() {}

    public WhiteboardSession(String name, String ownerId, String ownerName) {
        this.id = UUID.randomUUID();
        this.name = name;
        this.ownerId = ownerId;
        this.ownerName = ownerName;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getOwnerId() { return ownerId; }
    public void setOwnerId(String ownerId) { this.ownerId = ownerId; }

    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String ownerName) { this.ownerName = ownerName; }

    public String getCanvasJson() { return canvasJson; }
    public void setCanvasJson(String canvasJson) { this.canvasJson = canvasJson; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
