# ADR 004 — Private Repository, No License Until Open-Source

**Status:** Accepted
**Date:** 2026-03-27

## Context

GPL-3.0 was originally planned. Owner wants to keep the repository private initially for personal use.

## Decision

**No LICENSE file** until the decision is made to open-source. Repository stays private on GitHub.

## Reasons

- GPL-3.0 only applies upon *distribution*. A private repo that is never distributed triggers no GPL obligations.
- Adding GPL-3.0 now to a private repo is harmless but misleading — it signals intent to distribute that hasn't been confirmed.
- Keeping it unlicensed (proprietary by default) is the correct legal state for private personal software.

## Consequences

- GitHub Actions CI/CD works on private repos (free plan: 2,000 min/month).
- GHCR (GitHub Container Registry) can host private images. Only accounts with explicit access can pull.
- Docker images contain compiled bytecode (fat JAR) which can be decompiled to approximate source. This is acceptable for a personal project with a private image.
- When ready to open-source: add `LICENSE` file with GPL-3.0 and make repo public. Review any dependencies for license compatibility first.
