# ckb-cto-script

*This contract was bootstrapped with [ckb-script-templates].*

[ckb-script-templates]: https://github.com/cryptape/ckb-script-templates

## Usage

You can build and manage this contract using `make` from either this directory or the root directory of the project.

### Commands
- `make build`: Build the contract for the RISC-V target.
- `make test`: Run cargo tests for this contract.
- `make check`: Run `cargo check`.
- `make clippy`: Run `cargo clippy`.
- `make fmt`: Run `cargo fmt` to format code.
- `make prepare`: Ensure the `riscv64imac-unknown-none-elf` target is installed.

When building from this directory, the default output will be in the top-level `target/riscv64imac-unknown-none-elf/release/` directory.
