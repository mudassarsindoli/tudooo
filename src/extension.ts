import * as vscode from "vscode";
import { registerCommands } from "./commands";
import { CommentDecorator } from "./decorations";
import { HiddenStore } from "./hiddenStore";
import { TodoTreeProvider } from "./treeProvider";

export function activate(context: vscode.ExtensionContext): void {
  const hidden = new HiddenStore(context);
  const provider = new TodoTreeProvider(hidden);
  const treeView = vscode.window.createTreeView("tudooo.tracker", {
    treeDataProvider: provider,
    showCollapseAll: true,
  });

  const decorator = new CommentDecorator();
  decorator.decorateAll(vscode.window.visibleTextEditors);

  context.subscriptions.push(
    treeView,
    decorator,
    vscode.window.onDidChangeActiveTextEditor((editor) => decorator.decorate(editor)),
    vscode.window.onDidChangeVisibleTextEditors((editors) => decorator.decorateAll(editors)),
    vscode.workspace.onDidChangeTextDocument((event) => {
      const editor = vscode.window.visibleTextEditors.find(
        (candidate) => candidate.document === event.document,
      );
      decorator.scheduleDecorate(editor);
    }),
  );

  registerCommands(context, provider, treeView);

  void vscode.commands.executeCommand("tudooo.scanWorkspace");
}

export function deactivate(): void {
  // Nothing to dispose beyond subscriptions registered in activate.
}
