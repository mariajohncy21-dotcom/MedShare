package com.medshare.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Document(collection = "audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {
    @Id
    private String id;

    private String action;

    private String organizationName;

    private String organizationType;

    private String performedBy;

    private String date;

    private String time;

    private String reason;

    private String details;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
