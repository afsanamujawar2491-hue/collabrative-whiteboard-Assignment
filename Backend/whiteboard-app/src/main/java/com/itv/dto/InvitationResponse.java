package com.itv.dto;

import java.util.UUID;

public class InvitationResponse {
    private UUID sessionId;
    private String sessionName;

    public UUID getSessionId() { return sessionId; }
    public void setSessionId(UUID sessionId) { this.sessionId = sessionId; }

    public String getSessionName() { return sessionName; }
    public void setSessionName(String sessionName) { this.sessionName = sessionName; }
}
