import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { Change, IChange } from "./Change";
import { Release, IRelease } from "./Release";
import { Guid } from "./Utils/Guid";

const versionTypes = ["major", "minor", "patch"];
const changeTypes = ["new", "change", "removed", "fix"];
const changeCategories = ["NAV-Content", "AX-Content", "Application"];

const const_ChangeLogFolder = ".changelog";

const unreleasedFolderName = "unreleased";

export function activate(context: vscode.ExtensionContext) {
  let addChange = vscode.commands.registerCommand(
    "manage-changelog.addChange",
    async () => {
      if (vscode.workspace.workspaceFolders) {
        let workspaceFolder = vscode.workspace.workspaceFolders[0];

        let changelogFolderPath = path.join(
          workspaceFolder.uri.fsPath,
          const_ChangeLogFolder
        );
        let change: Change = await getChangeFromUser();
        if (change.isValid()) {
          saveUnreleasedChange(changelogFolderPath, change);
        }
      } else {
        vscode.window.showErrorMessage(
          "Not in a workspace, please open a workspace first."
        );
      }
    }
  );
  let createRelease = vscode.commands.registerCommand(
    "manage-changelog.createRelease",
    async () => {
      let changelogFolderPath = getChangeLogFolderPath();
      if (!changelogFolderPath) {
        vscode.window.showErrorMessage(
          "Not in a workspace, please open a workspace first."
        );
        return;
      }
      let release = await getNewRelease();
      if (release) {
        let unreleasedChanges = getUnreleasedChanges();
        saveReleaseWithChanges(changelogFolderPath, release, unreleasedChanges);
        clearUnreleasedChanges(changelogFolderPath);
      }
    }
  );

  context.subscriptions.push(addChange);

  context.subscriptions.push(createRelease);
}

function getUnreleasedChanges(): IChange[] {
  return [];
}
function clearUnreleasedChanges(folderPath: string): void {
  let path = getUnreleasedFilePath(folderPath);
  if (path && fs.existsSync(path)) {
    fs.truncateSync(path);
  }
}

function getCurrentRelease(): IRelease {
  return new Release();
}
async function getNewRelease(): Promise<IRelease | undefined> {
  let release = getCurrentRelease();
  let newVersionType = await vscode.window.showQuickPick(versionTypes);

  switch (newVersionType) {
    case "major":
      release.increaseMajor();
      return release;
    case "minor":
      release.increaseMinor();
      return release;
    case "patch":
      let newPatch = await vscode.window.showInputBox();
      if (newPatch) {
        release.patch = newPatch;
      }
      return release;
    default:
      return undefined;
  }
}

function getChangeLogFolderPath(): string | undefined {
  if (vscode.workspace.workspaceFolders) {
    let workspaceFolder = vscode.workspace.workspaceFolders[0];
    let changelogFolderPath = path.join(
      workspaceFolder.uri.fsPath,
      const_ChangeLogFolder
    );
    return changelogFolderPath;
  } else {
    return undefined;
  }
}

function getUnreleasedFilePath(folderPath: string): string {
  return path.join(folderPath, unreleasedFolderName, `${Guid.newGuid()}.json`);
}

async function getChangeFromUser() {
  let change: Change = new Change();
  change.version_type = await vscode.window.showQuickPick(versionTypes);
  change.category = await vscode.window.showQuickPick(changeTypes);
  change.type = await vscode.window.showQuickPick(changeCategories);
  change.message = await vscode.window.showInputBox();
  return change;
}

function saveUnreleasedChange(folderPath: string, change: IChange) {
  let filePath = getUnreleasedFilePath(folderPath);
  let unreleasedFolder = path.dirname(filePath);

  if (!fs.existsSync(unreleasedFolder)) {
    fs.mkdirSync(unreleasedFolder, { recursive: true });
  }
  writeChange(filePath, change);
}

function saveReleaseWithChanges(
  changeLogFolderPath: fs.PathLike,
  release: IRelease,
  unreleasedChanges: IChange[]
) {
  let releaseFilePath = path.join(
    changeLogFolderPath.toString(),
    `${release.toString()}.json`
  );
  if (fs.existsSync(releaseFilePath)) {
    console.log(
      `Release ${release.toString()} file already exists, overwriting changes...`
    );
  }
  writeChanges(releaseFilePath, unreleasedChanges);
}

function writeChanges(filePath: string, changes: IChange[]) {
  var json = JSON.stringify(changes);
  fs.writeFile(filePath, json, { encoding: "utf-8", flag: "w" }, err => {
    if (err) {
      vscode.window.showErrorMessage("Failed to save, " + err.message);
    }
  });
}

function writeChange(filePath: string, change: IChange) {
  var json = JSON.stringify(change);
  fs.writeFile(filePath, json, { encoding: "utf-8", flag: "w" }, err => {
    if (err) {
      vscode.window.showErrorMessage("Failed to save, " + err.message);
    }
  });
}

// this method is called when your extension is deactivated
export function deactivate() {}
