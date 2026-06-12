package com.itv.dto;

public class InviteResponse {
    private String joinUrl;
    private boolean emailSent;
    private String message;

    public String getJoinUrl() { return joinUrl; }
    public void setJoinUrl(String joinUrl) { this.joinUrl = joinUrl; }

    public boolean isEmailSent() { return emailSent; }
    public void setEmailSent(boolean emailSent) { this.emailSent = emailSent; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
