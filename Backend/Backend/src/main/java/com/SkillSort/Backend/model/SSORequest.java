package com.SkillSort.Backend.model;

public record SSORequest(
    String id,
    String email,
    String name,
    String ssoProvider,
    String avatarUrl
) {}
