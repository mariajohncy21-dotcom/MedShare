package com.medshare.service;

import com.medshare.model.MedicineInventory;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class SmartAllocationService {

    public static class AllocationResult {
        public String medicineId;
        public int requestedQuantity;
        public int fulfilledQuantity;
        public boolean isFullyFulfilled;
        public double totalDistanceKm;
        public int estimatedMinutes;
        public List<AllocatedNode> allocatedNodes = new ArrayList<>();
    }

    public static class AllocatedNode {
        public String sourceId;
        public String sourceName;
        public String sourceType;
        public int allocatedQuantity;
        public double distanceKm;
        public String batchNumber;
    }

    public double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c * 10.0) / 10.0;
    }

    public AllocationResult calculateSmartAllocation(
            String medicineId,
            int requiredQuantity,
            String urgency,
            double userLat,
            double userLon,
            List<MedicineInventory> availableInventories) {

        AllocationResult result = new AllocationResult();
        result.medicineId = medicineId;
        result.requestedQuantity = requiredQuantity;

        int remaining = requiredQuantity;
        double maxDistance = 0.0;

        for (MedicineInventory inv : availableInventories) {
            if (remaining <= 0) break;
            if (inv.getQuantity() != null && inv.getQuantity() > 0) {
                int take = Math.min(inv.getQuantity(), remaining);
                AllocatedNode node = new AllocatedNode();
                node.sourceId = inv.getSourceId();
                node.sourceName = inv.getSourceName();
                node.sourceType = inv.getSourceType();
                node.allocatedQuantity = take;
                node.batchNumber = inv.getBatchNumber();
                
                double dist = 1.2;
                if (inv.getLatitude() != null && inv.getLongitude() != null) {
                    dist = calculateDistance(userLat, userLon, inv.getLatitude(), inv.getLongitude());
                }
                node.distanceKm = dist;
                if (dist > maxDistance) {
                    maxDistance = dist;
                }

                result.allocatedNodes.add(node);
                remaining -= take;
            }
        }

        result.fulfilledQuantity = requiredQuantity - remaining;
        result.isFullyFulfilled = remaining == 0;
        result.totalDistanceKm = maxDistance > 0 ? maxDistance : 2.5;
        result.estimatedMinutes = "CRITICAL".equalsIgnoreCase(urgency) ? 15 : 25;

        return result;
    }
}
