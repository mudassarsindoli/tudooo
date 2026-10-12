import * as vscode from "vscode";
import { HiddenStore } from "./hiddenStore";
import { scanWorkspace } from "./scanner";
import type { FilterKind, ScanResult, TodoItem } from "./types";

export class FileNode extends vscode.TreeItem {
  public constructor(
    public readonly relativePath: string,
    public readonly fileUri: vscode.Uri,
    public readonly fileUriString: string,
    count: number,
  ) {
    super(relativePath, vscode.TreeItemCollapsibleState.Expanded);
    this.contextValue = "todoFile";
    this.resourceUri = fileUri;
    this.description = String(count);
    this.iconPath = vscode.ThemeIcon.File;
    this.tooltip = `${relativePath} (${count})`;
  }
}

export class ItemNode extends vscode.TreeItem {
  public constructor(public readonly todo: TodoItem) {
    const label = todo.text.length > 0 ? todo.text : todo.kind;
    super(label, vscode.TreeItemCollapsibleState.None);
    this.contextValue = "todoItem";
    this.description = `${todo.kind} · L${todo.line} · ${todo.ageLabel}`;
    this.tooltip = `${todo.kind} in ${todo.relativePath}:${todo.line}\n${todo.text || "(no text)"}\n${todo.ageLabel}`;
    this.iconPath = iconForKind(todo.kind);
    this.command = {
      command: "vscode.open",
      title: "Open",
      arguments: [
        vscode.Uri.parse(todo.uri),
        {
          selection: new vscode.Range(todo.line - 1, todo.column, todo.line - 1, todo.column),
        } satisfies vscode.TextDocumentShowOptions,
      ],
    };
  }
}

export type TodoNode = FileNode | ItemNode;

export class TodoTreeProvider implements vscode.TreeDataProvider<TodoNode> {
  private readonly emitter = new vscode.EventEmitter<TodoNode | undefined>();
  public readonly onDidChangeTreeData = this.emitter.event;

  private result: ScanResult = {
    groups: [],
    counts: { TODO: 0, FIXME: 0, HACK: 0, XXX: 0 },
    total: 0,
  };
  private filter: FilterKind = "ALL";
  private scanning = false;

  public constructor(private readonly hidden: HiddenStore) {}

  public getFilter(): FilterKind {
    return this.filter;
  }

  public setFilter(filter: FilterKind): void {
    this.filter = filter;
    this.emitter.fire(undefined);
  }

  public getResult(): ScanResult {
    return this.result;
  }

  public isScanning(): boolean {
    return this.scanning;
  }

  public getTreeItem(element: TodoNode): vscode.TreeItem {
    return element;
  }

  public getChildren(element?: TodoNode): TodoNode[] {
    if (!element) {
      return this.visibleGroups().map(
        (group) =>
          new FileNode(
            group.relativePath,
            vscode.Uri.parse(group.uri),
            group.uri,
            group.items.length,
          ),
      );
    }

    if (element instanceof FileNode) {
      const group = this.visibleGroups().find((item) => item.uri === element.fileUriString);
      return group ? group.items.map((todo) => new ItemNode(todo)) : [];
    }

    return [];
  }

  public async scan(): Promise<void> {
    if (this.scanning) {
      return;
    }
    this.scanning = true;
    try {
      this.result = await scanWorkspace(this.hidden.getHidden());
      this.emitter.fire(undefined);
    } finally {
      this.scanning = false;
    }
  }

  public async hideItem(node: ItemNode): Promise<void> {
    await this.hidden.hide(node.todo.id);
    this.result = {
      ...this.result,
      groups: this.result.groups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => item.id !== node.todo.id),
        }))
        .filter((group) => group.items.length > 0),
      total: Math.max(0, this.result.total - 1),
      counts: {
        ...this.result.counts,
        [node.todo.kind]: Math.max(0, this.result.counts[node.todo.kind] - 1),
      },
    };
    this.emitter.fire(undefined);
  }

  public visibleCount(): number {
    return this.visibleGroups().reduce((sum, group) => sum + group.items.length, 0);
  }

  public summary(): string {
    const visible = this.visibleCount();
    const { counts } = this.result;
    const parts = [
      `${visible} shown`,
      `TODO ${counts.TODO}`,
      `FIXME ${counts.FIXME}`,
      `HACK ${counts.HACK}`,
      `XXX ${counts.XXX}`,
    ];
    if (this.filter !== "ALL") {
      parts.unshift(this.filter);
    }
    return parts.join(" · ");
  }

  private visibleGroups() {
    if (this.filter === "ALL") {
      return this.result.groups;
    }
    return this.result.groups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => item.kind === this.filter),
      }))
      .filter((group) => group.items.length > 0);
  }
}

function iconForKind(kind: TodoItem["kind"]): vscode.ThemeIcon {
  switch (kind) {
    case "TODO":
      return new vscode.ThemeIcon("checklist");
    case "FIXME":
      return new vscode.ThemeIcon("warning");
    case "HACK":
      return new vscode.ThemeIcon("tools");
    case "XXX":
      return new vscode.ThemeIcon("error");
  }
}
