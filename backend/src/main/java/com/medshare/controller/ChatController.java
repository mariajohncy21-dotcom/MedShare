package com.medshare.controller;

import com.medshare.service.GeminiChatService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ChatController {

    private final GeminiChatService geminiChatService;

    @Data
    public static class ChatRequest {
        private String message;
        private String language;
        private String role;
        private String conversationId;
    }

    @PostMapping({"/chat", "/ai/chat"})
    public ResponseEntity<?> handleChat(
            @RequestBody(required = false) ChatRequest req,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        if (req == null || req.getMessage() == null || req.getMessage().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message is required."));
        }

        String userMessage = req.getMessage().trim();
        if (userMessage.length() > 2000) {
            userMessage = userMessage.substring(0, 2000);
        }

        String role = req.getRole() != null && !req.getRole().trim().isEmpty() ? req.getRole().trim().toUpperCase() : "PATIENT";
        String language = req.getLanguage() != null && !req.getLanguage().trim().isEmpty() ? req.getLanguage().trim().toLowerCase() : "en";

        String reply = geminiChatService.getChatReply(userMessage, role, language);

        return ResponseEntity.ok(Map.of(
                "reply", reply,
                "role", role
        ));
    }
}
