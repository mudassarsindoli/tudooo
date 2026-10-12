import * as vscode from "vscode";
import { registerCommands } from "./commands";
import { HiddenStore } from "./hiddenStore";
import { TodoTreeProvider } from "./treeProvider";

export function activate(context: vscode.ExtensionContext): void {
  const hidden = new HiddenStore(context);
  const provider = new TodoTreeProvider(hidden);
  const treeView = vscode.window.createTreeView("tudooo.tracker", {
    treeDataProvider: provider,
    showCollapseAll: true,
  });

  context.subscriptions.push(treeView);
  registerCommands(context, provider, treeView);

  void vscode.commands.executeCommand("tudooo.scanWorkspace");
}

export function deactivate(): void {
  // Nothing to dispose beyond subscriptions registered in activate.
}
