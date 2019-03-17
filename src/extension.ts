import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as mkdirp from "mkdirp";
import { Change, IChange } from "./Change";

const versionTypes = ["major", "minor", "patch"];
const changeTypes = ["new", "change", "removed", "fix"];
const changeCategories = ["NAV-Content", "AX-Content", "Application"];

const const_ChangeLogFolder = ".changelog";

let currentVersion = "0.0.0";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "hcs-changelog" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "hcs-changelog.addChange",
    async () => {
      if (vscode.workspace.workspaceFolders) {
        let workspaceFolder = vscode.workspace.workspaceFolders[0];

        let changelogFolderPath = path.join(
          workspaceFolder.uri.fsPath,
          const_ChangeLogFolder
        );
        let change: Change = await getChangeFromUser();
        if (change.isValid()) {
          saveChangeToCurrentRelease(changelogFolderPath, change);
        }
      } else {
        vscode.window.showErrorMessage(
          "Not in a workspace, please open a workspace first."
        );
      }
    }
  );
  context.subscriptions.push(disposable);
}

async function getChangeFromUser() {
  let change: Change = new Change();
  change.version_type = await vscode.window.showQuickPick(versionTypes);
  change.category = await vscode.window.showQuickPick(changeTypes);
  change.type = await vscode.window.showQuickPick(changeCategories);
  change.message = await vscode.window.showInputBox();
  return change;
}

function saveChangeToCurrentRelease(folderPath: string, change: IChange) {
  //vscode.workspace
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  let filePath = path.join(folderPath, `${currentVersion}.json`);

  fs.createWriteStream(filePath);

  fs.exists(filePath, function(exists) {
    let changes: IChange[] = [];
    if (exists) {
      fs.readFile(filePath, function readFileCallback(err, data) {
        if (err) {
          console.log(err);
        } else {
          try {
            changes = JSON.parse(data.toString());
          } catch {
            vscode.window.showErrorMessage(
              `Changelog ${filePath} contains invalid JSON format, discarding previous entries`
            );
          }
          changes.push(change);
          writeChanges(filePath, changes);
        }
      });
    } else {
      changes.push(change);
      writeChanges(filePath, changes);
    }
  });
}

function writeChanges(filePath: string, changes: IChange[]) {
  var json = JSON.stringify(changes);
  fs.writeFile(filePath, json, { encoding: "utf-8", flag: "w" }, err => {
    if (err) {
      vscode.window.showErrorMessage("Failed to save, " + err.message);
    }
  });
}

// this method is called when your extension is deactivated
export function deactivate() {}
