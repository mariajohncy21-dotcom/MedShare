package com.medshare.controller;

import com.medshare.model.User;
import com.medshare.repository.UserRepository;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserRepository userRepository;

    @Autowired
    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginRequest {
        private String email;
        private String password;
        private String role;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }

        public String getRole() {
            return role;
        }

        public void setRole(String role) {
            this.role = role;
        }
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
        String inferredRole = req.getRole();
        if (inferredRole == null || inferredRole.isBlank()) {
            String email = (req.getEmail() != null ? req.getEmail() : "").toLowerCase();
            if (email.contains("admin")) inferredRole = "ADMIN";
            else if (email.endsWith("@pharm.com") || email.contains("pharm")) inferredRole = "PHARMACY";
            else if (email.endsWith("@hos.com") || email.contains("hos")) inferredRole = "HOSPITAL";
            else inferredRole = "PATIENT";
        } else {
            inferredRole = inferredRole.toUpperCase();
        }

        User demoUser = User.builder()
                .id("USR-" + inferredRole + "-001")
                .name(req.getEmail() != null ? req.getEmail().split("@")[0] : "user")
                .email(req.getEmail())
                .role(inferredRole)
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
