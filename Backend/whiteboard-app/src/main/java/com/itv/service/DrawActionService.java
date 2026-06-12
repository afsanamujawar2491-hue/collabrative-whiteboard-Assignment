package com.itv.service;

import com.itv.model.DrawAction;
import com.itv.repository.DrawActionRepository;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class DrawActionService {

    private final DrawActionRepository drawActionRepository;

    public DrawActionService(DrawActionRepository drawActionRepository) {
        this.drawActionRepository = drawActionRepository;
    }

    public void saveAction(UUID sessionId, String userId, String actionType, String payloadJson) {
        if (actionType.equals("CURSOR_MOVE") || actionType.equals("STATE_REQUEST")) {
            return;
        }
        DrawAction action = new DrawAction(sessionId, userId, actionType, payloadJson);
        drawActionRepository.save(action);
    }

    public java.util.List<DrawAction> getActions(UUID sessionId) {
        return drawActionRepository.findBySessionIdOrderByTimestampAsc(sessionId);
    }
}
