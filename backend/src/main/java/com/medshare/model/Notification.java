package com.medshare.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {
    @Id
    private String id;
    private String userId;
    private String recipientRole; // PATIENT, PHARMACY, HOSPITAL, ADMIN, ALL
    private String title;
    private String message;
    private String type; // CRITICAL_ALERT, SHORTAGE, EXPIRY, ORDER_UPDATE, VERIFICATION
    private boolean read;
    private LocalDateTime timestamp;
    private String actionUrl;
}
