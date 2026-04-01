#!/usr/bin/env bun

import { $ } from "bun"
import { fileURLToPath } from "url"

const scope = "@lenstr"
const name = "lencode"
const targets = ["linux-x64", "linux-arm64", "darwin-x64", "darwin-arm64"]

process.chdir(fileURLToPath(new URL("../packages/opencode", import.meta.url)))

console.log("=== building ===\n")
await $`bun run build`

// Collect binaries for target platforms
const deps: Record<string, string> = {}
let version = ""
for (const filepath of new Bun.Glob("*/package.json").scanSync({ cwd: "./dist" })) {
  const p = await Bun.file(`./dist/${filepath}`).json()
  if (!targets.some((t) => p.name.endsWith(t))) continue
  const scoped = `${scope}/${p.name}`
  version = p.version
  deps[scoped] = version
  p.name = scoped
  await Bun.file(`./dist/${p.name.split("/")[1]}/package.json`).write(JSON.stringify(p, null, 2))
}

if (!version) {
  console.error("No binaries built")
  process.exit(1)
}
console.log("binaries:", deps, "\n")

// Publish platform binaries
for (const scoped of Object.keys(deps)) {
  console.log(`publishing ${scoped}@${version}`)
  await $`npm publish --access public --tag latest`.cwd(`./dist/${scoped.split("/")[1]}`)
}

// Build meta-package
await $`mkdir -p ./dist/meta/bin`
// Patch bin script to resolve @lenstr/ scoped packages instead of unscoped
const bin = (await Bun.file("./bin/opencode").text())
  .replace('const base = "opencode-"', `const base = "${scope}/opencode-"`)
await Bun.file("./dist/meta/bin/opencode").write(bin)
await $`chmod +x ./dist/meta/bin/opencode`

const postinstall = (await Bun.file("./script/postinstall.mjs").text())
  .replace("const packageName = `opencode-", `const packageName = \`${scope}/opencode-`)
await Bun.file("./dist/meta/postinstall.mjs").write(postinstall)
await Bun.file("./dist/meta/LICENSE").write(await Bun.file("../../LICENSE").text())
await Bun.file("./dist/meta/package.json").write(JSON.stringify({
  name: `${scope}/${name}`,
  version,
  bin: { [name]: "./bin/opencode" },
  scripts: { postinstall: "bun ./postinstall.mjs || node ./postinstall.mjs" },
  license: (await Bun.file("./package.json").json()).license,
  optionalDependencies: deps,
}, null, 2))

console.log(`\npublishing ${scope}/${name}@${version}`)
await $`npm publish --access public --tag latest`.cwd(`./dist/meta`)
console.log(`\n=== done ===\nInstall: bunx -y ${scope}/${name}`)
