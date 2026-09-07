package com.medshare.controller;

import com.medshare.model.Medicine;
import com.medshare.model.MedicineInventory;
import com.medshare.model.MedicalSource;
import com.medshare.repository.InventoryRepository;
import com.medshare.repository.MedicalSourceRepository;
import com.medshare.repository.MedicineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/medicines")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MedicineController {

    private final MedicineRepository medicineRepository;
    private final InventoryRepository inventoryRepository;
    private final MedicalSourceRepository sourceRepository;

    @GetMapping
    public ResponseEntity<List<Medicine>> getAllMedicines() {
        return ResponseEntity.ok(medicineRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getMedicineById(@PathVariable String id) {
        return medicineRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchStock(
            @RequestParam String medicineId,
            @RequestParam(defaultValue = "8.4184") Double lat,
            @RequestParam(defaultValue = "77.8732") Double lon,
            @RequestParam(defaultValue = "5.0") Double radiusKm) {

        List<MedicineInventory> inventories = inventoryRepository.findByMedicineIdAndQuantityGreaterThan(medicineId, 0);
        return ResponseEntity.ok(inventories);
    }
}
