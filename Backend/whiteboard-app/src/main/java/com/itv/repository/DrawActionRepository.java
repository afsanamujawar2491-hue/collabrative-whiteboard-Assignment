package com.itv.repository;

import com.itv.model.DrawAction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DrawActionRepository extends JpaRepository<DrawAction, UUID> {
    List<DrawAction> findBySessionIdOrderByTimestampAsc(UUID sessionId);
}
