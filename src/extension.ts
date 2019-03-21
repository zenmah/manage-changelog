import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { Change, IChange } from "./Change";
import { Release, IRelease } from "./Release";
import { Guid } from "./Utils/Guid";
import { asyncForEach } from "./Utils/asyncFunctions";

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
        let unreleasedChanges = await getUnreleasedChanges(changelogFolderPath);
        saveReleaseWithChanges(changelogFolderPath, release, unreleasedChanges);
        //clearUnreleasedChanges(changelogFolderPath);
      }
    }
  );

  context.subscriptions.push(addChange);

  context.subscriptions.push(createRelease);
}

async function getUnreleasedChanges(folderPath: string): Promise<IChange[]> {
  let unreleasedFolderPath = getUnreleasedFolderPath(folderPath);
  let changes: IChange[] = [];
  if (fs.existsSync(unreleasedFolderPath)) {
    let files = fs.readdirSync(unreleasedFolderPath);
    await asyncForEach(files, async (fileName: any) => {
      let change = await ReadUnreleasedChangeFile(
        unreleasedFolderPath,
        fileName
      );
      if (change) {
        changes.push(change);
      }
    });
    // probably pass changes in callback?
    console.log(changes);
  }
  return changes;
}

async function ReadUnreleasedChangeFile(
  unreleasedFolderPath: string,
  fileName: string
): Promise<IChange | undefined> {
  let filePath = path.join(unreleasedFolderPath, fileName);
  try {
    let fileContent = await readFile(filePath);
    return JSON.parse(fileContent) as IChange;
  } catch (err) {
    console.log(`failed to parse {filePath}, ${err}`);
  }
}
function readFile(filePath: string): Promise<string> {
  return new Promise<string>(resolve => {
    let data = "";
    let readStream = fs.createReadStream(filePath);
    readStream.on("data", function(chunk) {
      data += chunk;
    });
    readStream.on("end", function() {
      resolve(data);
    });
  });
}

function clearUnreleasedChanges(folderPath: string): void {
  let path = getUnreleasedFolderPath(folderPath);
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

function getUnreleasedFolderPath(folderPath: string): string {
  return path.join(folderPath, unreleasedFolderName);
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
