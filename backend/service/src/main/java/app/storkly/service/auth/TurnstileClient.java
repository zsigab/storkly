package app.storkly.service.auth;

import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.service.annotation.PostExchange;

public interface TurnstileClient {
    @PostExchange("/siteverify")
    TurnstileResponse verify(@RequestBody TurnstileRequest request);
}
