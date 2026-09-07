package com.medshare.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "medical_sources")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicalSource {
    @Id
    private String id;

    private String name;

    private String type; // PHARMACY, HOSPITAL

    private String ownerName;

    private String address;

    private String area;

    private String city;

    private String district;

    private String state;

    private String pincode;

    private String phone;

    private String email;

    private String operatingHours;

    @Builder.Default
    private boolean isVerified = true;

    @Builder.Default
    private String verificationStatus = "APPROVED"; // PENDING, APPROVED, REJECTED, SUSPENDED

    @Builder.Default
    private String accountStatus = "ACTIVE"; // ACTIVE, PENDING, SUSPENDED, DELETED

    @Builder.Default
    private boolean isDeleted = false;

    private Double latitude;

    private Double longitude;

    @Builder.Default
    private Double rating = 4.8;

    @Builder.Default
    private boolean emergencySupport24x7 = true;

    private String registrationNumber;

    private String documentUrl;

    private String logoUrl;

    private LocalDateTime submittedAt;

    private LocalDateTime verifiedAt;

    private String rejectionReason;

    private String suspensionReason;
}
