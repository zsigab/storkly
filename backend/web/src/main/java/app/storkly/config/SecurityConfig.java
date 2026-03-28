package app.storkly.config;

import app.storkly.auth.JwtAuthenticationFilter;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;
    private final CorsProperties corsProperties;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth.requestMatchers(HttpMethod.POST, "/api/auth/register")
                        .permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/login")
                        .permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/refresh")
                        .permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/verify-email")
                        .permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/forgot-password")
                        .permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/reset-password")
                        .permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/logout")
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/auth/oauth/**")
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/registries/{slug}")
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/registries/{slug}/items")
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/registries/{slug}/categories")
                        .permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/registries/{slug}/join")
                        .authenticated()
                        .requestMatchers("/api/docs/**", "/swagger-ui/**")
                        .permitAll()
                        .anyRequest()
                        .authenticated())
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()));

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new Argon2PasswordEncoder(16, 32, 1, 65536, 3);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(corsProperties.allowedOrigins());
        config.setAllowedMethods(List.of("GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}
