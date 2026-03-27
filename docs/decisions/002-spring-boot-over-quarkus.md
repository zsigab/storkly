# ADR 002 — Spring Boot 4 over Quarkus

**Status:** Accepted
**Date:** 2026-03-27

## Context

Owner uses Quarkus on Watchlistarr and is familiar with it. Both frameworks are capable for this project.

## Decision

Use **Spring Boot 4** (Spring Framework 7, Jakarta EE 11).

## Reasons

- Spring Security's OAuth2 client + Authorization Server stack has vastly more documentation and community examples for the exact auth pattern needed (email+password + social OAuth)
- The Google/Facebook OAuth integration guides overwhelmingly target Spring Security
- Spring Boot 4 with Spring AOT compilation is closing the startup/memory gap with Quarkus
- Architecture patterns (services, helpers, repositories) are identical between frameworks

## Consequences

- Slower startup than Quarkus (~2–3s vs ~0.5s); acceptable for a web app
- Higher memory baseline; fine on Hetzner CX22 (4 GB)
- No native image compilation (Quarkus excels here); not needed for this use case
- Gradle replaces Maven, so the Quarkus/Maven combo from Watchlistarr doesn't carry over directly
