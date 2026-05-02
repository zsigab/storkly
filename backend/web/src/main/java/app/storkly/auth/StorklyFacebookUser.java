package app.storkly.auth;

import app.storkly.domain.user.User;
import java.util.Collection;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;

public class StorklyFacebookUser extends DefaultOAuth2User implements StorklyUserHolder {

    private final User storklyUser;

    public StorklyFacebookUser(
            User storklyUser,
            Collection<? extends GrantedAuthority> authorities,
            String nameAttributeKey,
            java.util.Map<String, Object> attributes) {
        super(authorities, attributes, nameAttributeKey);
        this.storklyUser = storklyUser;
    }

    @Override
    public User getStorklyUser() {
        return storklyUser;
    }
}
