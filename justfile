mod ci 'ci/mod.just'

# Install dependencies
install:
    pnpm install

# Run dev server (vite + triplit)
dev: install
    #!/usr/bin/env bash
    set -euo pipefail
    trap 'kill 0' EXIT
    pnpm triplit dev &
    sleep 1
    pnpm dev &
    wait

# Build for production
build: install
    pnpm build

# Type check
typecheck: install
    pnpm typecheck

# Run pre-commit hooks
pc:
    pre-commit run --all-files

# Run e2e tests (full build + test)
test: build
    #!/usr/bin/env bash
    set -euo pipefail
    cd tests && pnpm install
    TRIFFECT_SERVER="http://localhost:4173" pnpm --prefix tests test &
    pnpm preview &
    wait -n

# Run e2e tests against dev server
test-dev:
    cd tests && pnpm install && TRIFFECT_SERVER="http://localhost:5173" pnpm test
