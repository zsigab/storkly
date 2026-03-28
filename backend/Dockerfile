# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM eclipse-temurin:26-jdk AS builder

WORKDIR /workspace

# Copy Gradle wrapper and version catalog first for layer caching
COPY gradlew gradlew.bat settings.gradle.kts build.gradle.kts gradle/ ./
COPY gradle/ gradle/
RUN chmod +x gradlew

# Download dependencies (cached unless build files change)
RUN ./gradlew dependencies --no-daemon -q || true

# Copy source and build
COPY . .
RUN ./gradlew :web:bootJar -x test --no-daemon

# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM eclipse-temurin:26-jdk AS runtime

WORKDIR /app

RUN addgroup --system --gid 1001 storkly && \
    adduser --system --uid 1001 --gid 1001 storkly

COPY --from=builder /workspace/web/build/libs/storkly.jar app.jar

USER storkly

EXPOSE 8080

ENTRYPOINT ["java", "--enable-preview", "-jar", "app.jar"]
