package app.storkly.util;

public final class SlugUtil {

    private SlugUtil() {}

    public static String generate(String name) {
        return name.toLowerCase()
                .trim()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("[\\s-]+", "-")
                .replaceAll("^-|-$", "");
    }
}
