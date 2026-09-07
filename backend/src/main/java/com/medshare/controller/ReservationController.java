package com.medshare.controller;

import com.medshare.model.AuditLog;
import com.medshare.model.MedicineInventory;
import com.medshare.model.Reservation;
import com.medshare.repository.AuditLogRepository;
import com.medshare.repository.InventoryRepository;
import com.medshare.repository.ReservationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/reservations")
@CrossOrigin(origins = "*")
public class ReservationController {

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @GetMapping
    public ResponseEntity<List<Reservation>> getReservations(@RequestParam(required = false) String userId) {
        if (userId != null && !userId.isEmpty()) {
            return ResponseEntity.ok(reservationRepository.findByUserId(userId));
        }
        return ResponseEntity.ok(reservationRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Reservation> getReservationById(@PathVariable String id) {
        return reservationRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Reservation> createReservation(@RequestBody Reservation reservation) {
        if (reservation.getId() == null || reservation.getId().isEmpty()) {
            reservation.setId("MED-" + (int)(1000 + Math.random() * 9000));
        }
        reservation.setCreatedAt(LocalDateTime.now());
        if (reservation.getExpiresAt() == null) {
            // 15-minute hold window
            reservation.setExpiresAt(LocalDateTime.now().plusMinutes(15));
        }
        if (reservation.getQrToken() == null) {
            reservation.setQrToken(UUID.randomUUID().toString());
        }
        if (reservation.getStatus() == null) {
            reservation.setStatus("CONFIRMED");
        }

        // Deduct inventory reserved
        if (reservation.getAllocationBreakdown() != null) {
            for (Reservation.SourceBreakdown sb : reservation.getAllocationBreakdown()) {
                Optional<MedicineInventory> invOpt = inventoryRepository.findBySourceIdAndMedicineId(sb.getSourceId(), reservation.getMedicineId());
                if (invOpt.isPresent()) {
                    MedicineInventory inv = invOpt.get();
                    int qty = sb.getQuantity() != null ? sb.getQuantity() : 0;
                    inv.setQuantity(Math.max(0, inv.getQuantity() - qty));
                    inv.setReservedQuantity(inv.getReservedQuantity() + qty);
                    inventoryRepository.save(inv);
                }
            }
        }

        Reservation saved = reservationRepository.save(reservation);

        // Audit Log
        auditLogRepository.save(AuditLog.builder()
                .action("RESERVATION_CREATED")
                .targetType("RESERVATION")
                .targetId(saved.getId())
                .actorName(saved.getUserName() != null ? saved.getUserName() : "Normal User")
                .actorRole("PATIENT")
                .details("Created 15-min QR reservation for " + saved.getTotalQuantity() + " units of " + saved.getMedicineName())
                .timestamp(LocalDateTime.now())
                .build());

        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable String id, @RequestParam String status) {
        Optional<Reservation> resOpt = reservationRepository.findById(id);
        if (resOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Reservation res = resOpt.get();
        String oldStatus = res.getStatus();
        res.setStatus(status.toUpperCase());

        // If cancelled or expired, restore inventory
        if (("CANCELLED".equalsIgnoreCase(status) || "EXPIRED".equalsIgnoreCase(status)) && !"CANCELLED".equalsIgnoreCase(oldStatus) && !"EXPIRED".equalsIgnoreCase(oldStatus)) {
            if (res.getAllocationBreakdown() != null) {
                for (Reservation.SourceBreakdown sb : res.getAllocationBreakdown()) {
                    Optional<MedicineInventory> invOpt = inventoryRepository.findBySourceIdAndMedicineId(sb.getSourceId(), res.getMedicineId());
                    if (invOpt.isPresent()) {
                        MedicineInventory inv = invOpt.get();
                        int qty = sb.getQuantity() != null ? sb.getQuantity() : 0;
                        inv.setQuantity(inv.getQuantity() + qty);
                        inv.setReservedQuantity(Math.max(0, inv.getReservedQuantity() - qty));
                        inventoryRepository.save(inv);
                    }
                }
            }
        }

        Reservation saved = reservationRepository.save(res);

        // Audit Log
        auditLogRepository.save(AuditLog.builder()
                .action("RESERVATION_STATUS_UPDATED")
                .targetType("RESERVATION")
                .targetId(saved.getId())
                .actorName("System / User")
                .actorRole("PATIENT")
                .details("Reservation " + saved.getId() + " status updated from " + oldStatus + " to " + status)
                .timestamp(LocalDateTime.now())
                .build());

        return ResponseEntity.ok(saved);
    }
}
