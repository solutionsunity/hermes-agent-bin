# hermes-agent-bin

Builds the standalone [Hermes Agent](https://github.com/NousResearch/hermes-agent) CLI payload for six targets
from a Hermes release tag, on GitHub-hosted runners only.

| Target | Runner |
|---|---|
| linux-x64 | `ubuntu-24.04` |
| linux-arm64 | `ubuntu-24.04-arm` |
| darwin-arm64 | `macos-15` |
| darwin-x64 | `macos-15-intel` |
| win32-x64 | `windows-2025` |
| win32-arm64 | `windows-11-arm` |

The build is Hermes' own: `scripts/bundles/native_build.py` prepares, then assembles the payload, and
`scripts/smoke-payload.sh` boots it relocated (network off on Linux) — the same steps as Hermes' `pm-bundle.yml`.
Each target uploads its archive (`.tar.gz`, `.zip` on Windows) and `.sha256` as a workflow artifact.

**Proof builds, not a distribution.** Artifacts expire after 90 days and are not signed or published anywhere.
This repo exists so Nous Research can fork it, or copy `.github/workflows/build.yml` into hermes-agent, and publish
official binaries themselves.

## Run

Actions › Build › Run workflow, with a hermes-agent tag (e.g. `v0.22.5`). Each job's summary records the payload
size, archive size, sha256 and launcher path.

Actions › Verify darwin › Run workflow, with a Build run's id, answers whether its unsigned macOS payloads run once
downloaded: programmatically, with every Mach-O signature checked and each failing library loaded, and quarantined
the way a browser download leaves them. It stays out of `build.yml`, so that file copies as is.

## License

MIT — see [LICENSE](LICENSE). Hermes Agent is MIT, © Nous Research.
