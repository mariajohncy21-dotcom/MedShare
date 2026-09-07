package com.medshare.repository;

import com.medshare.model.DirectPharmacyRequest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DirectPharmacyRequestRepository extends MongoRepository<DirectPharmacyRequest, String> {
    List<DirectPharmacyRequest> findByPharmacyId(String pharmacyId);
    List<DirectPharmacyRequest> findByHospitalId(String hospitalId);
    List<DirectPharmacyRequest> findByStatus(String status);
}
