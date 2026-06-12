package com.itv.util;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;

public final class JwtUtils {

    private JwtUtils() {}

    public static String getUserId(@AuthenticationPrincipal Jwt jwt) {
        return jwt != null ? jwt.getSubject() : "anonymous";
    }

    public static String getUsername(Jwt jwt) {
        if (jwt == null) return "Anonymous";
        String name = jwt.getClaimAsString("preferred_username");
        if (name != null) return name;
        name = jwt.getClaimAsString("name");
        return name != null ? name : jwt.getSubject();
    }
}
