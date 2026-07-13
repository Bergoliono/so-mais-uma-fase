import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, renameSync, rmSync, statSync } from "node:fs";
import path from "node:path";

const browserPath = process.env.QA_BROWSER_PATH ?? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const root = process.cwd();
const baseUrl = process.env.QA_BASE_URL ?? "http://127.0.0.1:3000";
const profileRoot = path.join(root, "chrome-profile-screenshots");

const captures = [
  ["qa-home-360.png", 360, 844, "/"],
  ["qa-home-390.png", 390, 844, "/"],
  ["qa-home-430.png", 430, 900, "/"],
  ["qa-home-desktop.png", 1280, 900, "/"],
  ["qa-ranking-390.png", 390, 844, "/ranking"],
  ["qa-game-sequence-390.png", 390, 844, "/jogos/sequencia-logica"],
  ["qa-login-390.png", 390, 844, "/login"],
  ["qa-profile-390.png", 390, 844, "/perfil"],
  ["qa-admin-390.png", 390, 844, "/admin"],
  ["qa-admin-games-390.png", 390, 844, "/admin/jogos"],
  ["qa-external-game-390.png", 390, 844, "/jogos/matematica-rapida"],
  ["qa-category-logica-390.png", 390, 844, "/categorias/logica"]
];

rmSync(profileRoot, { recursive: true, force: true });
mkdirSync(profileRoot, { recursive: true });

for (const [name, width, height, route] of captures) {
  const target = `${baseUrl}${route}`;
  const output = path.join(root, name);
  const tempOutput = path.join(root, `${name}.tmp.png`);
  const profileDir = path.join(profileRoot, String(name).replace(/[^a-z0-9]/gi, "-"));
  mkdirSync(profileDir, { recursive: true });
  rmSync(tempOutput, { force: true });
  const result = spawnSync(
    browserPath,
    [
      "--headless=new",
      "--disable-gpu",
      "--disable-gpu-compositing",
      "--disable-gpu-sandbox",
      "--disable-extensions",
      "--disable-features=Vulkan,UseSkiaRenderer,CanvasOopRasterization",
      "--use-angle=swiftshader",
      "--hide-scrollbars",
      "--no-first-run",
      "--disable-background-networking",
      `--user-data-dir=${profileDir}`,
      `--window-size=${width},${height}`,
      `--screenshot=${tempOutput}`,
      target
    ],
    {
      encoding: "utf8",
      timeout: 30000
    }
  );

  const captured = existsSync(tempOutput) && statSync(tempOutput).size > 0;
  if (result.status !== 0 && !captured) {
    throw new Error(`Screenshot failed for ${route}: ${result.stderr || result.stdout || `exit ${result.status}`}`);
  }

  if (captured) {
    rmSync(output, { force: true });
    renameSync(tempOutput, output);
  }

  console.log(`${name} <- ${target}`);
}
