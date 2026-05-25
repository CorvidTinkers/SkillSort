package com.SkillSort.Backend.repository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import jakarta.annotation.PostConstruct;

@Repository
public class DatabaseRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void init() {
        try {
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN password_hash TEXT");
        } catch (Exception ignored) {
            // Column already exists or table is being created fresh
        }
    }

    // Save or update SSO User
    public void saveUser(String id, String email, String name, String ssoProvider, String avatarUrl) {
        String sql = "INSERT INTO users (id, email, name, sso_provider, avatar_url, last_login_at) " +
                "VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP) " +
                "ON CONFLICT(id) DO UPDATE SET " +
                "email = excluded.email, " +
                "name = excluded.name, " +
                "sso_provider = excluded.sso_provider, " +
                "avatar_url = excluded.avatar_url, " +
                "last_login_at = CURRENT_TIMESTAMP";
        jdbcTemplate.update(sql, id, email, name, ssoProvider, avatarUrl);
    }

    // Save or update Credentials User
    public void saveUserCredentials(String id, String email, String name, String passwordHash, String avatarUrl) {
        String sql = "INSERT INTO users (id, email, name, password_hash, sso_provider, avatar_url, last_login_at) " +
                     "VALUES (?, ?, ?, ?, 'credentials', ?, CURRENT_TIMESTAMP) " +
                     "ON CONFLICT(id) DO UPDATE SET " +
                     "email = excluded.email, " +
                     "name = excluded.name, " +
                     "password_hash = excluded.password_hash, " +
                     "sso_provider = 'credentials', " +
                     "avatar_url = excluded.avatar_url, " +
                     "last_login_at = CURRENT_TIMESTAMP";
        jdbcTemplate.update(sql, id, email, name, passwordHash, avatarUrl);
    }

    // Fetch user by email (for credentials login check)
    public Map<String, Object> getUserByEmail(String email) {
        String sql = "SELECT id, email, name, password_hash, sso_provider, avatar_url FROM users WHERE email = ?";
        try {
            return jdbcTemplate.queryForMap(sql, email);
        } catch (Exception e) {
            return null;
        }
    }
    // Save Candidate
    public void saveCandidate(String id, String uploadedBy, String filename, String extractedText, Double atsScore) {
        String sql = "INSERT INTO candidates (id, uploaded_by, filename, extracted_text, ats_score) VALUES (?, ?, ?, ?, ?)";
        jdbcTemplate.update(sql, id, uploadedBy, filename, extractedText, atsScore);
    }

    // Save Attribute
    public void saveAttribute(String candidateId, String key, String value, String confidence) {
        String sql = "INSERT OR REPLACE INTO candidate_attributes (candidate_id, attribute_key, attribute_value, confidence) VALUES (?, ?, ?, ?)";
        jdbcTemplate.update(sql, candidateId, key, value, confidence);
    }

    // Save Knockout
    public void saveKnockout(String candidateId, String criteria, boolean passed) {
        String sql = "INSERT OR REPLACE INTO candidate_knockouts (candidate_id, criteria, passed) VALUES (?, ?, ?)";
        jdbcTemplate.update(sql, candidateId, criteria, passed ? 1 : 0);
    }

    // Save Document (BLOB)
    public void saveDocument(String candidateId, byte[] fileContent, long fileSize) {
        String sql = "INSERT INTO candidate_documents (candidate_id, file_content, file_size) VALUES (?, ?, ?)";
        jdbcTemplate.update(sql, candidateId, fileContent, fileSize);
    }

    // Get PDF Document BLOB
    public byte[] getDocumentContent(String candidateId) {
        String sql = "SELECT file_content FROM candidate_documents WHERE candidate_id = ?";
        try {
            return jdbcTemplate.queryForObject(sql, byte[].class, candidateId);
        } catch (Exception e) {
            return null;
        }
    }

    // Get candidate owner (uploaded_by) for security checks
    public String getCandidateOwner(String candidateId) {
        String sql = "SELECT uploaded_by FROM candidates WHERE id = ?";
        try {
            return jdbcTemplate.queryForObject(sql, String.class, candidateId);
        } catch (Exception e) {
            return null;
        }
    }

    // List all candidates uploaded by this user, including their attributes and
    // knockouts
    public List<Map<String, Object>> getCandidatesByUser(String userId) {
        String sql = "SELECT id, filename, extracted_text, ats_score, created_at FROM candidates WHERE uploaded_by = ? ORDER BY created_at DESC";
        List<Map<String, Object>> candidates = jdbcTemplate.queryForList(sql, userId);

        for (Map<String, Object> candidate : candidates) {
            String candidateId = (String) candidate.get("id");

            // Fetch attributes
            String attrSql = "SELECT attribute_key, attribute_value, confidence FROM candidate_attributes WHERE candidate_id = ?";
            List<Map<String, Object>> attributes = jdbcTemplate.queryForList(attrSql, candidateId);
            Map<String, Map<String, String>> extractedData = new HashMap<>();
            for (Map<String, Object> attr : attributes) {
                Map<String, String> fieldDetails = new HashMap<>();
                fieldDetails.put("value", (String) attr.get("attribute_value"));
                fieldDetails.put("confidence", (String) attr.get("confidence"));
                extractedData.put((String) attr.get("attribute_key"), fieldDetails);
            }
            candidate.put("extractedData", extractedData);

            // Fetch knockouts
            String koSql = "SELECT criteria, passed FROM candidate_knockouts WHERE candidate_id = ?";
            List<Map<String, Object>> knockouts = jdbcTemplate.queryForList(koSql, candidateId);
            Map<String, Boolean> knockoutResults = new HashMap<>();
            for (Map<String, Object> ko : knockouts) {
                knockoutResults.put((String) ko.get("criteria"), ((Integer) ko.get("passed")) == 1);
            }
            candidate.put("knockoutResults", knockoutResults);
        }

        return candidates;
    }
}
