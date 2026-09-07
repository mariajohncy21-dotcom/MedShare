package com.medshare.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "reservations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reservation {
    @Id
    private String id; // e.g. MED-4587

    private String userId;

    private String userName;

    private String userPhone;

    private String medicineId;

    private String medicineName;

    private Integer totalQuantity;

    private String urgency; // NORMAL, URGENT, CRITICAL

    @Builder.Default
    private String status = "CONFIRMED"; // PENDING, CONFIRMED, COLLECTED, EXPIRED, CANCELLED

    private LocalDateTime createdAt;

    private LocalDateTime expiresAt;

    private String qrToken;

    private List<SourceBreakdown> allocationBreakdown;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SourceBreakdown {
        private String sourceId;
        private String sourceName;
        private Integer quantity;
        private String address;
        private String phone;
        private String sourceStatus; // PENDING, CONFIRMED, COLLECTED
    }
}
