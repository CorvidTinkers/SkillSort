package com.SkillSort.Backend.model;

public record LoginRequest(
    String email,
    String password
) {}
