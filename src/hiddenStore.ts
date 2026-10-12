import type * as vscode from "vscode";

const STORAGE_KEY = "tudooo.hiddenIds";

export class HiddenStore {
  public constructor(private readonly context: vscode.ExtensionContext) {}

  public getHidden(): Set<string> {
    const stored = this.context.workspaceState.get<string[]>(STORAGE_KEY, []);
    return new Set(stored);
  }

  public async hide(id: string): Promise<void> {
    const hidden = this.getHidden();
    hidden.add(id);
    await this.context.workspaceState.update(STORAGE_KEY, [...hidden]);
  }
}
