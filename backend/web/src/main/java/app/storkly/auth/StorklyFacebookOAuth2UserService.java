package app.storkly.auth;

import app.storkly.domain.user.AuthProvider;
import app.storkly.domain.user.User;
import app.storkly.service.auth.OAuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Service
public class StorklyFacebookOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final OAuthService oAuthService;
    private final OAuth2UserService<OAuth2UserRequest, OAuth2User> delegate;

    @Autowired
    public StorklyFacebookOAuth2UserService(OAuthService oAuthService) {
        this(oAuthService, new DefaultOAuth2UserService());
    }

    StorklyFacebookOAuth2UserService(
            OAuthService oAuthService, OAuth2UserService<OAuth2UserRequest, OAuth2User> delegate) {
        this.oAuthService = oAuthService;
        this.delegate = delegate;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = delegate.loadUser(userRequest);

        String providerId = oAuth2User.getAttribute("id");
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        if (email == null || email.isEmpty()) {
            throw new OAuth2AuthenticationException(
                    new OAuth2Error("missing_email"),
                    "Facebook account does not have a verified email. Please verify your email in Facebook settings.");
        }

        User user = oAuthService.findOrCreate(AuthProvider.FACEBOOK, providerId, email, name);

        return new StorklyFacebookUser(user, user.getAuthorities(), "name", oAuth2User.getAttributes());
    }
}
