package com.SkillSort.Backend.controller;

import com.SkillSort.Backend.model.*;
import com.SkillSort.Backend.repository.DatabaseRepository;
import com.SkillSort.Backend.service.AuthService;
import com.SkillSort.Backend.service.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private DatabaseRepository databaseRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private AuthService authService;

    // Traditional Sign-Up Endpoint
    @PostMapping("/signup")
    public ResponseEntity<?> signUp(@RequestBody SignUpRequest payload) {
        String name = payload.name();
        String email = payload.email();
        String password = payload.password();

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
        String passwordHash = authService.hashPassword(password);
        String avatarUrl = "https://api.dicebear.com/7.x/initials/svg?seed=" + name;

        // Save traditional user
        databaseRepository.saveUserCredentials(userId, email, name, passwordHash, avatarUrl);

        // Generate JWT
        String token = jwtService.generateToken(userId, email, name, "credentials");

        UserDTO userDetails = new UserDTO(userId, email, name, avatarUrl);
        AuthResponse response = new AuthResponse(token, userDetails);

        return ResponseEntity.ok(response);
    }

    // Traditional Login Endpoint
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest payload) {
        String email = payload.email();
        String password = payload.password();

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

        String inputHash = authService.hashPassword(password);
        if (!passwordHash.equals(inputHash)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid email or password."));
        }

        // Generate JWT
        String userId = (String) user.get("id");
        String name = (String) user.get("name");
        String ssoProvider = (String) user.get("sso_provider");
        String avatarUrl = (String) user.get("avatar_url");

        String token = jwtService.generateToken(userId, email, name, ssoProvider);

        UserDTO userDetails = new UserDTO(userId, email, name, avatarUrl);
        AuthResponse response = new AuthResponse(token, userDetails);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/sso")
    public ResponseEntity<?> authenticateSSO(@RequestBody SSORequest payload) {
        String id = payload.id();
        String email = payload.email();
        String name = payload.name();
        String ssoProvider = payload.ssoProvider() != null ? payload.ssoProvider() : "google";
        String avatarUrl = payload.avatarUrl();

        if (id == null || email == null || name == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Missing required SSO payload fields (id, email, name)"));
        }

        // Save user profile in SQLite
        databaseRepository.saveUser(id, email, name, ssoProvider, avatarUrl);

        // Generate JWT token containing claims
        String token = jwtService.generateToken(id, email, name, ssoProvider);

        UserDTO userDetails = new UserDTO(id, email, name, avatarUrl);
        AuthResponse response = new AuthResponse(token, userDetails);

        return ResponseEntity.ok(response);
    }
}
