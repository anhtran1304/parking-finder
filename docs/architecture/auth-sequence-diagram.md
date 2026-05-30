# Auth Sequence Diagram

Three flows:

1. **Register** — new user signs up, receives tokens
2. **Login** — existing user authenticates, receives tokens
3. **Authenticated request** — token is attached and validated per request

---

## 1. Register

```mermaid
sequenceDiagram
    actor User
    participant Angular
    participant API as Spring Boot
    participant DB as PostgreSQL

    User->>Angular: Fill sign-up form
    Angular->>API: POST /auth/register {email, password}
    API->>DB: Save user (password bcrypt-hashed)
    DB-->>API: user saved
    API-->>Angular: 200 {accessToken} + Set-Cookie: refreshToken (HttpOnly)
    Angular->>Angular: AuthSessionService.setToken(accessToken)
    Angular-->>User: Redirect to map
```

---

## 2. Login

```mermaid
sequenceDiagram
    actor User
    participant Angular
    participant API as Spring Boot
    participant DB as PostgreSQL

    User->>Angular: Fill sign-in form
    Angular->>API: POST /auth/login {email, password}
    API->>DB: Load user by email
    DB-->>API: user record
    API->>API: verify bcrypt hash
    alt password matches
        API-->>Angular: 200 {accessToken} + Set-Cookie: refreshToken (HttpOnly)
        Angular->>Angular: AuthSessionService.setToken(accessToken)
        Angular-->>User: Resume intent or redirect to map
    else password mismatch
        API-->>Angular: 401 Unauthorized
        Angular-->>User: Show error
    end
```

---

## 3. Authenticated Request

```mermaid
sequenceDiagram
    participant Angular
    participant Interceptor as authInterceptor
    participant API as Spring Boot
    participant Filter as JwtAuthFilter
    participant DB as PostgreSQL

    Angular->>Interceptor: outgoing HTTP request
    Interceptor->>Interceptor: read token from AuthSessionService
    Interceptor->>API: request + Authorization: Bearer <token>
    API->>Filter: filter chain
    Filter->>Filter: parse + validate JWT signature and expiry
    alt token valid
        Filter->>API: SecurityContext.setAuthentication(principal)
        API->>DB: query scoped to userId from JWT subject
        DB-->>API: result
        API-->>Angular: 200 response
    else token invalid or missing
        Filter-->>Angular: 401 Unauthorized
    end
```
