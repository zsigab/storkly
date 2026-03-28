# ─── Stage 1: Build ──────────────────────────────────────────────────────────
# eclipse-temurin:26-jdk is not yet published (Temurin lags ~weeks behind Oracle GA).
# Switch both stages to that image once available.
FROM ubuntu:24.04 AS builder

RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates tar && \
    rm -rf /var/lib/apt/lists/*

RUN ARCH=$(dpkg --print-architecture | sed 's/amd64/x64/;s/arm64/aarch64/') && \
    curl -fL "https://download.oracle.com/java/26/latest/jdk-26_linux-${ARCH}_bin.tar.gz" \
        -o /tmp/jdk26.tar.gz && \
    mkdir -p /opt/jdk-26 && \
    tar -xzf /tmp/jdk26.tar.gz -C /opt/jdk-26 --strip-components=1 && \
    rm /tmp/jdk26.tar.gz

ENV JAVA_HOME=/opt/jdk-26
ENV PATH="${JAVA_HOME}/bin:${PATH}"

WORKDIR /workspace

COPY gradlew gradlew.bat settings.gradle.kts build.gradle.kts gradle/ ./
COPY gradle/ gradle/
RUN chmod +x gradlew

RUN ./gradlew dependencies --no-daemon -q --console=plain || true

COPY . .
RUN ./gradlew :web:bootJar -x test --no-daemon --console=plain

# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM ubuntu:24.04 AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates tar && \
    rm -rf /var/lib/apt/lists/*

RUN ARCH=$(dpkg --print-architecture | sed 's/amd64/x64/;s/arm64/aarch64/') && \
    curl -fL "https://download.oracle.com/java/26/latest/jdk-26_linux-${ARCH}_bin.tar.gz" \
        -o /tmp/jdk26.tar.gz && \
    mkdir -p /opt/jdk-26 && \
    tar -xzf /tmp/jdk26.tar.gz -C /opt/jdk-26 --strip-components=1 && \
    rm /tmp/jdk26.tar.gz

ENV JAVA_HOME=/opt/jdk-26
ENV PATH="${JAVA_HOME}/bin:${PATH}"

WORKDIR /app

RUN groupadd --system --gid 1001 storkly && \
    useradd --system --uid 1001 --gid 1001 storkly

COPY --from=builder /workspace/web/build/libs/storkly.jar app.jar

USER storkly

EXPOSE 8080

ENTRYPOINT ["java", "--enable-preview", "-jar", "app.jar"]
