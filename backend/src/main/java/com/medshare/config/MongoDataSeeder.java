package com.medshare.config;

import com.medshare.model.*;
import com.medshare.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class MongoDataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final MedicalSourceRepository sourceRepository;
    private final MedicineRepository medicineRepository;
    private final InventoryRepository inventoryRepository;
    private final AuditLogRepository auditLogRepository;

    @Override
    public void run(String... args) {
        log.info("Initializing MedShare MongoDB collections for Tisaiyanvilai (627657)...");

        // 1. Seed Users if empty
        if (userRepository.count() == 0) {
            userRepository.saveAll(List.of(
                User.builder()
                    .id("USR-PAT-001")
                    .name("Rahul Sharma")
                    .email("rahul.patient@medshare.org")
                    .password("$2a$10$demoHashedPasswordHere")
                    .role("PATIENT")
                    .phone("+91 98765 43210")
                    .address("14 Bazaar Street, Tisaiyanvilai - 627657")
                    .city("Tisaiyanvilai")
                    .pincode("627657")
                    .verificationStatus("APPROVED")
                    .accountStatus("ACTIVE")
                    .avatarUrl("https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80")
                    .build(),
                User.builder()
                    .id("USR-PHARM-01")
                    .name("CarePoint 24/7 Pharmacy")
                    .email("contact@carepointpharmacy.com")
                    .password("$2a$10$demoHashedPasswordHere")
                    .role("PHARMACY")
                    .sourceId("SRC-PHARM-01")
                    .phone("+91 98220 11223")
                    .address("Plot 42, Main Bazaar Road, Tisaiyanvilai - 627657")
                    .city("Tisaiyanvilai")
                    .pincode("627657")
                    .verificationStatus("APPROVED")
                    .accountStatus("ACTIVE")
                    .avatarUrl("https://images.unsplash.com/photo-1586015555751-63c237841c7b?w=150&auto=format&fit=crop&q=80")
                    .build(),
                User.builder()
                    .id("USR-HOSP-01")
                    .name("Tisaiyanvilai Government Hospital & Trauma Care")
                    .email("emergency@tisaiyanvilaihosp.org")
                    .password("$2a$10$demoHashedPasswordHere")
                    .role("HOSPITAL")
                    .sourceId("SRC-HOSP-01")
                    .phone("+91 98450 77889")
                    .address("Udangudi Road, Near Bus Stand, Tisaiyanvilai - 627657")
                    .city("Tisaiyanvilai")
                    .pincode("627657")
                    .verificationStatus("APPROVED")
                    .accountStatus("ACTIVE")
                    .avatarUrl("https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=150&auto=format&fit=crop&q=80")
                    .build(),
                User.builder()
                    .id("USR-ADMIN-001")
                    .name("Dr. Ananya Roy (District Drug Controller)")
                    .email("admin@medshare.gov.in")
                    .password("$2a$10$demoHashedPasswordHere")
                    .role("ADMIN")
                    .phone("+91 99000 88000")
                    .address("District Health Operations Hub, Tisaiyanvilai Region - 627657")
                    .city("Tisaiyanvilai")
                    .pincode("627657")
                    .verificationStatus("APPROVED")
                    .accountStatus("ACTIVE")
                    .avatarUrl("https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80")
                    .build()
            ));
            log.info("MongoDB: Seeded {} users.", userRepository.count());
        }

        // 2. Seed Medical Sources if empty
        if (sourceRepository.count() == 0) {
            sourceRepository.saveAll(List.of(
                MedicalSource.builder()
                    .id("SRC-PHARM-01")
                    .name("CarePoint 24/7 Pharmacy")
                    .type("PHARMACY")
                    .ownerName("S. K. Murugan")
                    .address("Plot 42, Main Bazaar Road, Tisaiyanvilai - 627657")
                    .area("Main Bazaar")
                    .city("Tisaiyanvilai")
                    .district("Tirunelveli")
                    .state("Tamil Nadu")
                    .pincode("627657")
                    .phone("+91 98220 11223")
                    .email("carepoint@medshare.org")
                    .operatingHours("Open 24 Hours")
                    .isVerified(true)
                    .verificationStatus("APPROVED")
                    .accountStatus("ACTIVE")
                    .latitude(8.4190)
                    .longitude(77.8740)
                    .rating(4.9)
                    .registrationNumber("TN-TNV-2024-PH-0089")
                    .build(),
                MedicalSource.builder()
                    .id("SRC-PHARM-02")
                    .name("Apex Life Pharmacy")
                    .type("PHARMACY")
                    .ownerName("M. Antony Raj")
                    .address("18 Radhapuram Road, Near Junction, Tisaiyanvilai - 627657")
                    .area("Radhapuram Road")
                    .city("Tisaiyanvilai")
                    .district("Tirunelveli")
                    .state("Tamil Nadu")
                    .pincode("627657")
                    .phone("+91 98331 44556")
                    .email("apexlife@medshare.org")
                    .operatingHours("7:00 AM – 11:30 PM")
                    .isVerified(true)
                    .verificationStatus("APPROVED")
                    .accountStatus("ACTIVE")
                    .latitude(8.4230)
                    .longitude(77.8810)
                    .rating(4.7)
                    .registrationNumber("TN-TNV-2024-PH-0112")
                    .build(),
                MedicalSource.builder()
                    .id("SRC-HOSP-01")
                    .name("Tisaiyanvilai Government Hospital & Trauma Care")
                    .type("HOSPITAL")
                    .ownerName("Dr. P. Sundaram (Medical Superintendent)")
                    .address("Udangudi Road, Emergency Wing, Tisaiyanvilai - 627657")
                    .area("Udangudi Road")
                    .city("Tisaiyanvilai")
                    .district("Tirunelveli")
                    .state("Tamil Nadu")
                    .pincode("627657")
                    .phone("+91 98450 77889")
                    .email("emergency@tisaiyanvilaihosp.org")
                    .operatingHours("Emergency Pharmacy 24/7")
                    .isVerified(true)
                    .verificationStatus("APPROVED")
                    .accountStatus("ACTIVE")
                    .latitude(8.4280)
                    .longitude(77.8650)
                    .rating(4.9)
                    .registrationNumber("TN-GOV-HOSP-TNV-004")
                    .build()
            ));
            log.info("MongoDB: Seeded {} medical sources.", sourceRepository.count());
        }

        // 3. Seed Medicines if empty
        if (medicineRepository.count() == 0) {
            medicineRepository.saveAll(List.of(
                Medicine.builder()
                    .id("MED-01")
                    .name("Paracetamol 500mg")
                    .genericName("Acetaminophen 500mg")
                    .category("Analgesics & Antipyretics")
                    .dosage("500mg Tablet")
                    .unit("tablets")
                    .description("First-line emergency antipyretic and analgesic.")
                    .criticalThreshold(50)
                    .lowThreshold(150)
                    .averageDailyDemand(80)
                    .sampleImageUrl("https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80")
                    .build(),
                Medicine.builder()
                    .id("MED-02")
                    .name("Insulin Glargine 100 IU/ml")
                    .genericName("Recombinant Long-Acting Insulin")
                    .category("Endocrinology")
                    .dosage("100 IU/ml Vial")
                    .unit("vials")
                    .description("Critical 24-hour basal insulin.")
                    .criticalThreshold(15)
                    .lowThreshold(40)
                    .averageDailyDemand(25)
                    .sampleImageUrl("https://images.unsplash.com/photo-1585435557343-3b092031a831?w=300&auto=format&fit=crop&q=80")
                    .build(),
                Medicine.builder()
                    .id("MED-04")
                    .name("Anti-Snake Venom (Polyvalent ASV)")
                    .genericName("Lyophilized Polyvalent Anti-Snake Venom Serum")
                    .category("Toxicology")
                    .dosage("10ml Reconstituted Vial")
                    .unit("vials")
                    .description("Neutralizes venoms of Russell Viper, Cobra, and Krait.")
                    .criticalThreshold(8)
                    .lowThreshold(20)
                    .averageDailyDemand(6)
                    .sampleImageUrl("https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=300&auto=format&fit=crop&q=80")
                    .build()
            ));
            log.info("MongoDB: Seeded {} catalog medicines.", medicineRepository.count());
        }

        // 4. Seed Inventory if empty
        if (inventoryRepository.count() == 0) {
            inventoryRepository.saveAll(List.of(
                MedicineInventory.builder()
                    .id("INV-001")
                    .medicineId("MED-01")
                    .medicineName("Paracetamol 500mg")
                    .sourceId("SRC-PHARM-01")
                    .sourceName("CarePoint 24/7 Pharmacy")
                    .sourceType("PHARMACY")
                    .quantity(120)
                    .batchNumber("BT-PCM-881")
                    .expiryDate(LocalDate.of(2027, 8, 20))
                    .unitPrice(2.5)
                    .expiryStatus("SAFE")
                    .stockStatus("GOOD")
                    .latitude(8.4190)
                    .longitude(77.8740)
                    .dosage("500mg Tablet")
                    .unit("tablets")
                    .updatedAt(LocalDateTime.now())
                    .build(),
                MedicineInventory.builder()
                    .id("INV-004")
                    .medicineId("MED-02")
                    .medicineName("Insulin Glargine 100 IU/ml")
                    .sourceId("SRC-PHARM-01")
                    .sourceName("CarePoint 24/7 Pharmacy")
                    .sourceType("PHARMACY")
                    .quantity(8)
                    .batchNumber("BT-INS-992")
                    .expiryDate(LocalDate.of(2026, 12, 15))
                    .unitPrice(580.0)
                    .expiryStatus("SAFE")
                    .stockStatus("CRITICAL")
                    .latitude(8.4190)
                    .longitude(77.8740)
                    .dosage("100 IU/ml Vial")
                    .unit("vials")
                    .updatedAt(LocalDateTime.now())
                    .build()
            ));
            log.info("MongoDB: Seeded {} inventory batches.", inventoryRepository.count());
        }

        // 5. Seed Audit Logs if empty
        if (auditLogRepository.count() == 0) {
            auditLogRepository.save(
                AuditLog.builder()
                    .id("AUD-001")
                    .action("ORGANIZATION_APPROVED")
                    .organizationName("CarePoint 24/7 Pharmacy")
                    .organizationType("PHARMACY")
                    .performedBy("Dr. Ananya Roy (Admin)")
                    .date("2026-09-06")
                    .time("09:30 AM")
                    .reason("Drug license verified with TN Pharmacy Council portal.")
                    .timestamp(LocalDateTime.now())
                    .build()
            );
        }
    }
}
