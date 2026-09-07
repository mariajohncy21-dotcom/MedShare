package com.medshare.repository;

import com.medshare.model.AuditLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends MongoRepository<AuditLog, String> {
    List<AuditLog> findByAction(String action);
    List<AuditLog> findAllByOrderByTimestampDesc();
}
