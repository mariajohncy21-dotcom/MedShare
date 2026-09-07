package com.medshare.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Document(collection = "inventories")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicineInventory {
    @Id
    private String id;

    private String medicineId;

    private String medicineName;

    private String sourceId;

    private String sourceName;

    private String sourceType; // PHARMACY, HOSPITAL

    private Integer quantity;

    private String batchNumber;

    private LocalDate expiryDate;

    private Double unitPrice;

    private String expiryStatus; // SAFE, EXPIRING_SOON, EXPIRED

    private String stockStatus; // GOOD, LOW, CRITICAL, OUT_OF_STOCK

    private Double latitude;

    private Double longitude;

    private String dosage;

    private String unit;

    private String lastUpdatedBy;

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
