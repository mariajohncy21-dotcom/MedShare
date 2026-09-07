package com.medshare.controller;

import com.medshare.model.Notification;
import com.medshare.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String role) {
        if (userId != null && !userId.isEmpty()) {
            return ResponseEntity.ok(notificationRepository.findByUserIdOrderByTimestampDesc(userId));
        }
        if (role != null && !role.isEmpty()) {
            return ResponseEntity.ok(notificationRepository.findByRecipientRoleInOrderByTimestampDesc(Arrays.asList(role, "ALL")));
        }
        return ResponseEntity.ok(notificationRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<Notification> createNotification(@RequestBody Notification notification) {
        if (notification.getTimestamp() == null) {
            notification.setTimestamp(LocalDateTime.now());
        }
        return ResponseEntity.ok(notificationRepository.save(notification));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Notification> markAsRead(@PathVariable String id) {
        Optional<Notification> opt = notificationRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Notification n = opt.get();
        n.setRead(true);
        return ResponseEntity.ok(notificationRepository.save(n));
    }
}
