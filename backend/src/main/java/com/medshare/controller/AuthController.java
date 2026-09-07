package com.medshare.controller;

import com.medshare.model.User;
import com.medshare.repository.UserRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserRepository userRepository;

    @Data
    public static class LoginRequest {
        private String email;
        private String password;
        private String role;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        Optional<User> userOpt = userRepository.findByEmail(req.getEmail());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            return ResponseEntity.ok(Map.of(
                "token", "jwt-token-" + user.getId() + "-" + System.currentTimeMillis(),
                "user", user
            ));
        }

        // Fallback demo user response for instant testing
        User demoUser = User.builder()
                .id("USR-" + (req.getRole() != null ? req.getRole() : "DEMO") + "-001")
                .name(req.getEmail().split("@")[0])
                .email(req.getEmail())
                .role(req.getRole() != null ? req.getRole() : "PATIENT")
                .verificationStatus("APPROVED")
                .accountStatus("ACTIVE")
                .build();

        return ResponseEntity.ok(Map.of(
            "token", "jwt-demo-token-" + System.currentTimeMillis(),
            "user", demoUser
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        if (user.getRole() != null && ("PHARMACY".equals(user.getRole()) || "HOSPITAL".equals(user.getRole()))) {
            user.setVerificationStatus("PENDING");
            user.setAccountStatus("PENDING");
        } else {
            user.setVerificationStatus("APPROVED");
            user.setAccountStatus("ACTIVE");
        }

        User saved = userRepository.save(user);
        return ResponseEntity.ok(Map.of(
            "message", "Registration recorded in MongoDB database.",
            "user", saved
        ));
    }
}
