package com.itv.controller;

import com.itv.model.BoardMessage;
import com.itv.model.MessageType;
import com.itv.service.ChatService;
import com.itv.service.DrawActionService;
import com.itv.service.SessionService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.UUID;

@Controller
public class WhiteboardController {

    private final SimpMessagingTemplate messagingTemplate;
    private final SessionService sessionService;
    private final DrawActionService drawActionService;
    private final ChatService chatService;

    public WhiteboardController(
            SimpMessagingTemplate messagingTemplate,
            SessionService sessionService,
            DrawActionService drawActionService,
            ChatService chatService) {
        this.messagingTemplate = messagingTemplate;
        this.sessionService = sessionService;
        this.drawActionService = drawActionService;
        this.chatService = chatService;
    }

    @MessageMapping("/draw")
    public void handleDraw(BoardMessage message) {
        if (message.getTimestamp() == 0) {
            message.setTimestamp(System.currentTimeMillis());
        }

        String topic = "/topic/board/" + message.getSessionId();

        if (message.getType() == MessageType.STATE_REQUEST) {
            String canvasJson = sessionService.getCanvasState(UUID.fromString(message.getSessionId()));
            BoardMessage sync = new BoardMessage();
            sync.setSessionId(message.getSessionId());
            sync.setType(MessageType.STATE_SYNC);
            sync.setPayload(canvasJson != null ? canvasJson : "{}");
            sync.setTimestamp(System.currentTimeMillis());
            messagingTemplate.convertAndSend(topic, sync);
            return;
        }

        if (message.getType() == MessageType.STATE_SYNC && message.getPayload() != null) {
            sessionService.saveCanvasState(
                UUID.fromString(message.getSessionId()), message.getPayload());
        }

        if (message.getType() != null && message.getType() != MessageType.CURSOR_MOVE) {
            drawActionService.saveAction(
                UUID.fromString(message.getSessionId()),
                message.getUserId(),
                message.getType().name(),
                message.getPayload());
        }

        messagingTemplate.convertAndSend(topic, message);
    }

    @MessageMapping("/chat")
    public void handleChat(BoardMessage message) {
        if (message.getTimestamp() == 0) {
            message.setTimestamp(System.currentTimeMillis());
        }

        chatService.saveMessage(
            UUID.fromString(message.getSessionId()),
            message.getUserId(),
            message.getUsername(),
            message.getPayload());

        messagingTemplate.convertAndSend(
            "/topic/board/" + message.getSessionId() + "/chat", message);
    }

    @MessageMapping("/cursor")
    public void handleCursor(BoardMessage message) {
        if (message.getTimestamp() == 0) {
            message.setTimestamp(System.currentTimeMillis());
        }
        message.setType(MessageType.CURSOR_MOVE);
        messagingTemplate.convertAndSend(
            "/topic/board/" + message.getSessionId() + "/cursor", message);
    }
}
