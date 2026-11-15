// Builds Reroll for macOS (Apple Silicon, Intel) and Windows (ARM64, x64) and writes the
// downloads to out/.
//
//   npm run dist                          all four targets; macOS ones signed + notarized
//   npm run dist -- --target mac-arm64    only some targets (comma-separated)
//   npm run dist:unsigned                 local test build, no signing
//
// Targets: mac-arm64, mac-x64, win-arm64, win-x64.
// macOS builds are signed with Developer ID, notarized and stapled (.dmg + .zip).
// Windows builds are portable .zip files and are not code-signed.
//
// Env (optional):
//   REROLL_SIGN_IDENTITY   codesign identity; default = first "Developer ID Application" in the keychain
//   REROLL_NOTARY_PROFILE  notarytool keychain profile; default "reroll-notary"
import { packager } from "@electron/packager";
import { flipFuses, FuseVersion, FuseV1Options } from "@electron/fuses";
import { sign } from "@electron/osx-sign";
import { notarize } from "@electron/notarize";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const NAME = pkg.productName;
const BUNDLE_ID = "com.ai-lottery.reroll";
const OUT = path.join(root, "out");
// Package and sign in a fresh temp dir so nothing from the source tree's file metadata reaches codesign.
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), "reroll-build-"));
const SIGN = !process.argv.includes("--no-sign");
const PROFILE = process.env.REROLL_NOTARY_PROFILE || "reroll-notary";
const ENTITLEMENTS = path.join(root, "build", "entitlements.plist");
const ALL = ["mac-arm64", "mac-x64", "win-arm64", "win-x64"];
const ti = process.argv.indexOf("--target");
const TARGETS = ti > 0 ? process.argv[ti + 1].split(",") : ALL;
for (const t of TARGETS) if (!ALL.includes(t)) throw new Error(`Unknown target "${t}". Use: ${ALL.join(", ")}`);

const sh = (cmd, args, opts = {}) => execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts });
const step = (msg) => console.log(`\n▶ ${msg}`);
const sha256 = (f) => sh("shasum", ["-a", "256", f]).split(" ")[0];

function findIdentity() {
  if (process.env.REROLL_SIGN_IDENTITY) return process.env.REROLL_SIGN_IDENTITY;
  const m = sh("security", ["find-identity", "-v", "-p", "codesigning"]).match(/"(Developer ID Application: [^"]+)"/);
  if (!m) throw new Error("No \"Developer ID Application\" identity in the keychain. Import the certificate first.");
  return m[1];
}

const COMMON = {
  dir: root,
  out: WORK,
  name: NAME,
  appVersion: pkg.version,
  buildVersion: pkg.version,
  appCopyright: "MIT License",
  asar: true,
  prune: true,
  overwrite: true,
  ignore: [/^\/(build|test|out|docs|node_modules|\.signing|\.git|\.github)(\/|$)/, /^\/(\.gitignore|README\.md|LICENSE)$/],
};

// Electron fuses: turn off ways to run arbitrary code through the shipped binary.
const fuses = (binary, mac) => flipFuses(binary, {
  version: FuseVersion.V1,
  resetAdHocDarwinSignature: mac && !SIGN,
  [FuseV1Options.RunAsNode]: false,
  [FuseV1Options.EnableCookieEncryption]: true,
  [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
  [FuseV1Options.EnableNodeCliInspectArguments]: false,
  [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
  [FuseV1Options.OnlyLoadAppFromAsar]: true,
});

async function buildMac(arch, identity) {
  step(`mac-${arch}: package`);
  const [appDir] = await packager({
    ...COMMON,
    platform: "darwin",
    arch,
    appBundleId: BUNDLE_ID,
    appCategoryType: "public.app-category.developer-tools",
    icon: path.join(root, "build", "icon.icns"),
    darwinDarkModeSupport: true,
    extendInfo: { LSMinimumSystemVersion: "12.0" },
  });
  const app = path.join(appDir, `${NAME}.app`);
  await fuses(app, true);

  const base = path.join(WORK, `${NAME}-${pkg.version}-mac-${arch}`);
  const zip = `${base}.zip`, dmg = `${base}.dmg`;
  // ditto keeps symlinks and extended attributes; plain `zip` would break the signature.
  const makeZip = () => { fs.rmSync(zip, { force: true }); sh("ditto", ["-c", "-k", "--sequesterRsrc", "--keepParent", app, zip]); };
  if (!SIGN) { makeZip(); return [zip]; }

  step(`mac-${arch}: sign`);
  // codesign refuses files carrying Finder info or resource forks; strip extended attributes first.
  sh("xattr", ["-cr", app]);
  await sign({ app, identity, platform: "darwin", optionsForFile: () => ({ hardenedRuntime: true, entitlements: ENTITLEMENTS }) });
  sh("codesign", ["--verify", "--deep", "--strict", "--verbose=2", app]);

  step(`mac-${arch}: notarize app (profile ${PROFILE})`);
  await notarize({ appPath: app, keychainProfile: PROFILE });
  sh("xcrun", ["stapler", "validate", app]);

  step(`mac-${arch}: zip + dmg`);
  makeZip();
  const stage = fs.mkdtempSync(path.join(WORK, "dmg-"));
  sh("ditto", [app, path.join(stage, `${NAME}.app`)]);
  fs.symlinkSync("/Applications", path.join(stage, "Applications"));
  fs.rmSync(dmg, { force: true });
  sh("hdiutil", ["create", "-volname", NAME, "-srcfolder", stage, "-fs", "HFS+", "-format", "UDZO", "-ov", dmg]);
  fs.rmSync(stage, { recursive: true, force: true });
  sh("codesign", ["--sign", identity, "--timestamp", dmg]);
  step(`mac-${arch}: notarize dmg`);
  console.log(sh("xcrun", ["notarytool", "submit", dmg, "--keychain-profile", PROFILE, "--wait"]));
  sh("xcrun", ["stapler", "staple", dmg]);

  // Gatekeeper's verdict, exactly as a downloader's Mac would see it.
  const opt = { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] };
  console.log(execFileSync("spctl", ["--assess", "--type", "execute", "--verbose=2", app], opt) || "  app: accepted");
  console.log(execFileSync("spctl", ["--assess", "--type", "open", "--context", "context:primary-signature", "--verbose=2", dmg], opt) || "  dmg: accepted");
  return [dmg, zip];
}

async function buildWin(arch) {
  step(`win-${arch}: package`);
  const [appDir] = await packager({
    ...COMMON,
    platform: "win32",
    arch,
    icon: path.join(root, "build", "icon.ico"),
    win32metadata: {
      CompanyName: "AI Lottery",
      ProductName: "AI Lottery · Reroll",
      FileDescription: "AI Lottery · Reroll",
      OriginalFilename: `${NAME}.exe`,
    },
  });
  await fuses(path.join(appDir, `${NAME}.exe`), false);
  // Portable zip with a single top-level "Reroll" folder.
  const folder = path.join(WORK, `win-${arch}`, NAME);
  fs.mkdirSync(path.dirname(folder), { recursive: true });
  fs.renameSync(appDir, folder);
  const zip = path.join(WORK, `${NAME}-${pkg.version}-win-${arch}.zip`);
  fs.rmSync(zip, { force: true });
  sh("ditto", ["-c", "-k", "--norsrc", "--keepParent", folder, zip]);
  return [zip];
}

const identity = SIGN && TARGETS.some((t) => t.startsWith("mac")) ? findIdentity() : null;
if (identity) console.log("identity:", identity);
const files = [];
for (const t of TARGETS) {
  const [os_, arch] = t.split("-");
  files.push(...(os_ === "mac" ? await buildMac(arch, identity) : await buildWin(arch)));
}

// Copy the finished downloads to out/ and list them with checksums.
fs.mkdirSync(OUT, { recursive: true });
step("downloads");
for (const f of files) {
  fs.copyFileSync(f, path.join(OUT, path.basename(f)));
  console.log(`  ${path.basename(f)}  ${(fs.statSync(f).size / 1e6).toFixed(1)} MB  sha256 ${sha256(f)}`);
}
console.log(`\nDone → ${OUT}`);
