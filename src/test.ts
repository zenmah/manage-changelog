import * as fs from "fs";
import { rejects } from "assert";

function doubleAfter2Seconds(x: any) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(x * 2);
    }, 2000);
  });
}

async function addAsync(x: any) {
  const a = await doubleAfter2Seconds(10);
  const b = await doubleAfter2Seconds(20);
  const c = await doubleAfter2Seconds(30);
  return x + a + b + c;
}

function readFile(filePath: string) {
  return new Promise(resolve => {
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
