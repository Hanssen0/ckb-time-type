# CKB Time Type Script

This project provides CKB scripts for time-related type definitions, bootstrapped with [ckb-script-templates].

## Design

For detailed technical specifications and validation logic, please refer to:
- **[Contract Design Specification](../docs/00-contract-design.md)**

## Usage

### Reproducible Build (Recommended)
The preferred way to build the contracts is using Docker to ensure environment consistency and binary reproducibility.

```bash
# Build contracts in release mode and verify against checksums.txt
./scripts/reproducible_build_docker

# Build and update checksums.txt with new hashes
./scripts/reproducible_build_docker --update

# Build with a proxy (e.g., if you have trouble downloading crates)
./scripts/reproducible_build_docker --proxy http://127.0.0.1:7890
```

### Testing
Run the test suite using Cargo:

```bash
make test
```

For test coverage reports:
1. `make coverage-install` (One-time setup)
2. `make coverage-html` (Generates report at `target/coverage/html/index.html`)

---

### Advanced Development
If you prefer building locally without Docker, ensure you have the required toolchain.

#### Build Modes
By default, the Makefile builds in **release** mode. You can specify the mode using the `MODE` variable:
- `make build`: Default (release mode).
- `make build MODE=debug`: Build in debug mode.

#### Environment Setup
```bash
make prepare  # Install riscv64 target
```

#### Local Build & Analysis
- `make build`: Build all contracts and simulators locally.
- `make check`: Run static analysis (check, clippy).
- `make fmt`: Format the codebase.

#### Project Management
- `make generate CRATE=<name>`: Create a new contract from template.
- `make generate-native-simulator CRATE=<name>`: Create a simulator for an existing contract.
- `make clean`: Remove all build artifacts.

[ckb-script-templates]: https://github.com/cryptape/ckb-script-templates
