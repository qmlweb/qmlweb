"use strict";

/* eslint-env node, es6 */
/* eslint-disable no-invalid-this */

const through = require("through");
const path = require("path");

// Reorders QmlWeb module files to satisfy their dependencies
// This way classes that depend on class A are placed after class A

const root = path.dirname(__dirname);
const prefix = "src/modules/";
const QtGlobal = "src/modules/QtQml/Qt.js";

function baseClass(file) {
  const buffer = file.contents;
  if (!buffer.includes("baseClass")) return null;

  // Specified as static class property
  const propPos = buffer.indexOf("static baseClass ");
  if (propPos >= 0) {
    const text = buffer.slice(propPos, propPos + 200).toString("utf-8");
    const match = text.match(/static baseClass\s*=\s*"([^"]+)"/);
    if (match) return match[1];
  }

  // Specified in js spec object
  const specPos = buffer.indexOf("baseClass:");
  if (specPos >= 0) {
    const text = buffer.slice(specPos, specPos + 200).toString("utf-8");
    const match = text.match(/baseClass:\s*"([^"]+)"/);
    if (match) return match[1];
  }
  throw new Error(`Could not determine baseClass for file ${file.path}`);
}

// fullName("C", "A.B") === "A.B.C"
// fullName("C.D.E", "A.B") === "C.D.E"
function fullName(relative, module) {
  if (!relative) return relative;
  if (relative.includes(".")) return relative;
  return `${module}.${relative}`;
}

// Supports specifying modules or individual classes in options.modules
// e.g. options = { modules: ["QtQuick", "QtMultimedia.Video"] }
module.exports = function(options = {}) {
  const shake = [];

  function onFile(file) {
    const relative = path.relative(root, file.path);
    if (relative.startsWith(prefix) && relative !== QtGlobal) {
      const filename = path.relative(path.join(root, prefix), file.path);
      const name = filename.replace(".js", "").split("/").join(".");
      const module = name.replace(/.[^.]+$/, ""); // "A.B.C" -> "A.B"
      try {
        const base = fullName(baseClass(file), module);
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
          this.emit("data", file);
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
