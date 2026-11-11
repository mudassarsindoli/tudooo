# tudooo

### Find forgotten TODOs before they become permanent.

**tudooo** is a lightweight, local-first VS Code extension that finds `TODO`, `FIXME`, `HACK`, and `XXX` comments across your workspace and organizes them in one simple sidebar.

No AI. No accounts. No backend. Just a better way to keep track of unfinished work.

---

## The Problem

You leave a quick reminder in your code.

```ts
// TODO: Add retry logic for failed payments

// FIXME: Handle expired sessions

// HACK: Temporary workaround for legacy API
```

You move on to the next task. A week passes. Then a month.

Those comments are still there.

**tudooo brings them back into view.**

## Features

- **Workspace scanning** — Find TODO comments across your project.
- **Four comment types** — Track `TODO`, `FIXME`, `HACK`, and `XXX`.
- **Color-coded comments** — Each type is highlighted right in the editor (yellow `TODO`, aqua `FIXME`, blue `HACK`, red `XXX`), and the sidebar icons match.
- **Native VS Code sidebar** — Browse comments grouped by file, shown by file name with the full path and a per-type breakdown on hover.
- **Per-file breakdown** — Each file entry in the sidebar shows how many of each comment type it contains.
- **Deploy-readiness status** — A status row at the top of the sidebar tells you at a glance whether you're good to deploy, based on outstanding `FIXME`/`XXX` comments.
- **Jump to code** — Click any item to open the exact file and line.
- **Age tracking** — See how long comments have been sitting around, using Git history when available.
- **Quick filtering** — Focus on one type of comment at a time.
- **Hide resolved items** — Clear completed items from the list without modifying your source code.
- **Smart exclusions** — Skip common dependency folders, build outputs, lockfiles, and binary files.
- **Local-first by design** — No AI, network requests, telemetry, backend, or database.

## How It Works

**1. Write comments as usual.**

```ts
// TODO: Add pagination
// FIXME: Handle duplicate transactions
// HACK: Remove after API migration
```

**2. Open the TODO Tracker sidebar.**

tudooo scans your workspace and groups matching comments by file, with a status row at the top showing total counts per type and whether you're good to deploy.

**3. Find what needs attention.**

Review comment text, line numbers, and age. Hover a file to see its full path and comment breakdown. Filter by type to focus on the most important issues.

**4. Jump straight to the code.**

Click an item to open its source location.

**5. Clean up your list.**

Fix the issue and hide the resolved item. Your source code remains untouched by the hide action.

## Example

```text
TODO Tracker
│
├── ⚠ Not ready to deploy      TODO 1 · FIXME 1 · HACK 1 · XXX 1
│
├── payment.ts                 TODO 1
│   └── TODO   Add retry logic       · 2 days
├── auth.ts                     FIXME 1
│   └── FIXME  Handle expired token  · 14 days
├── legacy.ts                   HACK 1
│   └── HACK   Remove old API        · 47 days
└── user.test.ts                XXX 1
    └── XXX    Add missing test      · 103 days
```

Files are listed by name (hover one to see its full path and type breakdown); the status row at the top reflects the whole workspace, independent of any active filter.

_Illustrative example. Actual results depend on your workspace._

## Installation

### Option 1: Install from a VSIX

Download the `.vsix` package from the project's GitHub Releases page, then run:

```bash
code --install-extension tudooo-0.1.0.vsix
```

Alternatively, in VS Code, open **Extensions → `...` → Install from VSIX...** and select the downloaded file.

### Option 2: Run from source

Clone the repository and open it in VS Code or Cursor.

```bash
npm install
npm run compile
```

Press **F5** to launch the Extension Development Host.

### Package the extension

```bash
npm install
npm run compile
npm run package
```

This produces a `.vsix` package if the packaging script and required tooling are configured.

## Color coding

| Type    | Color  |
| ------- | ------ |
| `TODO`  | Yellow |
| `FIXME` | Aqua   |
| `HACK`  | Blue   |
| `XXX`   | Red    |

These colors highlight the keyword directly in the editor and tint the matching icon in the sidebar. Each color is a VS Code theme color (`tudooo.todoForeground`, `tudooo.fixmeForeground`, `tudooo.hackForeground`, `tudooo.xxxForeground`), so you can override it from your theme or `workbench.colorCustomizations`.

## Deploy-readiness status

The status row at the top of the sidebar flags the workspace as **"Good to deploy"** or **"Not ready to deploy"** based on outstanding `FIXME` and `XXX` comments — the two types that typically mark real bugs rather than nice-to-haves. `TODO` and `HACK` are shown for visibility but don't block the status.

## Commands

| Command                            | Description              |
| ---------------------------------- | ------------------------ |
| `tudooo: Refresh`                  | Refresh the comment list |
| `tudooo: Scan Workspace`           | Scan the workspace again |
| `tudooo: Clear/Hide resolved item` | Hide a selected item     |
| `tudooo: Filter comments`          | Filter by comment type   |

## Privacy

Your code stays on your machine.

- No source code uploads.
- No AI processing.
- No external API calls.
- No telemetry.
- No account required.

Git history is read locally when available to estimate comment age.

## Configuration

| Setting              |   Default | Description                                 |
| -------------------- | --------: | ------------------------------------------- |
| `tudooo.maxFileSize` | `1048576` | Maximum file size to scan, in bytes (1 MB). |

## Limitations

- Detection uses keyword matching, not a language-aware parser. Matching text inside strings may also appear.
- Git-based age information may be unavailable for untracked files or unsupported Git setups.
- Large workspaces may take longer to scan.
- Hidden items can reappear if their identifying file, line, type, or text changes.
- Only `TODO`, `FIXME`, `HACK`, and `XXX` are tracked by default.

## Development

```bash
npm install
npm run compile
npm run watch
npm test
npm run package
```

Run tests and launch the Extension Development Host to verify changes locally.

## Contributing

Found a bug or have an improvement in mind?

Open an issue or submit a pull request. Keep changes focused, lightweight, and consistent with VS Code's native experience.

## License

MIT

---

**Less forgotten work. Cleaner projects. One small extension.**

If tudooo helps you keep your codebase organized, give the repository a star.
