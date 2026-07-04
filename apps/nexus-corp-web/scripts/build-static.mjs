import { existsSync } from "node:fs"
import { mkdir, readdir, rename, rm } from "node:fs/promises"
import { dirname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { spawn } from "node:child_process"

const rootDir = fileURLToPath(new URL("..", import.meta.url))
const tempDir = join(rootDir, ".tmp-static-routes")

const apiRoutesDir = join(rootDir, "src", "pages", "api")

const run = (command, args, options = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      env: {
        ...process.env,
        BUILD_TARGET: "static",
        ASTRO_OUTPUT: "static",
      },
      shell: process.platform === "win32",
      stdio: "inherit",
      ...options,
    })

    child.on("exit", (code) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`))
    })
  })

const collectFiles = async (directory) => {
  if (!existsSync(directory)) {
    return []
  }

  const files = []
  const entries = await readdir(directory, { withFileTypes: true })

  for (const entry of entries) {
    const path = join(directory, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(path)))
      continue
    }

    if (entry.isFile()) {
      files.push(path)
    }
  }

  return files
}

const getDynamicRoutes = async () => [
  ...(await collectFiles(apiRoutesDir)).map((source) => ({
    source,
    backup: join(tempDir, "api", relative(apiRoutesDir, source)),
  })),
]

const moveIfExists = async (source, target) => {
  if (!existsSync(source)) {
    return false
  }

  await mkdir(dirname(target), { recursive: true })
  await rename(source, target)
  return true
}

const restore = async (movedRoutes) => {
  for (const route of movedRoutes.reverse()) {
    if (existsSync(route.source)) {
      await rm(route.source, { recursive: true, force: true })
    }

    if (existsSync(route.backup)) {
      await mkdir(dirname(route.source), { recursive: true })
      await rename(route.backup, route.source)
    }
  }

  await rm(tempDir, { recursive: true, force: true })
}

const movedRoutes = []

try {
  await rm(tempDir, { recursive: true, force: true })

  for (const route of await getDynamicRoutes()) {
    if (await moveIfExists(route.source, route.backup)) {
      movedRoutes.push(route)
    }
  }

  await run("astro", ["build"])
} finally {
  await restore(movedRoutes)
}
