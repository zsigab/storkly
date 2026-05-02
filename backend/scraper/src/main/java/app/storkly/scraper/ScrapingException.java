package app.storkly.scraper;

public class ScrapingException extends RuntimeException {

    private final String url;

    public ScrapingException(String url, String message) {
        super(message);
        this.url = url;
    }

    public ScrapingException(String url, String message, Throwable cause) {
        super(message, cause);
        this.url = url;
    }

    public String url() {
        return url;
    }
}
