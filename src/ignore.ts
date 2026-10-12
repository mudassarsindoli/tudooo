export const SKIP_DIRECTORY_GLOBS = [
  "**/.git/**",
  "**/node_modules/**",
  "**/dist/**",
  "**/out/**",
  "**/build/**",
  "**/coverage/**",
  "**/.next/**",
  "**/.nuxt/**",
  "**/.output/**",
  "**/target/**",
  "**/.venv/**",
  "**/venv/**",
  "**/vendor/**",
  "**/.vscode-test/**",
] as const;

export const BINARY_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".pdf",
  ".zip",
  ".gz",
  ".tar",
  ".7z",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".exe",
  ".dll",
  ".so",
  ".dylib",
  ".bin",
  ".class",
  ".o",
  ".obj",
  ".wasm",
  ".mp3",
  ".mp4",
  ".mov",
  ".avi",
  ".webm",
  ".sqlite",
  ".db",
]);

export const SKIP_FILE_NAMES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "composer.lock",
  "Cargo.lock",
  "go.sum",
]);

export function excludeGlob(): string {
  return `{${SKIP_DIRECTORY_GLOBS.join(",")}}`;
}

export function isProbablyBinary(fileName: string, bytes: Uint8Array): boolean {
  const ext = extensionOf(fileName);
  if (BINARY_EXTENSIONS.has(ext)) {
    return true;
  }

  const sample = bytes.subarray(0, Math.min(bytes.length, 8000));
  return sample.includes(0);
}

export function shouldSkipFileName(fileName: string): boolean {
  const base = fileName.split(/[/\\]/).pop() ?? fileName;
  if (SKIP_FILE_NAMES.has(base)) {
    return true;
  }
  return base.endsWith(".min.js") || base.endsWith(".min.css") || base.endsWith(".map");
}

function extensionOf(fileName: string): string {
  const base = fileName.split(/[/\\]/).pop() ?? fileName;
  const dot = base.lastIndexOf(".");
  if (dot < 0) {
    return "";
  }
  return base.slice(dot).toLowerCase();
}
