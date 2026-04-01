# lencode

Personal fork of [opencode](https://github.com/anomalyco/opencode) with minor tweaks.

```bash
bunx -y @lenstr/lencode
```

## Tweaks

- **Font size setting** — adjustable base font size in Settings → Appearance

## Sync with upstream

```bash
git checkout dev && git pull upstream dev && git push origin dev
git checkout lenstr && git rebase dev && git push origin lenstr --force-with-lease
```

## Publish

```bash
bun script/publish-fork.ts
```
