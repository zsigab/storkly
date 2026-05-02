package app.storkly.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import app.storkly.domain.user.AuthProvider;
import app.storkly.domain.user.User;
import app.storkly.domain.user.UserRole;
import app.storkly.service.auth.OAuthService;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;

@ExtendWith(MockitoExtension.class)
class StorklyFacebookOAuth2UserServiceTest {

    @Mock
    private OAuthService oAuthService;

    @Mock
    private OAuth2UserService<OAuth2UserRequest, OAuth2User> delegate;

    private StorklyFacebookOAuth2UserService facebookUserService;

    @BeforeEach
    void setUp() {
        facebookUserService = new StorklyFacebookOAuth2UserService(oAuthService, delegate);
    }

    @Test
    void loadUser_newUser_createsVerifiedFacebookUser() {
        Map<String, Object> attributes = Map.of("id", "fb-123", "name", "John Doe", "email", "john@example.com");
        OAuth2UserRequest request = createMockRequest();

        when(delegate.loadUser(request)).thenReturn(new DefaultOAuth2User(Collections.emptyList(), attributes, "name"));

        User savedUser = User.builder()
                .id(UUID.randomUUID())
                .email("john@example.com")
                .displayName("John Doe")
                .emailVerifiedAt(OffsetDateTime.now())
                .role(UserRole.USER)
                .createdAt(OffsetDateTime.now())
                .build();
        when(oAuthService.findOrCreate(AuthProvider.FACEBOOK, "fb-123", "john@example.com", "John Doe"))
                .thenReturn(savedUser);

        OAuth2User result = facebookUserService.loadUser(request);

        assertThat(result).isInstanceOf(StorklyFacebookUser.class);
        assertThat(((StorklyFacebookUser) result).getStorklyUser()).isEqualTo(savedUser);
    }

    @Test
    void loadUser_nullEmail_throwsOAuth2AuthenticationException() {
        Map<String, Object> attributes = new java.util.HashMap<>();
        attributes.put("id", "fb-456");
        attributes.put("name", "Jane Doe");
        attributes.put("email", null);
        OAuth2UserRequest request = createMockRequest();

        when(delegate.loadUser(request)).thenReturn(new DefaultOAuth2User(Collections.emptyList(), attributes, "name"));

        assertThatThrownBy(() -> facebookUserService.loadUser(request))
                .isInstanceOf(OAuth2AuthenticationException.class)
                .hasMessageContaining("email");
    }

    @Test
    void loadUser_emptyEmail_throwsOAuth2AuthenticationException() {
        Map<String, Object> attributes = Map.of("id", "fb-789", "name", "Bob Smith", "email", "");
        OAuth2UserRequest request = createMockRequest();

        when(delegate.loadUser(request)).thenReturn(new DefaultOAuth2User(Collections.emptyList(), attributes, "name"));

        assertThatThrownBy(() -> facebookUserService.loadUser(request))
                .isInstanceOf(OAuth2AuthenticationException.class)
                .hasMessageContaining("email");
    }

    private OAuth2UserRequest createMockRequest() {
        ClientRegistration registration = ClientRegistration.withRegistrationId("facebook")
                .clientId("client-id")
                .clientSecret("client-secret")
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .authorizationUri("https://graph.facebook.com/oauth/authorize")
                .tokenUri("https://graph.facebook.com/oauth/access_token")
                .redirectUri("http://localhost/login/oauth2/code/facebook")
                .userInfoUri("https://graph.facebook.com/me?fields=id,name,email")
                .userNameAttributeName("name")
                .build();
        OAuth2AccessToken token = new OAuth2AccessToken(
                OAuth2AccessToken.TokenType.BEARER,
                "fake-token",
                OffsetDateTime.now().toInstant(),
                null);
        return new OAuth2UserRequest(registration, token);
    }
}
