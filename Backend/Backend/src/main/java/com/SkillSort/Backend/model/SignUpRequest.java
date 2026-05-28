package com.SkillSort.Backend.model;

public record SignUpRequest(
    String name,
    String email,
    String password
) {}
