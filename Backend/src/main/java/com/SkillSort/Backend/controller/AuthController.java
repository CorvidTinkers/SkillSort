package com.SkillSort.Backend.controller;

import com.SkillSort.Backend.repository.DatabaseRepository;
import com.SkillSort.Backend.service.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private DatabaseRepository databaseRepository;

    @Autowired
    private JwtService jwtService;

    // Traditional Sign-Up Endpoint
    @PostMapping("/signup")
    public ResponseEntity<?> signUp(@RequestBody Map<String, String> payload) {
        String name = payload.get("name");
        String email = payload.get("email");
        String password = payload.get("password");

        if (name == null || name.trim().isEmpty() ||
                email == null || email.trim().isEmpty() ||
                password == null || password.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Name, email, and password are required."));
        }

        email = email.trim().toLowerCase();

        // Check if email already exists
        Map<String, Object> existingUser = databaseRepository.getUserByEmail(email);
        if (existingUser != null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is already registered."));
        }

        String userId = "user-" + UUID.randomUUID().toString();
        String passwordHash = hashPassword(password);
        String avatarUrl = "https://api.dicebear.com/7.x/initials/svg?seed=" + name;

        // Save traditional user
        databaseRepository.saveUserCredentials(userId, email, name, passwordHash, avatarUrl);

        // Generate JWT
        String token = jwtService.generateToken(userId, email, name, "credentials");

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);

        Map<String, String> userDetails = new HashMap<>();
        userDetails.put("id", userId);
        userDetails.put("email", email);
        userDetails.put("name", name);
        userDetails.put("avatarUrl", avatarUrl);
        response.put("user", userDetails);

        return ResponseEntity.ok(response);
    }

    // Traditional Login Endpoint
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String password = payload.get("password");

        if (email == null || email.trim().isEmpty() ||
                password == null || password.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and password are required."));
        }

        email = email.trim().toLowerCase();

        Map<String, Object> user = databaseRepository.getUserByEmail(email);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid email or password."));
        }

        String passwordHash = (String) user.get("password_hash");
        if (passwordHash == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "This account uses SSO. Please log in using Google/GitHub."));
        }

        String inputHash = hashPassword(password);
        if (!passwordHash.equals(inputHash)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid email or password."));
        }

        // Generate JWT
        String userId = (String) user.get("id");
        String name = (String) user.get("name");
        String ssoProvider = (String) user.get("sso_provider");
        String avatarUrl = (String) user.get("avatar_url");

        String token = jwtService.generateToken(userId, email, name, ssoProvider);

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);

        Map<String, String> userDetails = new HashMap<>();
        userDetails.put("id", userId);
        userDetails.put("email", email);
        userDetails.put("name", name);
        userDetails.put("avatarUrl", avatarUrl);
        response.put("user", userDetails);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/sso")
    public ResponseEntity<?> authenticateSSO(@RequestBody Map<String, String> payload) {
        String id = payload.get("id");
        String email = payload.get("email");
        String name = payload.get("name");
        String ssoProvider = payload.getOrDefault("ssoProvider", "google");
        String avatarUrl = payload.get("avatarUrl");

        if (id == null || email == null || name == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Missing required SSO payload fields (id, email, name)"));
        }

        // Save user profile in SQLite
        databaseRepository.saveUser(id, email, name, ssoProvider, avatarUrl);

        // Generate JWT token containing claims
        String token = jwtService.generateToken(id, email, name, ssoProvider);

        // Build Response
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);

        Map<String, String> userDetails = new HashMap<>();
        userDetails.put("id", id);
        userDetails.put("email", email);
        userDetails.put("name", name);
        userDetails.put("avatarUrl", avatarUrl);
        response.put("user", userDetails);

        return ResponseEntity.ok(response);
    }

    private String hashPassword(String password) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] encodedhash = digest.digest(password.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder(2 * encodedhash.length);
            for (byte b : encodedhash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error hashing password", e);
        }
    }
}
