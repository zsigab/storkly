package app.storkly.auth;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.stereotype.Component;

@Component
public class SelectAccountAuthorizationRequestResolver implements OAuth2AuthorizationRequestResolver {

    private final DefaultOAuth2AuthorizationRequestResolver delegate;

    public SelectAccountAuthorizationRequestResolver(ClientRegistrationRepository repo) {
        this.delegate = new DefaultOAuth2AuthorizationRequestResolver(repo, "/oauth2/authorization");
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
        OAuth2AuthorizationRequest req = delegate.resolve(request);
        if (req == null) {
            return null;
        }
        String path = request.getRequestURI();
        String registrationId = path.substring(path.lastIndexOf('/') + 1);
        return withSelectAccount(req, registrationId);
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request, String clientRegistrationId) {
        OAuth2AuthorizationRequest req = delegate.resolve(request, clientRegistrationId);
        return req != null ? withSelectAccount(req, clientRegistrationId) : null;
    }

    private OAuth2AuthorizationRequest withSelectAccount(
            OAuth2AuthorizationRequest request, String clientRegistrationId) {
        if (!"google".equals(clientRegistrationId)) {
            return request;
        }
        Map<String, Object> params = new HashMap<>(request.getAdditionalParameters());
        params.put("prompt", "select_account");
        return OAuth2AuthorizationRequest.from(request)
                .additionalParameters(params)
                .build();
    }
}
