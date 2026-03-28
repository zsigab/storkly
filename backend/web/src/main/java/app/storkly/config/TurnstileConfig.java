package app.storkly.config;

import app.storkly.service.auth.TurnstileClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.support.RestClientAdapter;
import org.springframework.web.service.invoker.HttpServiceProxyFactory;

@Configuration
public class TurnstileConfig {

    @Bean
    public TurnstileClient turnstileClient(RestClient.Builder builder) {
        RestClient restClient = builder.baseUrl("https://challenges.cloudflare.com/turnstile/v0")
                .build();
        return HttpServiceProxyFactory.builderFor(RestClientAdapter.create(restClient))
                .build()
                .createClient(TurnstileClient.class);
    }
}
