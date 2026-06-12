package com.itv.controller;

import com.itv.dto.ChatMessageResponse;
import com.itv.dto.InvitationResponse;
import com.itv.model.ChatMessage;
import com.itv.service.ChatService;
import com.itv.service.InvitationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class InvitationController {

    private final InvitationService invitationService;
    private final ChatService chatService;

    public InvitationController(InvitationService invitationService, ChatService chatService) {
        this.invitationService = invitationService;
        this.chatService = chatService;
    }

    @GetMapping("/invitations/{token}")
    public ResponseEntity<InvitationResponse> resolveInvitation(@PathVariable String token) {
        return ResponseEntity.ok(invitationService.resolveToken(token));
    }

    @GetMapping("/sessions/{id}/chat")
    public ResponseEntity<List<ChatMessageResponse>> getChatHistory(@PathVariable UUID id) {
        List<ChatMessageResponse> messages = chatService.getHistory(id).stream()
            .map(this::toChatResponse)
            .toList();
        return ResponseEntity.ok(messages);
    }

    private ChatMessageResponse toChatResponse(ChatMessage message) {
        ChatMessageResponse response = new ChatMessageResponse();
        response.setId(message.getId());
        response.setSessionId(message.getSessionId());
        response.setUserId(message.getUserId());
        response.setUsername(message.getUsername());
        response.setContent(message.getContent());
        response.setTimestamp(message.getTimestamp());
        return response;
    }
}
