package com.medshare.controller;

import com.medshare.model.AuditLog;
import com.medshare.model.MedicineInventory;
import com.medshare.repository.AuditLogRepository;
import com.medshare.repository.InventoryRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class InventoryController {

    private final InventoryRepository inventoryRepository;
    private final AuditLogRepository auditLogRepository;

    @GetMapping
    public ResponseEntity<List<MedicineInventory>> getAllInventory() {
        return ResponseEntity.ok(inventoryRepository.findAll());
    }

    @GetMapping("/source/{sourceId}")
    public ResponseEntity<List<MedicineInventory>> getSourceInventory(@PathVariable String sourceId) {
        return ResponseEntity.ok(inventoryRepository.findBySourceId(sourceId));
    }

    @PostMapping
    public ResponseEntity<?> addStock(@RequestBody MedicineInventory item) {
        item.setUpdatedAt(LocalDateTime.now());
        MedicineInventory saved = inventoryRepository.save(item);

        auditLogRepository.save(
            AuditLog.builder()
                .action("INVENTORY_UPDATED")
                .organizationName(item.getSourceName())
                .organizationType(item.getSourceType())
                .performedBy(item.getLastUpdatedBy() != null ? item.getLastUpdatedBy() : "Dispensary Operator")
                .date(LocalDate.now().toString())
                .time("Now")
                .reason("Batch " + item.getBatchNumber() + " registered with " + item.getQuantity() + " units in MongoDB.")
                .build()
        );

        return ResponseEntity.ok(saved);
    }

    @Data
    public static class UpdateQuantityRequest {
        private Integer newQuantity;
        private String reason;
        private String updatedBy;
    }

    @PatchMapping("/{id}/quantity")
    public ResponseEntity<?> updateQuantity(
            @PathVariable String id,
            @RequestBody UpdateQuantityRequest req) {

        Optional<MedicineInventory> invOpt = inventoryRepository.findById(id);
        if (invOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        MedicineInventory inv = invOpt.get();
        int previousQty = inv.getQuantity() != null ? inv.getQuantity() : 0;
        inv.setQuantity(Math.max(0, req.getNewQuantity()));
        inv.setUpdatedAt(LocalDateTime.now());
        if (req.getUpdatedBy() != null) {
            inv.setLastUpdatedBy(req.getUpdatedBy());
        }

        MedicineInventory saved = inventoryRepository.save(inv);

        auditLogRepository.save(
            AuditLog.builder()
                .action("INVENTORY_UPDATED")
                .organizationName(inv.getSourceName())
                .organizationType(inv.getSourceType())
                .performedBy(req.getUpdatedBy() != null ? req.getUpdatedBy() : "Dispensary Operator")
                .date(LocalDate.now().toString())
                .time("Now")
                .reason("Stock updated (" + previousQty + " -> " + req.getNewQuantity() + "): " + (req.getReason() != null ? req.getReason() : "Manual edit"))
                .build()
        );

        return ResponseEntity.ok(saved);
    }
}
