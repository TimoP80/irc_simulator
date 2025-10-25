#!/usr/bin/env node
/**
 * dump-tree.mjs
 * 
 * Dumps a TypeScript + React project directory tree
 * (.ts, .tsx, .html, .css) to a text file.
 * 
 * Usage:
 *   node dump-tree.mjs ./src tree.txt
 */

import fs from "fs";
import path from "path";
import process from "process";

function dumpTree(rootDir, outFile) {
  const output = [];
  const exts = [".ts", ".tsx", ".html", ".css"];

  function walk(dir, prefix = "", isLast = true) {
    const name = path.basename(dir) || dir;
    const connector = isLast ? "└── " : "├── ";
    output.push(prefix + connector + name + "/");

    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (err) {
      output.push(prefix + "    [Error reading directory]");
      return;
    }

    const dirs = entries.filter(e => e.isDirectory());
    const files = entries.filter(
      e =>
        e.isFile() &&
        exts.includes(path.extname(e.name).toLowerCase())
    );

    dirs.sort((a, b) => a.name.localeCompare(b.name));
    files.sort((a, b) => a.name.localeCompare(b.name));

    const total = dirs.length + files.length;
    let index = 0;

    for (const d of dirs) {
      index++;
      const newPrefix = prefix + (isLast ? "    " : "│   ");
      walk(
        path.join(dir, d.name),
        newPrefix,
        index === total
      );
    }

    for (const f of files) {
      index++;
      const connector = index === total ? "└── " : "├── ";
      output.push(prefix + connector + f.name);
    }
  }

  output.push(rootDir);
  walk(rootDir, "", true);
  fs.writeFileSync(outFile, output.join("\n"), "utf8");
  console.log(`Tree written to ${outFile}`);
}

// CLI
if (process.argv.length < 4) {
  console.log("Usage: node dump-tree.mjs <rootPath> <outputFile>");
  process.exit(1);
}

const root = path.resolve(process.argv[2]);
const out = path.resolve(process.argv[3]);

if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
  console.error("Error: invalid directory:", root);
  process.exit(1);
}

dumpTree(root, out);
