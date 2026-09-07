package com.medshare.repository;

import com.medshare.model.EmergencyRequest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmergencyRequestRepository extends MongoRepository<EmergencyRequest, String> {
    List<EmergencyRequest> findByStatus(String status);
}
