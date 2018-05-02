"use strict";

/* eslint-env node, es6 */
/* eslint-disable no-invalid-this */

const through = require("through");
const path = require("path");

// Reorders QmlWeb module files to satisfy their dependencies
// This way classes that depend on class A are placed after class A

const root = path.dirname(__dirname);
const prefix = "src/modules/";
const QtGlobal = path.normalize("QtQml/Qt.js");

function baseClass(file) {
  const buffer = file.contents;

  // Specified as real class inheritance
  const extendsPos = buffer.indexOf(" extends ");
  if (extendsPos >= 0) {
    const text = buffer.slice(extendsPos, extendsPos + 200).toString("utf-8");
    const match = text.match(/ extends\s+([A-Za-z0-9]+_[A-Za-z0-9_]+)\s+{/);
    if (match) return match[1].replace(/_/g, ".");
  }

  return null;
}

// Preprocesses file
// Automatically adds `QmlWeb.registerQmlType` to classes
function process(file, name) {
  if (!file.contents.includes("QmlWeb.registerQmlType(")) {
    const className = name.replace(/\./g, "_");
    file.contents = Buffer.concat([
      file.contents,
      Buffer.from(`QmlWeb.registerQmlType(${className});\n`)
    ]);
  }
  return file;
}

// Supports specifying modules or individual classes in options.modules
// e.g. options = { modules: ["QtQuick", "QtMultimedia.Video"] }
module.exports = function(options = {}) {
  const shake = [];

  function onFile(file) {
    const filename = path.relative(path.join(root, prefix), file.path);
    if (!filename.includes("..") && filename !== QtGlobal) {
      // Process all files inside the `prefix`, except for the Qt.js file
      const name = filename.replace(".js", "").split(/[\\/]/).join(".");
      const module = name.replace(/.[^.]+$/, ""); // "A.B.C" -> "A.B"
      try {
        const base = baseClass(file);
        shake.push({ file, name, module, base });
      } catch (e) {
        this.emit("error", e);
      }
    } else {
      this.emit("data", file);
    }
  }

  function onEnd() {
    const wanted = new Set();
    const modules = options.modules;
    for (const { name, module } of shake) {
      if (!modules || modules.includes(name) || modules.includes(module)) {
        wanted.add(name);
      }
    }

    const ready = new Set();
    while (wanted.size > 0) {
      let ok = false;
      for (const { file, name, base } of shake) {
        if (ready.has(name) || !wanted.has(name)) continue;
        if (!base || ready.has(base)) {
          ok = true;
          this.emit("data", process(file, name));
          ready.add(name);
          wanted.delete(name);
          break;
        }
        if (!wanted.has(base)) {
          wanted.add(base);
          ok = true;
        }
      }
      if (!ok) {
        const name = [...wanted][0];
        const base = shake.filter(row => row.name === name)[0].base;
        throw new Error(`Broken dependency tree: ${name} depends on ${base}`);
      }
    }
    return this.emit("end");
  }

  return through(onFile, onEnd);
};
