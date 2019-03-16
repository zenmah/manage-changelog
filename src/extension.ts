// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

const versionTypes = ["major", "minor", "patch"];
const changeTypes = ["new", "change", "removed", "fix"];
const changeCategories = ["NAV-Content", "AX-Content", "Application"];

interface Change {
  VersionType: string | undefined;
  Type: string | undefined;
  Category: string | undefined;
  Message: string;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "hcs-changelog" is now active!');
  let currentVersion = "0.0.0";
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "hcs-changelog.addChange",
    async () => {
      // The code you place here will be executed every time your command is executed
      let change: Change = {
        VersionType: "",
        Type: "",
        Category: "",
        Message: ""
      };
      change.VersionType = await vscode.window.showQuickPick(versionTypes);
      change.Category = await vscode.window.showQuickPick(changeTypes);
      change.Type = await vscode.window.showQuickPick(changeCategories);
      change.Message = "Some Change";

      // Display a message box to the user
      vscode.window.showInformationMessage(
        `Added "${showChange(
          change
        )}" change to the changelog for version ${currentVersion}!`
      );
      saveChangeToCurrentRelease(change);
    }
  );

  context.subscriptions.push(disposable);
}

function showChange(change: Change) {
  return `${change.VersionType}-${change.Category}-${change.Type}:${
    change.Message
  }`;
}

function saveChangeToCurrentRelease(change: Change) {}

// this method is called when your extension is deactivated
export function deactivate() {}
