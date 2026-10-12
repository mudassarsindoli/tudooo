import * as vscode from "vscode";
import { ItemNode, type TodoNode, type TodoTreeProvider } from "./treeProvider";
import { COMMENT_KINDS, type FilterKind } from "./types";

export function registerCommands(
  context: vscode.ExtensionContext,
  provider: TodoTreeProvider,
  treeView: vscode.TreeView<TodoNode>,
): void {
  const runScan = async (title: string): Promise<void> => {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Window,
        title,
      },
      async () => {
        await provider.scan();
        treeView.description = provider.summary();
        treeView.badge = {
          value: provider.visibleCount(),
          tooltip: provider.summary(),
        };
      },
    );
  };

  context.subscriptions.push(
    vscode.commands.registerCommand("todooo.refresh", () => runScan("todooo: Refreshing")),
    vscode.commands.registerCommand("todooo.scanWorkspace", () => runScan("todooo: Scanning workspace")),
    vscode.commands.registerCommand("todooo.hideItem", async (node?: ItemNode) => {
      const target =
        node instanceof ItemNode
          ? node
          : treeView.selection.find((item): item is ItemNode => item instanceof ItemNode);
      if (!target) {
        vscode.window.showInformationMessage("Select a comment in TODO Tracker to hide it.");
        return;
      }
      await provider.hideItem(target);
      treeView.description = provider.summary();
      treeView.badge = {
        value: provider.visibleCount(),
        tooltip: provider.summary(),
      };
    }),
    vscode.commands.registerCommand("todooo.filter", async () => {
      const picked = await vscode.window.showQuickPick(
        [
          { label: "All", description: "Show every tracked comment", filter: "ALL" as FilterKind },
          ...COMMENT_KINDS.map((kind) => ({
            label: kind,
            description: `Show only ${kind} comments`,
            filter: kind as FilterKind,
          })),
        ],
        { title: "Filter TODO Tracker", placeHolder: "Choose a comment type" },
      );
      if (!picked) {
        return;
      }
      provider.setFilter(picked.filter);
      treeView.description = provider.summary();
      treeView.badge = {
        value: provider.visibleCount(),
        tooltip: provider.summary(),
      };
    }),
    provider.onDidChangeTreeData(() => {
      treeView.description = provider.summary();
      treeView.badge = {
        value: provider.visibleCount(),
        tooltip: provider.summary(),
      };
    }),
  );
}
