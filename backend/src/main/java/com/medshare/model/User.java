package com.medshare.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    private String id;

    private String name;

    @Indexed(unique = true)
    private String email;

    private String password;

    private String role; // PATIENT, PHARMACY, HOSPITAL, ADMIN

    private String phone;

    private String sourceId; // Linked Pharmacy or Hospital MedicalSource ID

    private String address;

    private String avatarUrl;

    private String city;

    private String pincode;

    @Builder.Default
    private String verificationStatus = "APPROVED"; // PENDING, APPROVED, REJECTED, SUSPENDED

    @Builder.Default
    private String accountStatus = "ACTIVE"; // ACTIVE, PENDING, SUSPENDED, DELETED

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
