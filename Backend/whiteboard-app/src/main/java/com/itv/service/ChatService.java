package com.itv.service;

import com.itv.model.ChatMessage;
import com.itv.repository.ChatMessageRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;

    public ChatService(ChatMessageRepository chatMessageRepository) {
        this.chatMessageRepository = chatMessageRepository;
    }

    public ChatMessage saveMessage(UUID sessionId, String userId, String username, String content) {
        ChatMessage message = new ChatMessage(sessionId, userId, username, content);
        return chatMessageRepository.save(message);
    }

    public List<ChatMessage> getHistory(UUID sessionId) {
        return chatMessageRepository.findBySessionIdOrderByTimestampAsc(sessionId);
    }
}
