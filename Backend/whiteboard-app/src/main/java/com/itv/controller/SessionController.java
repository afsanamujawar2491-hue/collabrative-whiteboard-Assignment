package com.itv.controller;

import com.itv.dto.*;
import com.itv.model.DrawAction;
import com.itv.service.DrawActionService;
import com.itv.service.InvitationService;
import com.itv.service.SessionService;
import com.itv.util.JwtUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    private final SessionService sessionService;
    private final DrawActionService drawActionService;
    private final InvitationService invitationService;

    public SessionController(
            SessionService sessionService,
            DrawActionService drawActionService,
            InvitationService invitationService) {
        this.sessionService = sessionService;
        this.drawActionService = drawActionService;
        this.invitationService = invitationService;
    }

    @PostMapping
    public ResponseEntity<SessionResponse> createSession(
            @RequestBody(required = false) CreateSessionRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        String name = request != null ? request.getName() : null;
        SessionResponse session = sessionService.createSession(
            name, JwtUtils.getUserId(jwt), JwtUtils.getUsername(jwt));
        return ResponseEntity.ok(session);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SessionResponse> getSession(@PathVariable UUID id) {
        return ResponseEntity.ok(sessionService.getSession(id));
    }

    @GetMapping("/{id}/state")
    public ResponseEntity<CanvasStateResponse> getState(@PathVariable UUID id) {
        CanvasStateResponse response = new CanvasStateResponse();
        String state = sessionService.getCanvasState(id);
        response.setCanvasJson(state != null ? state : "{}");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/invite")
    public ResponseEntity<InviteResponse> invite(
            @PathVariable UUID id,
            @RequestBody InviteRequest request) {
        return ResponseEntity.ok(invitationService.sendInvitation(id, request.getEmail()));
    }

    @GetMapping("/{id}/actions")
    public ResponseEntity<List<DrawActionResponse>> getActions(@PathVariable UUID id) {
        List<DrawActionResponse> actions = drawActionService.getActions(id).stream()
            .map(this::toActionResponse)
            .toList();
        return ResponseEntity.ok(actions);
    }

    private DrawActionResponse toActionResponse(DrawAction action) {
        DrawActionResponse response = new DrawActionResponse();
        response.setId(action.getId());
        response.setSessionId(action.getSessionId());
        response.setUserId(action.getUserId());
        response.setActionType(action.getActionType());
        response.setPayloadJson(action.getPayloadJson());
        response.setTimestamp(action.getTimestamp());
        return response;
    }
}
