package com.medshare.repository;

import com.medshare.model.MedicineInventory;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryRepository extends MongoRepository<MedicineInventory, String> {
    List<MedicineInventory> findBySourceId(String sourceId);
    List<MedicineInventory> findByMedicineId(String medicineId);
    List<MedicineInventory> findByMedicineIdAndQuantityGreaterThan(String medicineId, Integer minQuantity);
}
