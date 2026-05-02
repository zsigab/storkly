package app.storkly.scraper;

public interface Scraper {

    boolean supports(String url);

    ScrapeResult scrape(String url);
}
