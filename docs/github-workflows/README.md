GitHub Actions workflows, ready to use. Move them into `.github/workflows/` to enable:

```bash
mkdir -p .github/workflows && git mv docs/github-workflows/*.yml .github/workflows/
```

- `ci.yml`: install, build, typecheck, lint and test on every PR and on pushes to `main`.
- `ota-publish.yml`: manual "Publish OTA update" button (channel, rollout %, critical, note).
  Needs repo or environment secrets `OTA_API_URL` and `OTA_ADMIN_TOKEN`.
