package com.medshare.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "direct_pharmacy_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DirectPharmacyRequest {
    @Id
    private String id;

    private String hospitalId;

    private String hospitalName;

    private String hospitalPhone;

    private String hospitalAddress;

    private String pharmacyId;

    private String pharmacyName;

    private String medicineId;

    private String medicineName;

    private Integer requestedQuantity;

    private Integer acceptedQuantity;

    private String urgency;

    private String requiredBy;

    private String message;

    @Builder.Default
    private String status = "PENDING"; // PENDING, ACCEPTED, PARTIALLY_ACCEPTED, REJECTED

    private String rejectionReason;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt;
}
