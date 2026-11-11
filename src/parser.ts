import { COMMENT_KINDS, type CommentKind, type ParsedComment } from "./types";

const KIND_PATTERN = COMMENT_KINDS.join("|");
const COMMENT_RE = new RegExp(
  String.raw`\b(${KIND_PATTERN})\b(?:\s*[:\-–—]\s*|\s+)?(.*)$`,
  "i",
);

export function parseComments(source: string): ParsedComment[] {
  const comments: ParsedComment[] = [];
  const lines = source.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const match = COMMENT_RE.exec(line);
    if (!match) {
      continue;
    }

    const kind = match[1].toUpperCase() as CommentKind;
    const text = match[2]
      .replace(/\s*\*\/\s*$/, "")
      .replace(/\s*-->\s*$/, "")
      .trim();
    comments.push({
      kind,
      text,
      line: index + 1,
      column: match.index,
      matchLength: match[0].length,
    });
  }

  return comments;
}

export function itemId(uri: string, line: number, kind: CommentKind, text: string): string {
  return `${uri}:${line}:${kind}:${text}`;
}
