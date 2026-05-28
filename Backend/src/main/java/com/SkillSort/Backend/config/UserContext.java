package com.SkillSort.Backend.config;

public class UserContext {
    private static final ThreadLocal<String> currentUser = new ThreadLocal<>();
    private static final ThreadLocal<String> currentEmail = new ThreadLocal<>();

    public static void setCurrentUser(String userId) {
        currentUser.set(userId);
    }

    public static String getCurrentUser() {
        return currentUser.get();
    }

    public static void setCurrentEmail(String email) {
        currentEmail.set(email);
    }

    public static String getCurrentEmail() {
        return currentEmail.get();
    }

    public static void clear() {
        currentUser.remove();
        currentEmail.remove();
    }
}
