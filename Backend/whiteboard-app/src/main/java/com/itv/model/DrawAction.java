package com.itv.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "draw_actions")
public class DrawAction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "session_id")
    private UUID sessionId;

    @Column(name = "user_id")
    private String userId;

    @Column(name = "action_type")
    private String actionType;

    @Column(name = "payload_json", columnDefinition = "TEXT")
    private String payloadJson;

    private Instant timestamp;

    public DrawAction() {}

    public DrawAction(UUID sessionId, String userId, String actionType, String payloadJson) {
        this.sessionId = sessionId;
        this.userId = userId;
        this.actionType = actionType;
        this.payloadJson = payloadJson;
        this.timestamp = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getSessionId() { return sessionId; }
    public void setSessionId(UUID sessionId) { this.sessionId = sessionId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getActionType() { return actionType; }
    public void setActionType(String actionType) { this.actionType = actionType; }

    public String getPayloadJson() { return payloadJson; }
    public void setPayloadJson(String payloadJson) { this.payloadJson = payloadJson; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
}
