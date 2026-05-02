package app.storkly.auth;

import app.storkly.domain.user.AuthProvider;
import app.storkly.domain.user.User;
import app.storkly.service.auth.OAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StorklyOAuth2UserService implements OAuth2UserService<OidcUserRequest, OidcUser> {

    private final OAuthService oAuthService;
    private final OidcUserService delegate = new OidcUserService();

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        OidcUser oidcUser = delegate.loadUser(userRequest);

        String providerId = oidcUser.getSubject();
        String email = oidcUser.getEmail();
        String displayName = oidcUser.getFullName() != null ? oidcUser.getFullName() : email;

        User user = oAuthService.findOrCreate(AuthProvider.GOOGLE, providerId, email, displayName);

        return new StorklyOAuth2User(user, user.getAuthorities(), oidcUser.getIdToken(), oidcUser.getUserInfo());
    }
}
