import * as vscode from "vscode";
import * as path from "path";

import { Change, IChange } from "./Change";
import { Release, IRelease } from "./Release";
import { Guid } from "./Utils/Guid";
import { asyncForEach } from "./Utils/asyncFunctions";
import {
    writeJsonSync,
    getFileNamesFromFolderSync,
    readJson,
    mkDirSync,
    deleteFromDir
} from "./file";
import { release } from "os";

const versionTypes = ["major", "minor", "patch"];
const changeTypes = ["new", "change", "removed", "fix"];
const changeCategories = ["NAV-Content", "AX-Content", "Application"];

const CHANGELOG_FOLDERNAME = ".changelog";
const UNRELEASED_FOLDERNAME = "unreleased";
const RELEASE_JSON_REGEX = "[0-9]+.[0-9]+..*.json";

export function activate(context: vscode.ExtensionContext) {
    let addChange = vscode.commands.registerCommand(
        "manage-changelog.addChange",
        async () => {
            if (!vscode.workspace.workspaceFolders) {
                vscode.window.showErrorMessage(
                    "Not in a workspace, please open a workspace first."
                );
                return;
            }
            let change: Change = await getChangeFromUser();
            if (change.isValid()) {
                saveNewChange(change);
            }
        }
    );
    let createRelease = vscode.commands.registerCommand(
        "manage-changelog.createRelease",
        async () => {
            if (!vscode.workspace.workspaceFolders) {
                vscode.window.showErrorMessage(
                    "Not in a workspace, please open a workspace first."
                );
                return;
            }
            let release = await getNewRelease();
            if (release) {
                let unreleasedChanges = await getUnreleasedChanges();
                saveNewRelease(release, unreleasedChanges);
                clearUnreleasedChanges();
            }
        }
    );

    context.subscriptions.push(addChange);

    context.subscriptions.push(createRelease);
}

async function getChangeFromUser() {
    let change: Change = new Change();
    change.version_type = await vscode.window.showQuickPick(versionTypes);
    change.category = await vscode.window.showQuickPick(changeTypes);
    change.type = await vscode.window.showQuickPick(changeCategories);
    change.message = await vscode.window.showInputBox();
    return change;
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

function tryGetUnreleasedFilePath(): {
    success: boolean;
    path: string;
} {
    let folderPath = getChangeLogFolderPath();
    if (!folderPath.success) {
        return folderPath;
    }
    return {
        success: folderPath.success,
        path: path.join(
            folderPath.path,
            UNRELEASED_FOLDERNAME,
            `${Guid.newGuid()}.json`
        )
    };
}
function tryGetReleasedFilePath(
    release: IRelease
): {
    success: boolean;
    path: string;
} {
    let folderPath = getChangeLogFolderPath();
    if (!folderPath.success) {
        return folderPath;
    }
    return {
        success: folderPath.success,
        path: path.join(folderPath.path, `${release}.json`)
    };
}

function getUnreleasedFolderPath(): {
    success: boolean;
    path: string;
} {
    let folderPath = getChangeLogFolderPath();
    if (!folderPath.success) {
        return folderPath;
    }

    return {
        success: folderPath.success,
        path: path.join(folderPath.path, UNRELEASED_FOLDERNAME)
    };
}

function getChangeLogFolderPath(): {
    success: boolean;
    path: string;
} {
    if (vscode.workspace.workspaceFolders) {
        let workspaceFolder = vscode.workspace.workspaceFolders[0];
        let changelogFolderPath = path.join(
            workspaceFolder.uri.fsPath,
            CHANGELOG_FOLDERNAME
        );
        return { success: true, path: changelogFolderPath };
    }
    return { success: false, path: "" };
}

async function getUnreleasedChanges(): Promise<IChange[]> {
    let unreleasedFolderPath = getUnreleasedFolderPath();
    if (!unreleasedFolderPath.success) {
        return [];
    }
    let changes: IChange[] = [];
    let files = getFileNamesFromFolderSync(unreleasedFolderPath.path);

    await asyncForEach(files, async (fileName: any) => {
        let change = await readJson<IChange>(
            unreleasedFolderPath.path,
            fileName
        );
        if (change) {
            changes.push(change);
        }
    });
    return changes;
}

function getCurrentRelease(): IRelease {
    let unreleasedFolderPath = getUnreleasedFolderPath();
    if (!unreleasedFolderPath.success) {
        return new Release();
    }
    let releaseFileNames = getFileNamesFromFolderSync(
        unreleasedFolderPath.path
    );

    let releases: IRelease[] = releaseFileNames.map<IRelease>(
        mapStringToRelease
    );
    if (releases && releases.length >= 1) {
        releases.sort((a, b) => {
            return a.toString().localeCompare(b.toString());
        });

        return releases[0];
    }
    return new Release();
}

function mapStringToRelease(value: any) {
    let release: IRelease = new Release();
    if (value.match(RELEASE_JSON_REGEX)) {
        let split = value.split(RELEASE_JSON_REGEX);
        if (split.length === 4) {
            release.setRelease(+split[0], +split[1], split[2]);
        }
    }
    return release;
}

function clearUnreleasedChanges(): void {
    let folderPath = getUnreleasedFolderPath();
    if (!folderPath.success) {
        deleteFromDir(folderPath.path);
    }
}

function saveNewChange(change: IChange) {
    let filePath = tryGetUnreleasedFilePath();
    if (!filePath.success) {
        return;
    }
    let unreleasedFolder = path.dirname(filePath.path);

    try {
        mkDirSync(unreleasedFolder);
        writeJsonSync(filePath.path, change);
    } catch (err) {
        vscode.window.showErrorMessage(
            `Failed to save change to ${filePath}, ` + err.message
        );
    }
}

function saveNewRelease(release: IRelease, unreleasedChanges: IChange[]) {
    let releaseFilePath = tryGetReleasedFilePath(release);
    if (!releaseFilePath.success) {
        return;
    }
    try {
        writeJsonSync(releaseFilePath.path, unreleasedChanges);
    } catch (err) {
        vscode.window.showErrorMessage("Failed to save, " + err.message);
    }
}

// this method is called when your extension is deactivated
export function deactivate() {}
// exports for tests
//export { mapStringToRelease };
