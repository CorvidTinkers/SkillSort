package com.SkillSort.Backend.model;

public record AuthResponse(
    String token,
    UserDTO user
) {}
