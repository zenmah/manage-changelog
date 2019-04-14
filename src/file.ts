import * as fs from "fs";
import * as path from "path";

function getFileNamesFromFolderSync(folderPath: string): string[] {
    if (fs.existsSync(folderPath)) {
        return fs.readdirSync(folderPath);
    }
    return [];
}

async function readJson<T>(
    unreleasedFolderPath: string,
    fileName: string
): Promise<T | undefined> {
    let filePath = path.join(unreleasedFolderPath, fileName);
    try {
        let fileContent = await readFile(filePath);
        return JSON.parse(fileContent) as T;
    } catch (err) {
        console.log(`failed to parse {filePath}, ${err}`);
        throw err;
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

function writeJsonSync<T>(filePath: string, object: object) {
    var json = JSON.stringify(object);
    fs.writeFile(filePath, json, { encoding: "utf-8", flag: "w" }, err => {
        if (err) {
            throw err;
        }
    });
}

function mkDirSync(folderPath: string) {
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }
}

async function deleteFromDir(folderPath: string): Promise<void> {
    return new Promise(resolve => {
        if (folderPath && fs.existsSync(folderPath)) {
            fs.readdir(folderPath, (err, files) => {
                if (err) {
                    throw err;
                }

                for (const file of files) {
                    fs.unlink(path.join(folderPath, file), err => {
                        if (err) {
                            throw err;
                        }
                    });
                }
            });
        }
    });
}

export {
    writeJsonSync,
    mkDirSync,
    getFileNamesFromFolderSync,
    readJson,
    deleteFromDir
};
