# Multi-stage Dockerfile for diff-builder
# Dependencies are cached until package.json/pnpm-lock.yaml change
# Each stage can be built independently via --target

FROM adguard/node-ssh:22.22--0 AS base
SHELL ["/bin/bash", "-lc"]

# Install specific pnpm version for deterministic builds
RUN npm install -g pnpm@10.7.1

WORKDIR /diff-builder

# pnpm store directory — set once here, no need for pnpm config set in every RUN
ENV npm_config_store_dir=/pnpm-store

# ============================================================================
# Stage: deps
# Cached until package.json/pnpm-lock.yaml changes
# ============================================================================
FROM base AS deps

COPY package.json pnpm-lock.yaml ./

RUN --mount=type=cache,target=/pnpm-store,id=diff-builder-pnpm \
    pnpm install \
        --frozen-lockfile \
        --prefer-offline

# ============================================================================
# Stage: source
# Cached until source code changes
# Has source + node_modules
# ============================================================================
FROM deps AS source

COPY . /diff-builder

# ============================================================================
# Stage: test
# Runs ESLint and Jest unit tests
# ============================================================================
FROM source AS test

ARG BUILD_RUN_ID=""

RUN --mount=type=cache,target=/pnpm-store,id=diff-builder-pnpm \
    echo "${BUILD_RUN_ID}" > /tmp/.build-run-id && \
    pnpm lint && \
    pnpm test && \
    pnpm build && \
    # Smoke tests call pnpm pack, which requires a version field.
    # Use a placeholder; the real version is injected at release time.
    npm pkg set version="0.0.0" && \
    pnpm test:smoke && \
    mkdir -p /out && \
    touch /out/test-passed.txt

FROM scratch AS test-output
COPY --from=test /out/ /

# ============================================================================
# Stage: build
# Runs quality gates (lint + tests + smoke), builds the library, and creates
# the npm package tarball for publishing
# ============================================================================
FROM source AS build

ARG BUILD_RUN_ID=""

RUN --mount=type=cache,target=/pnpm-store,id=diff-builder-pnpm \
    echo "${BUILD_RUN_ID}" > /tmp/.build-run-id && \
    pnpm lint && \
    pnpm test && \
    pnpm test:smoke && \
    pnpm build && \
    pnpm pack --out diff-builder.tgz && \
    mkdir -p /out/artifacts && \
    cp diff-builder.tgz /out/artifacts/

FROM scratch AS build-output
COPY --from=build /out/artifacts/ /
