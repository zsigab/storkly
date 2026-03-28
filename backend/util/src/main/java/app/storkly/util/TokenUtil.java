package app.storkly.util;

import java.security.SecureRandom;
import java.util.Base64;

public final class TokenUtil {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private TokenUtil() {}

    public static String generate() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
