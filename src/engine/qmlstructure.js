/* @license

MIT License

Copyright (c) 2011 Lauri Paimen <lauri@paimen.info>
Copyright (c) 2013 Anton Kreuzkamp <akreuzkamp@web.de>
Copyright (c) 2016 QmlWeb contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

class QMLMethod extends QmlWeb.QMLBinding {
}

/**
 * Create an object representing a QML property definition.
 * @param {String} type The type of the property
 * @param {Array} value The default value of the property
 * @return {Object} Object representing the defintion
 */
class QMLPropertyDefinition {
  constructor(type, value) {
    this.type = type;
    this.value = value;
  }
}

class QMLAliasDefinition {
  constructor(objName, propName) {
    this.objectName = objName;
    this.propertyName = propName;
  }
}

/**
 * Create an object representing a QML signal definition.
 * @param {Array} params The parameters the signal ships
 * @return {Object} Object representing the defintion
 */
class QMLSignalDefinition {
  constructor(params) {
    this.parameters = params;
  }
}

/**
 * Create an object representing a group of QML properties (like anchors).
 * @return {Object} Object representing the group
 */
class QMLMetaPropertyGroup {
}

/**
 * Create an object representing a QML element.
 * @param {String} type Type of the element
 * @param {String} onProp Name of the property specified with the "on" keyword
 */
class QMLMetaElement {
  constructor(type, onProp) {
    this.$class = type;
    this.$children = [];
    this.$on = onProp;
  }
}

// Convert parser tree to the format understood by engine
function convertToEngine(tree) {
  return convertToEngine.walk(tree);
}

function stringifyDots(elem) {
  let sub = elem;
  const path = [];
  while (sub[0] === "dot") {
    path.push(sub[1]);
    sub = sub[2];
  }
  path.push(sub);
  return path.join(".");
}

function applyProp(item, name, val) {
  let curr = item; // output structure
  let sub = name; // input structure
  while (sub[0] === "dot") {
    if (!curr[sub[1]]) {
      curr[sub[1]] = new QMLMetaPropertyGroup();
    }
    curr = curr[sub[1]];
    sub = sub[2];
  }
  curr[sub] = val;
}

convertToEngine.walkers = {
  toplevel: (imports, statement) => {
    const item = { $class: "Component" };
    item.$imports = imports;
    item.$children = [convertToEngine.walk(statement)];
    return item;
  },
  qmlelem: (elem, onProp, statements) => {
    const item = new QMLMetaElement(stringifyDots(elem), onProp);

    for (const i in statements) {
      const statement = statements[i];
      const name = statement[1];
      const val = convertToEngine.walk(statement);
      switch (statement[0]) {
        case "qmldefaultprop":
          item.$defaultProperty = name;
          item[name] = val;
          break;
        case "qmlprop":
        case "qmlpropdef":
        case "qmlaliasdef":
        case "qmlmethod":
        case "qmlsignaldef":
          applyProp(item, name, val);
          break;
        case "qmlelem":
          item.$children.push(val);
          break;
        case "qmlobjdef":
          throw new Error(
            "qmlobjdef support was removed, update qmlweb-parser to ^0.3.0."
          );
        case "qmlobj":
          // Create object to item
          item[name] = item[name] || new QMLMetaPropertyGroup();
          for (const j in val) {
            item[name][j] = val[j];
          }
          break;
        default:
          console.log("Unknown statement", statement);
      }
    }
    // Make $children be either a single item or an array, if it's more than one
    if (item.$children.length === 1) {
      item.$children = item.$children[0];
    }

    return item;
  },
  qmlprop: (name, tree, src) => {
    if (name === "id") {
      // id property
      return tree[1][1];
    }
    return convertToEngine.bindout(tree, src);
  },
  qmlobjdef: (name, property, tree, src) =>
    convertToEngine.bindout(tree, src),
  qmlobj: (elem, statements) => {
    const item = {};
    for (const i in statements) {
      const statement = statements[i];
      const name = statement[1];
      const val = convertToEngine.walk(statement);
      if (statement[0] === "qmlprop") {
        applyProp(item, name, val);
      }
    }
    return item;
  },
  qmlmethod: (name, tree, src) =>
    new QMLMethod(src),
  qmlpropdef: (name, type, tree, src) =>
    new QMLPropertyDefinition(
        type,
        tree ? convertToEngine.bindout(tree, src) : undefined
    ),
  qmlaliasdef: (name, objName, propName) =>
    new QMLAliasDefinition(objName, propName),
  qmlsignaldef: (name, params) =>
    new QMLSignalDefinition(params),
  qmldefaultprop: tree => convertToEngine.walk(tree),
  name: src => {
    if (src === "true" || src === "false") {
      return src === "true";
    } else if (typeof src === "boolean") {
      // TODO: is this needed? kept for compat with ==
      return src;
    }
    return new QmlWeb.QMLBinding(src, ["name", src]);
  },
  num: src => +src,
  string: src => String(src),
  array: (tree, src) => {
    const a = [];
    let isList = false;
    let hasBinding = false;
    for (const i in tree) {
      const val = convertToEngine.bindout(tree[i]);
      a.push(val);

      if (val instanceof QMLMetaElement) {
        isList = true;
      } else if (val instanceof QmlWeb.QMLBinding) {
        hasBinding = true;
      }
    }

    if (hasBinding) {
      if (isList) {
        throw new TypeError(
          "An array may either contain bindings or Element definitions."
        );
      }
      return new QmlWeb.QMLBinding(src, tree);
    }

    return a;
  }
};

convertToEngine.walk = function(tree) {
  const type = tree[0];
  const walker = convertToEngine.walkers[type];
  if (!walker) {
    console.log(`No walker for ${type}`);
    return undefined;
  }
  return walker.apply(type, tree.slice(1));
};

// Try to bind out tree and return static variable instead of binding
convertToEngine.bindout = function(statement, binding) {
  // We want to process the content of the statement
  // (but still handle the case, we get the content directly)
  const tree = statement[0] === "stat" ? statement[1] : statement;

  const type = tree[0];
  const walker = convertToEngine.walkers[type];
  if (walker) {
    return walker.apply(type, tree.slice(1));
  }
  return new QmlWeb.QMLBinding(binding, tree);
};

// Help logger
convertToEngine.amIn = function(str, tree) {
  console.log(str);
  if (tree) console.log(JSON.stringify(tree, null, "  "));
};

function loadParser() {
  if (typeof QmlWeb.parse !== "undefined") {
    return;
  }

  console.log("Loading parser...");
  const tags = document.getElementsByTagName("script");
  for (const i in tags) {
    if (tags[i].src && tags[i].src.indexOf("/qt.") !== -1) {
      const src = tags[i].src.replace("/qt.", "/qmlweb.parser.");
      // TODO: rewrite to async loading
      const xhr = new XMLHttpRequest();
      xhr.open("GET", src, false);
      xhr.send(null);
      if (xhr.status !== 200 && xhr.status !== 0) {
        // xhr.status === 0 if accessing with file://
        throw new Error("Could not load QmlWeb parser!");
      }
      new Function(xhr.responseText)();
      QmlWeb.parse = QmlWeb.parse;
      QmlWeb.jsparse = QmlWeb.jsparse;
      return;
    }
  }
}

// Function to parse qml and output tree expected by engine
function parseQML(src, file) {
  loadParser();
  QmlWeb.parse.nowParsingFile = file;
  const parsetree = QmlWeb.parse(src, QmlWeb.parse.QmlDocument);
  return convertToEngine(parsetree);
}

QmlWeb.QMLMethod = QMLMethod;
QmlWeb.QMLPropertyDefinition = QMLPropertyDefinition;
QmlWeb.QMLAliasDefinition = QMLAliasDefinition;
QmlWeb.QMLSignalDefinition = QMLSignalDefinition;
QmlWeb.QMLMetaPropertyGroup = QMLMetaPropertyGroup;
QmlWeb.QMLMetaElement = QMLMetaElement;
QmlWeb.convertToEngine = convertToEngine;
QmlWeb.loadParser = loadParser;
QmlWeb.parseQML = parseQML;
