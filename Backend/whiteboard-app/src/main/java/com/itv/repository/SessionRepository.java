package com.itv.repository;

import com.itv.model.WhiteboardSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface SessionRepository extends JpaRepository<WhiteboardSession, UUID> {
}
