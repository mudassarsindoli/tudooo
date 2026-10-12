export const COMMENT_KINDS = ["TODO", "FIXME", "HACK", "XXX"] as const;

export type CommentKind = (typeof COMMENT_KINDS)[number];

export type FilterKind = CommentKind | "ALL";

export interface ParsedComment {
  kind: CommentKind;
  text: string;
  line: number;
  column: number;
}

export interface TodoItem {
  id: string;
  uri: string;
  fsPath: string;
  relativePath: string;
  kind: CommentKind;
  text: string;
  line: number;
  column: number;
  ageMs: number;
  ageLabel: string;
  timestamp: number;
}

export interface FileGroup {
  uri: string;
  fsPath: string;
  relativePath: string;
  items: TodoItem[];
}

export interface ScanResult {
  groups: FileGroup[];
  counts: Record<CommentKind, number>;
  total: number;
}

export function isCommentKind(value: string): value is CommentKind {
  return (COMMENT_KINDS as readonly string[]).includes(value.toUpperCase());
}
