package com.medshare.repository;

import com.medshare.model.MedicalSource;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicalSourceRepository extends MongoRepository<MedicalSource, String> {
    List<MedicalSource> findByType(String type);
    List<MedicalSource> findByVerificationStatus(String status);
    List<MedicalSource> findByIsDeletedFalse();
    List<MedicalSource> findByVerificationStatusAndAccountStatusAndIsDeletedFalse(String verificationStatus, String accountStatus);
}
