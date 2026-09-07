package com.medshare.controller;

import com.medshare.model.AuditLog;
import com.medshare.model.DirectPharmacyRequest;
import com.medshare.model.EmergencyRequest;
import com.medshare.repository.AuditLogRepository;
import com.medshare.repository.DirectPharmacyRequestRepository;
import com.medshare.repository.EmergencyRequestRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/emergency")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EmergencyController {

    private final EmergencyRequestRepository emergencyRepository;
    private final DirectPharmacyRequestRepository directPharmacyRequestRepository;
    private final AuditLogRepository auditLogRepository;

    @GetMapping("/broadcasts")
    public ResponseEntity<List<EmergencyRequest>> getAllBroadcasts() {
        return ResponseEntity.ok(emergencyRepository.findAll());
    }

    @PostMapping("/broadcast")
    public ResponseEntity<?> createBroadcast(@RequestBody EmergencyRequest req) {
        req.setCreatedAt(LocalDateTime.now());
        EmergencyRequest saved = emergencyRepository.save(req);

        auditLogRepository.save(
            AuditLog.builder()
                .action("EMERGENCY_REQUEST_CREATED")
                .organizationName(req.getLocation())
                .organizationType("PATIENT")
                .performedBy(req.getPatientName())
                .date(LocalDate.now().toString())
                .time("Now")
                .reason("Emergency broadcast for " + req.getQuantity() + " units of " + req.getMedicineName())
                .build()
        );

        return ResponseEntity.ok(saved);
    }

    @GetMapping("/hospital-requests/{pharmacyId}")
    public ResponseEntity<List<DirectPharmacyRequest>> getPharmacyRequests(@PathVariable String pharmacyId) {
        return ResponseEntity.ok(directPharmacyRequestRepository.findByPharmacyId(pharmacyId));
    }

    @PostMapping("/hospital-request")
    public ResponseEntity<?> sendHospitalRequest(@RequestBody DirectPharmacyRequest req) {
        req.setCreatedAt(LocalDateTime.now());
        req.setStatus("PENDING");
        DirectPharmacyRequest saved = directPharmacyRequestRepository.save(req);

        auditLogRepository.save(
            AuditLog.builder()
                .action("EMERGENCY_REQUEST_CREATED")
                .organizationName(req.getHospitalName())
                .organizationType("HOSPITAL")
                .performedBy("Hospital ICU Duty Officer")
                .date(LocalDate.now().toString())
                .time("Now")
                .reason("Hospital requested " + req.getRequestedQuantity() + " units of " + req.getMedicineName() + " from " + req.getPharmacyName())
                .build()
        );

        return ResponseEntity.ok(saved);
    }

    @Data
    public static class RespondRequest {
        private String status; // ACCEPTED, PARTIALLY_ACCEPTED, REJECTED
        private Integer acceptedQuantity;
        private String rejectionReason;
    }

    @PatchMapping("/hospital-request/{id}/respond")
    public ResponseEntity<?> respondToHospitalRequest(
            @PathVariable String id,
            @RequestBody RespondRequest req) {

        Optional<DirectPharmacyRequest> reqOpt = directPharmacyRequestRepository.findById(id);
        if (reqOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        DirectPharmacyRequest directReq = reqOpt.get();
        directReq.setStatus(req.getStatus());
        directReq.setAcceptedQuantity(req.getAcceptedQuantity());
        directReq.setRejectionReason(req.getRejectionReason());
        directReq.setUpdatedAt(LocalDateTime.now());

        DirectPharmacyRequest saved = directPharmacyRequestRepository.save(directReq);

        auditLogRepository.save(
            AuditLog.builder()
                .action("DIRECT_REQUEST_ACCEPTED".equals(req.getStatus()) ? "DIRECT_REQUEST_ACCEPTED" : "DIRECT_REQUEST_PARTIALLY_ACCEPTED")
                .organizationName(directReq.getPharmacyName())
                .organizationType("PHARMACY")
                .performedBy("Dispensary Pharmacist")
                .date(LocalDate.now().toString())
                .time("Now")
                .reason("Request " + req.getStatus() + " (" + (req.getAcceptedQuantity() != null ? req.getAcceptedQuantity() : directReq.getRequestedQuantity()) + "/" + directReq.getRequestedQuantity() + " units).")
                .build()
        );

        return ResponseEntity.ok(saved);
    }
}
