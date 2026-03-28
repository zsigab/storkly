package app.storkly.domain.user;

import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import org.jspecify.annotations.Nullable;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

@Builder
public record User(
        UUID id,
        String email,
        @Nullable String passwordHash,
        String displayName,
        @Nullable OffsetDateTime emailVerifiedAt,
        AuthProvider provider,
        @Nullable String providerId,
        UserRole role,
        OffsetDateTime createdAt)
        implements UserDetails {

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return emailVerifiedAt != null;
    }
}
