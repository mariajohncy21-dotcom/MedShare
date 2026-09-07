package com.medshare.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "emergency_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmergencyRequest {
    @Id
    private String id;

    private String patientName;

    private String patientPhone;

    private String medicineId;

    private String medicineName;

    private Integer quantity;

    private String urgency; // URGENT, CRITICAL

    private String location;

    private Double latitude;

    private Double longitude;

    private String additionalNotes;

    @Builder.Default
    private String status = "BROADCASTING"; // BROADCASTING, MATCHED, FULFILLED, CANCELLED

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private Integer matchedSourcesCount = 3;
}
