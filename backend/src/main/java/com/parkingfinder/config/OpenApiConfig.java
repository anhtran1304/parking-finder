package com.parkingfinder.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;

@Configuration
public class OpenApiConfig {

  @Bean
  public OpenAPI parkingFinderOpenApi() {
    final String securitySchemeName = "bearerAuth";

    return new OpenAPI()
        .info(
            new Info()
                .title("Parking Finder API")
                .description("Interactive API documentation for Parking Finder backend")
                .version("v1"))
        .components(
            new Components()
                .addSecuritySchemes(
                    securitySchemeName,
                    new SecurityScheme()
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")
                                                .name("Authorization")));
  }
}
