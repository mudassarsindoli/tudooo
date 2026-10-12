import * as vscode from "vscode";
import { ageForLine, formatAge, getLineAges } from "./age";
import { excludeGlob, isProbablyBinary, shouldSkipFileName } from "./ignore";
import { itemId, parseComments } from "./parser";
import type { CommentKind, FileGroup, ParsedComment, ScanResult, TodoItem } from "./types";

const DEFAULT_MAX_FILE_SIZE = 1_048_576;
const PARSE_CONCURRENCY = 8;
const AGE_CONCURRENCY = 4;

interface ParsedFile {
  uri: vscode.Uri;
  folder: vscode.WorkspaceFolder;
  relativePath: string;
  comments: ParsedComment[];
  fallbackMs: number;
}

export async function scanWorkspace(hiddenIds: Set<string>): Promise<ScanResult> {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    return emptyResult();
  }

  const maxFileSize = vscode.workspace
    .getConfiguration("todooo")
    .get<number>("maxFileSize", DEFAULT_MAX_FILE_SIZE);

  const candidates: Array<{ uri: vscode.Uri; folder: vscode.WorkspaceFolder }> = [];
  for (const folder of folders) {
    const uris = await vscode.workspace.findFiles(
      new vscode.RelativePattern(folder, "**/*"),
      excludeGlob(),
    );
    for (const uri of uris) {
      if (!shouldSkipFileName(uri.fsPath)) {
        candidates.push({ uri, folder });
      }
    }
  }

  const parsedFiles: ParsedFile[] = [];
  await mapPool(candidates, PARSE_CONCURRENCY, async ({ uri, folder }) => {
    const parsed = await parseFile(uri, folder, maxFileSize);
    if (parsed) {
      parsedFiles.push(parsed);
    }
  });

  const groups: FileGroup[] = [];
  await mapPool(parsedFiles, AGE_CONCURRENCY, async (file) => {
    const group = await toGroup(file, hiddenIds);
    if (group) {
      groups.push(group);
    }
  });

  groups.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  const counts = emptyCounts();
  let total = 0;
  for (const group of groups) {
    for (const item of group.items) {
      counts[item.kind] += 1;
      total += 1;
    }
  }

  return { groups, counts, total };
}

async function parseFile(
  uri: vscode.Uri,
  folder: vscode.WorkspaceFolder,
  maxFileSize: number,
): Promise<ParsedFile | undefined> {
  let stat: vscode.FileStat;
  try {
    stat = await vscode.workspace.fs.stat(uri);
  } catch {
    return undefined;
  }

  if (stat.size > maxFileSize) {
    return undefined;
  }

  let bytes: Uint8Array;
  try {
    bytes = await vscode.workspace.fs.readFile(uri);
  } catch {
    return undefined;
  }

  if (isProbablyBinary(uri.fsPath, bytes)) {
    return undefined;
  }

  const source = Buffer.from(bytes).toString("utf8");
  const comments = parseComments(source);
  if (comments.length === 0) {
    return undefined;
  }

  return {
    uri,
    folder,
    relativePath: vscode.workspace.asRelativePath(uri, true),
    comments,
    fallbackMs: stat.mtime,
  };
}

async function toGroup(file: ParsedFile, hiddenIds: Set<string>): Promise<FileGroup | undefined> {
  const ages = await getLineAges(file.uri.fsPath, file.folder.uri.fsPath, file.fallbackMs);
  const now = Date.now();
  const items: TodoItem[] = [];

  for (const comment of file.comments) {
    const id = itemId(file.uri.toString(), comment.line, comment.kind, comment.text);
    if (hiddenIds.has(id)) {
      continue;
    }
    const timestamp = ageForLine(ages, comment.line, file.fallbackMs);
    items.push({
      id,
      uri: file.uri.toString(),
      fsPath: file.uri.fsPath,
      relativePath: file.relativePath,
      kind: comment.kind,
      text: comment.text,
      line: comment.line,
      column: comment.column,
      ageMs: Math.max(0, now - timestamp),
      ageLabel: formatAge(timestamp, now),
      timestamp,
    });
  }

  if (items.length === 0) {
    return undefined;
  }

  return {
    uri: file.uri.toString(),
    fsPath: file.uri.fsPath,
    relativePath: file.relativePath,
    items,
  };
}

async function mapPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  if (items.length === 0) {
    return;
  }

  let index = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const current = items[index];
      index += 1;
      await worker(current);
    }
  });
  await Promise.all(runners);
}

function emptyCounts(): Record<CommentKind, number> {
  return {
    TODO: 0,
    FIXME: 0,
    HACK: 0,
    XXX: 0,
  };
}

function emptyResult(): ScanResult {
  return { groups: [], counts: emptyCounts(), total: 0 };
}
