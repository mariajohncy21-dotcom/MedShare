package com.medshare.controller;

import com.medshare.model.AuditLog;
import com.medshare.model.MedicalSource;
import com.medshare.repository.AuditLogRepository;
import com.medshare.repository.MedicalSourceRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminController {

    private final MedicalSourceRepository sourceRepository;
    private final AuditLogRepository auditLogRepository;

    @GetMapping("/organizations")
    public ResponseEntity<List<MedicalSource>> getAllOrganizations() {
        return ResponseEntity.ok(sourceRepository.findByIsDeletedFalse());
    }

    @GetMapping("/verifications/{status}")
    public ResponseEntity<List<MedicalSource>> getVerificationsByStatus(@PathVariable String status) {
        return ResponseEntity.ok(sourceRepository.findByVerificationStatus(status.toUpperCase()));
    }

    @PostMapping("/organizations/{id}/approve")
    public ResponseEntity<?> approveOrganization(@PathVariable String id) {
        Optional<MedicalSource> srcOpt = sourceRepository.findById(id);
        if (srcOpt.isEmpty()) return ResponseEntity.notFound().build();

        MedicalSource src = srcOpt.get();
        src.setVerified(true);
        src.setVerificationStatus("APPROVED");
        src.setAccountStatus("ACTIVE");
        src.setVerifiedAt(LocalDateTime.now());
        MedicalSource saved = sourceRepository.save(src);

        auditLogRepository.save(
            AuditLog.builder()
                .action("ORGANIZATION_APPROVED")
                .organizationName(src.getName())
                .organizationType(src.getType())
                .performedBy("Dr. Ananya Roy (Admin)")
                .date(LocalDate.now().toString())
                .time("Now")
                .reason("Drug license verified with TN Pharmacy Council portal.")
                .build()
        );

        return ResponseEntity.ok(saved);
    }

    @Data
    public static class ReasonRequest {
        private String reason;
    }

    @PostMapping("/organizations/{id}/reject")
    public ResponseEntity<?> rejectOrganization(@PathVariable String id, @RequestBody ReasonRequest req) {
        Optional<MedicalSource> srcOpt = sourceRepository.findById(id);
        if (srcOpt.isEmpty()) return ResponseEntity.notFound().build();

        MedicalSource src = srcOpt.get();
        src.setVerified(false);
        src.setVerificationStatus("REJECTED");
        src.setAccountStatus("PENDING");
        src.setRejectionReason(req.getReason());
        MedicalSource saved = sourceRepository.save(src);

        auditLogRepository.save(
            AuditLog.builder()
                .action("ORGANIZATION_REJECTED")
                .organizationName(src.getName())
                .organizationType(src.getType())
                .performedBy("Dr. Ananya Roy (Admin)")
                .date(LocalDate.now().toString())
                .time("Now")
                .reason("Verification rejected: " + req.getReason())
                .build()
        );

        return ResponseEntity.ok(saved);
    }

    @PostMapping("/organizations/{id}/suspend")
    public ResponseEntity<?> suspendOrganization(@PathVariable String id, @RequestBody ReasonRequest req) {
        Optional<MedicalSource> srcOpt = sourceRepository.findById(id);
        if (srcOpt.isEmpty()) return ResponseEntity.notFound().build();

        MedicalSource src = srcOpt.get();
        src.setVerified(false);
        src.setVerificationStatus("SUSPENDED");
        src.setAccountStatus("SUSPENDED");
        src.setSuspensionReason(req.getReason());
        MedicalSource saved = sourceRepository.save(src);

        auditLogRepository.save(
            AuditLog.builder()
                .action("ORGANIZATION_SUSPENDED")
                .organizationName(src.getName())
                .organizationType(src.getType())
                .performedBy("Dr. Ananya Roy (Admin)")
                .date(LocalDate.now().toString())
                .time("Now")
                .reason("Facility suspended: " + req.getReason())
                .build()
        );

        return ResponseEntity.ok(saved);
    }

    @PostMapping("/organizations/{id}/reactivate")
    public ResponseEntity<?> reactivateOrganization(@PathVariable String id) {
        Optional<MedicalSource> srcOpt = sourceRepository.findById(id);
        if (srcOpt.isEmpty()) return ResponseEntity.notFound().build();

        MedicalSource src = srcOpt.get();
        src.setVerified(true);
        src.setVerificationStatus("APPROVED");
        src.setAccountStatus("ACTIVE");
        src.setSuspensionReason(null);
        MedicalSource saved = sourceRepository.save(src);

        auditLogRepository.save(
            AuditLog.builder()
                .action("ORGANIZATION_REACTIVATED")
                .organizationName(src.getName())
                .organizationType(src.getType())
                .performedBy("Dr. Ananya Roy (Admin)")
                .date(LocalDate.now().toString())
                .time("Now")
                .reason("Facility restored to active grid operations.")
                .build()
        );

        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/organizations/{id}")
    public ResponseEntity<?> softDeleteOrganization(@PathVariable String id) {
        Optional<MedicalSource> srcOpt = sourceRepository.findById(id);
        if (srcOpt.isEmpty()) return ResponseEntity.notFound().build();

        MedicalSource src = srcOpt.get();
        src.setDeleted(true);
        src.setVerified(false);
        src.setAccountStatus("DELETED");
        MedicalSource saved = sourceRepository.save(src);

        auditLogRepository.save(
            AuditLog.builder()
                .action("ORGANIZATION_DELETED")
                .organizationName(src.getName())
                .organizationType(src.getType())
                .performedBy("Dr. Ananya Roy (Admin)")
                .date(LocalDate.now().toString())
                .time("Now")
                .reason("Facility soft-deleted in MongoDB. Historical records preserved for compliance auditing.")
                .build()
        );

        return ResponseEntity.ok(Map.of("message", "Organization soft-deleted successfully.", "organization", saved));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLog>> getAuditLogs() {
        return ResponseEntity.ok(auditLogRepository.findAllByOrderByTimestampDesc());
    }
}
