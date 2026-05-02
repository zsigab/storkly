package app.storkly.auth;

import app.storkly.domain.user.User;
import java.util.Collection;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.OidcUserInfo;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;

public class StorklyOAuth2User extends DefaultOidcUser {

    private final User storklyUser;

    public StorklyOAuth2User(
            User storklyUser,
            Collection<? extends GrantedAuthority> authorities,
            OidcIdToken idToken,
            OidcUserInfo userInfo) {
        super(authorities, idToken, userInfo);
        this.storklyUser = storklyUser;
    }

    public User getStorklyUser() {
        return storklyUser;
    }
}
