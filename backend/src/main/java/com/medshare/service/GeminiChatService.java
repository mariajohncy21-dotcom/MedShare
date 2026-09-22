package com.medshare.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class GeminiChatService {

    private static final Logger logger = LoggerFactory.getLogger(GeminiChatService.class);

    @Value("${medshare.gemini.api-key:}")
    private String configApiKey;

    @Value("${medshare.gemini.model:gemini-3.6-flash}")
    private String model;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate;

    public GeminiChatService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(25000);
        this.restTemplate = new RestTemplate(factory);
    }

    private String resolveApiKey() {
        if (configApiKey != null && !configApiKey.trim().isEmpty()) {
            return configApiKey.trim();
        }
        String envKey = System.getenv("GEMINI_API_KEY");
        if (envKey != null && !envKey.trim().isEmpty()) {
            return envKey.trim();
        }
        // Fallback: automatically read from .env file (supports root or backend folder)
        try {
            java.nio.file.Path envPath = java.nio.file.Paths.get(".env");
            if (!java.nio.file.Files.exists(envPath)) {
                envPath = java.nio.file.Paths.get("..", ".env");
            }
            if (java.nio.file.Files.exists(envPath)) {
                for (String line : java.nio.file.Files.readAllLines(envPath)) {
                    String trimmed = line.trim();
                    if (trimmed.startsWith("GEMINI_API_KEY=")) {
                        String val = trimmed.substring("GEMINI_API_KEY=".length()).trim().replaceAll("^[\"']|[\"']$", "");
                        if (!val.isEmpty()) return val;
                    }
                }
            }
        } catch (Exception ignored) {}
        return "";
    }

    public String getChatReply(String userMessage, String role, String language) {
        String apiKey = resolveApiKey();
        if (apiKey.isEmpty()) {
            logger.warn("[MedShare AI] GEMINI_API_KEY is not configured on the backend.");
            return "ta".equalsIgnoreCase(language)
                    ? "AI சேவை தற்போது கட்டமைக்கப்படவில்லை. சர்வரில் GEMINI_API_KEY அமைக்கப்பட வேண்டும்."
                    : "MedShare AI is not configured on this server. Please configure the GEMINI_API_KEY environment variable.";
        }

        String userRole = (role != null && !role.trim().isEmpty()) ? role.trim().toUpperCase() : "PATIENT";
        String lang = (language != null && !language.trim().isEmpty()) ? language.trim().toLowerCase() : "en";

        String roleContext;
        switch (userRole) {
            case "PHARMACY":
                roleContext = "Helping a licensed pharmacy operator with inventory updates, batch entries, responding to hospital requests (accept/partial accept/reject), managing 15-minute reservation holds, and daily operational reports.";
                break;
            case "HOSPITAL":
                roleContext = "Helping hospital clinical/pharmacy staff with patient records, initiating urgent medicine requests to pharmacies, Smart Allocation engine, emergency requests, and inter-facility stock transfers.";
                break;
            case "ADMIN":
                roleContext = "Helping a MedShare platform administrator with facility verification, pharmacy/hospital credentials, monitoring regional shortages, reviewing audit logs, and managing network accounts.";
                break;
            case "PATIENT":
            default:
                roleContext = "Helping a citizen or patient find available medicines in nearby pharmacies, understanding the 15-minute emergency reservation pass, live map navigation, and pickup instructions.";
                break;
        }

        String systemInstruction = "You are MedShare AI, the official intelligent assistant for MedShare Emergency Medicine Logistics Network in Tisaiyanvilai, Tamil Nadu, India.\n" +
                "Platform Tagline: 'Every Minute Matters. Find. Match. Reserve. Share.'\n\n" +
                "AUTHENTICATED USER ROLE: " + userRole + "\n" +
                "ROLE CONTEXT: " + roleContext + "\n\n" +
                "CRITICAL CLINICAL & SAFETY RULES (NON-NEGOTIABLE):\n" +
                "- You are a platform logistics and availability assistant ONLY.\n" +
                "- NEVER diagnose diseases or medical conditions.\n" +
                "- NEVER prescribe medicines or tell users what medication they should take.\n" +
                "- NEVER advise on dosages, medicine combinations, or treatment protocols.\n" +
                "- NEVER recommend substitute medications.\n" +
                "- If the user asks for diagnosis, medical symptoms, treatments, or prescriptions, immediately reply with:\n" +
                "  \"I am a MedShare platform logistics assistant and cannot provide medical advice, diagnoses, or prescriptions. Please consult a qualified doctor or healthcare professional immediately. In an emergency, dial 108 or 104.\"\n\n" +
                "LANGUAGE HANDLING:\n" +
                "- User preferred language: " + lang + "\n" +
                "- If the user writes in Tamil (தமிழ்) or requested language is 'ta', answer clearly in Tamil.\n" +
                "- If the user writes in Tanglish (Tamil in English script), provide a friendly, clear reply in Tamil / Tanglish.\n" +
                "- If the user writes in English, answer in English.\n" +
                "- Do not translate actual clinical medicine names (e.g. Paracetamol, Atropine, Insulin), batch numbers, or facility names.\n" +
                "- Keep responses structured, concise, and helpful with bullet points where needed.";

        String endpoint = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;

        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", systemInstruction + "\n\nUser Question: " + userMessage);

        Map<String, Object> contentObj = new HashMap<>();
        contentObj.put("parts", Collections.singletonList(textPart));

        Map<String, Object> genConfig = new HashMap<>();
        genConfig.put("maxOutputTokens", 800);
        genConfig.put("temperature", 0.7);

        Map<String, Object> requestPayload = new HashMap<>();
        requestPayload.put("contents", Collections.singletonList(contentObj));
        requestPayload.put("generationConfig", genConfig);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestPayload, headers);

        for (int attempt = 1; attempt <= 2; attempt++) {
            try {
                ResponseEntity<String> response = restTemplate.exchange(endpoint, HttpMethod.POST, entity, String.class);

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    JsonNode root = objectMapper.readTree(response.getBody());
                    JsonNode candidates = root.path("candidates");
                    if (candidates.isArray() && candidates.size() > 0) {
                        JsonNode parts = candidates.get(0).path("content").path("parts");
                        if (parts.isArray() && parts.size() > 0) {
                            return parts.get(0).path("text").asText();
                        }
                    }
                }
            } catch (Exception e) {
                logger.warn("[MedShare AI] Attempt {} failed: {}", attempt, e.getMessage());
                if (attempt < 2) {
                    try { Thread.sleep(600); } catch (InterruptedException ignored) {}
                }
            }
        }

        logger.warn("[MedShare AI] Empty response or failure from Gemini API");
        return "ta".equalsIgnoreCase(lang)
                ? "AI சேவை தற்போது கிடைக்கவில்லை. தயவுசெய்து மீண்டும் முயற்சிக்கவும்."
                : "AI service is temporarily unavailable. Please try again.";
    }
}
