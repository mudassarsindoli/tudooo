import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export function formatAge(timestampMs: number, nowMs: number = Date.now()): string {
  const delta = Math.max(0, nowMs - timestampMs);
  const seconds = Math.floor(delta / 1000);
  if (seconds < 60) {
    return "just now";
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days}d ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months}mo ago`;
  }

  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

export async function getLineAges(
  filePath: string,
  cwd: string,
  fallbackMs: number,
): Promise<Map<number, number>> {
  const ages = new Map<number, number>();
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["blame", "--line-porcelain", "--", filePath],
      { cwd: cwd || path.dirname(filePath), maxBuffer: 8 * 1024 * 1024, timeout: 15_000 },
    );
    parseBlamePorcelain(stdout, ages);
    if (ages.size > 0) {
      return ages;
    }
  } catch {
    // Not a git file, git missing, or blame unavailable.
  }
  ages.set(0, fallbackMs);
  return ages;
}

export function parseBlamePorcelain(output: string, ages: Map<number, number>): void {
  const lines = output.split("\n");
  let pendingLine: number | undefined;
  let pendingTime: number | undefined;

  for (const line of lines) {
    const header = /^[0-9a-f]{40}\s+\d+\s+(\d+)(?:\s+\d+)?$/i.exec(line);
    if (header) {
      pendingLine = Number(header[1]);
      pendingTime = undefined;
      continue;
    }

    if (line.startsWith("author-time ")) {
      pendingTime = Number(line.slice("author-time ".length)) * 1000;
      if (pendingLine !== undefined && Number.isFinite(pendingTime)) {
        ages.set(pendingLine, pendingTime);
      }
    }
  }
}

export function ageForLine(ages: Map<number, number>, line: number, fallbackMs: number): number {
  return ages.get(line) ?? ages.get(0) ?? fallbackMs;
}
