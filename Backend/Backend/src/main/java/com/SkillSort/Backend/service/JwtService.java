package com.SkillSort.Backend.service;

import org.springframework.stereotype.Service;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

@Service
public class JwtService {

    private static final String SECRET = "a-super-secret-skillsort-key-minimum-256-bits-long-for-hmac-sha-256";
    private static final long EXPIRATION_MS = 86400000; // 24 hours

    public String generateToken(String userId, String email, String name, String ssoProvider) {
        try {
            String header = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";
            long now = System.currentTimeMillis();
            long exp = now + EXPIRATION_MS;

            String payload = String.format(
                "{\"sub\":\"%s\",\"email\":\"%s\",\"name\":\"%s\",\"sso_provider\":\"%s\",\"exp\":%d}",
                escapeJson(userId), escapeJson(email), escapeJson(name), escapeJson(ssoProvider), exp / 1000
            );

            String encodedHeader = base64UrlEncode(header.getBytes(StandardCharsets.UTF_8));
            String encodedPayload = base64UrlEncode(payload.getBytes(StandardCharsets.UTF_8));

            String signatureInput = encodedHeader + "." + encodedPayload;
            String signature = calculateHmacSha256(signatureInput, SECRET);

            return signatureInput + "." + signature;
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate JWT", e);
        }
    }

    public Map<String, String> validateTokenAndGetClaims(String token) {
        if (token == null || token.isEmpty()) {
            return null;
        }

        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            return null;
        }

        try {
            String signatureInput = parts[0] + "." + parts[1];
            String expectedSignature = calculateHmacSha256(signatureInput, SECRET);

            if (!expectedSignature.equals(parts[2])) {
                return null; // Signature verification failed
            }

            String payloadJson = new String(base64UrlDecode(parts[1]), StandardCharsets.UTF_8);
            Map<String, String> claims = parseSimpleJson(payloadJson);

            // Verify expiration
            String expStr = claims.get("exp");
            if (expStr != null) {
                long exp = Long.parseLong(expStr) * 1000;
                if (System.currentTimeMillis() > exp) {
                    return null; // Expired
                }
            }

            return claims;
        } catch (Exception e) {
            return null;
        }
    }

    private String base64UrlEncode(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private byte[] base64UrlDecode(String str) {
        return Base64.getUrlDecoder().decode(str);
    }

    private String calculateHmacSha256(String data, String key) throws NoSuchAlgorithmException, InvalidKeyException {
        Mac sha256Hmac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        sha256Hmac.init(secretKey);
        byte[] rawHmac = sha256Hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return base64UrlEncode(rawHmac);
    }

    private String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\\", "\\\\")
                    .replace("\"", "\\\"")
                    .replace("\b", "\\b")
                    .replace("\f", "\\f")
                    .replace("\n", "\\n")
                    .replace("\r", "\\r")
                    .replace("\t", "\\t");
    }

    private Map<String, String> parseSimpleJson(String json) {
        Map<String, String> map = new HashMap<>();
        String content = json.trim();
        if (content.startsWith("{") && content.endsWith("}")) {
            content = content.substring(1, content.length() - 1);
        }

        // Splitting commas only outside quotes
        String[] pairs = content.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)");
        for (String pair : pairs) {
            String[] keyValue = pair.split(":(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)");
            if (keyValue.length == 2) {
                String key = cleanToken(keyValue[0]);
                String value = cleanToken(keyValue[1]);
                map.put(key, value);
            }
        }
        return map;
    }

    private String cleanToken(String token) {
        token = token.trim();
        if (token.startsWith("\"") && token.endsWith("\"")) {
            token = token.substring(1, token.length() - 1);
        }
        return token.replace("\\\"", "\"").replace("\\\\", "\\");
    }
}
