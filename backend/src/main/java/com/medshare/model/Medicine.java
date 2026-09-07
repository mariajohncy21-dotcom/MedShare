package com.medshare.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "medicines")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Medicine {
    @Id
    private String id;

    private String name;

    private String genericName;

    private String category;

    private String dosage;

    private String unit;

    private String description;

    private Integer criticalThreshold;

    private Integer lowThreshold;

    private Integer averageDailyDemand;

    private String sampleImageUrl;

    private String barcode;
}
