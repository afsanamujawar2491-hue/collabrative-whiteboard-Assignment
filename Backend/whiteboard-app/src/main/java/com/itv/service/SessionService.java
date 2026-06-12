package com.itv.service;

import com.itv.dto.SessionResponse;
import com.itv.model.WhiteboardSession;
import com.itv.repository.SessionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class SessionService {

    private final SessionRepository sessionRepository;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public SessionService(SessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    public SessionResponse createSession(String name, String ownerId, String ownerName) {
        String sessionName = (name != null && !name.isBlank()) ? name : "Whiteboard Session";
        WhiteboardSession session = new WhiteboardSession(sessionName, ownerId, ownerName);
        sessionRepository.save(session);
        return toResponse(session);
    }

    public SessionResponse getSession(UUID id) {
        WhiteboardSession session = sessionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Session not found"));
        return toResponse(session);
    }

    public String getCanvasState(UUID id) {
        WhiteboardSession session = sessionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Session not found"));
        return session.getCanvasJson();
    }

    public void saveCanvasState(UUID id, String canvasJson) {
        WhiteboardSession session = sessionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Session not found"));
        session.setCanvasJson(canvasJson);
        sessionRepository.save(session);
    }

    private SessionResponse toResponse(WhiteboardSession session) {
        SessionResponse response = new SessionResponse();
        response.setId(session.getId());
        response.setName(session.getName());
        response.setOwnerId(session.getOwnerId());
        response.setOwnerName(session.getOwnerName());
        response.setCreatedAt(session.getCreatedAt());
        response.setShareUrl(frontendUrl + "/board/" + session.getId());
        return response;
    }
}
