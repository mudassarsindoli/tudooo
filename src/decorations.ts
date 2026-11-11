import * as vscode from "vscode";
import { KIND_COLOR_IDS } from "./colors";
import { parseComments } from "./parser";
import { COMMENT_KINDS, type CommentKind } from "./types";

const MAX_DECORATE_LENGTH = 2_000_000;
const DEBOUNCE_MS = 150;

export class CommentDecorator implements vscode.Disposable {
  private readonly decorationTypes: Record<CommentKind, vscode.TextEditorDecorationType>;
  private readonly pending = new Map<string, ReturnType<typeof setTimeout>>();

  public constructor() {
    this.decorationTypes = {
      TODO: createDecorationType("TODO"),
      FIXME: createDecorationType("FIXME"),
      HACK: createDecorationType("HACK"),
      XXX: createDecorationType("XXX"),
    };
  }

  public decorateAll(editors: readonly vscode.TextEditor[]): void {
    for (const editor of editors) {
      this.decorate(editor);
    }
  }

  public decorate(editor: vscode.TextEditor | undefined): void {
    if (!editor) {
      return;
    }

    const document = editor.document;
    const text = document.getText();
    if (text.length > MAX_DECORATE_LENGTH) {
      return;
    }

    const ranges: Record<CommentKind, vscode.Range[]> = {
      TODO: [],
      FIXME: [],
      HACK: [],
      XXX: [],
    };

    for (const comment of parseComments(text)) {
      const line = comment.line - 1;
      ranges[comment.kind].push(
        new vscode.Range(
          new vscode.Position(line, comment.column),
          new vscode.Position(line, comment.column + comment.matchLength),
        ),
      );
    }

    for (const kind of COMMENT_KINDS) {
      editor.setDecorations(this.decorationTypes[kind], ranges[kind]);
    }
  }

  public scheduleDecorate(editor: vscode.TextEditor | undefined): void {
    if (!editor) {
      return;
    }
    const key = editor.document.uri.toString();
    const existing = this.pending.get(key);
    if (existing) {
      clearTimeout(existing);
    }
    this.pending.set(
      key,
      setTimeout(() => {
        this.pending.delete(key);
        this.decorate(editor);
      }, DEBOUNCE_MS),
    );
  }

  public dispose(): void {
    for (const timeout of this.pending.values()) {
      clearTimeout(timeout);
    }
    this.pending.clear();
    for (const kind of COMMENT_KINDS) {
      this.decorationTypes[kind].dispose();
    }
  }
}

function createDecorationType(kind: CommentKind): vscode.TextEditorDecorationType {
  return vscode.window.createTextEditorDecorationType({
    color: new vscode.ThemeColor(KIND_COLOR_IDS[kind]),
    fontWeight: "bold",
  });
}
