package app.storkly.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(title = "Storkly API", version = "1.0", description = "Storkly gift registry REST API"),
        servers = @Server(url = "/", description = "Default server"))
public class OpenApiConfig {}
