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
  const type = tree[0];
  const walker = convertToEngine.walkers[type];
  if (!walker) {
    console.log(`No walker for ${type}`);
    return undefined;
  }
  return walker(...tree.slice(1));
}

convertToEngine.stringifyDots = function(elem) {
  let sub = elem;
  const path = [];
  while (sub[0] === "dot") {
    path.push(sub[1]);
    sub = sub[2];
  }
  path.push(sub);
  return path.join(".");
};

convertToEngine.applyProp = function(item, name, val) {
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
};

convertToEngine.walkers = {
  toplevel: (imports, statement) => {
    const item = { $class: "Component" };
    item.$imports = imports;
    item.$children = [convertToEngine(statement)];
    return item;
  },
  qmlelem: (elem, onProp, statements) => {
    const item = new QMLMetaElement(
      convertToEngine.stringifyDots(elem),
      onProp
    );

    for (const i in statements) {
      const statement = statements[i];
      const name = statement[1];
      const val = convertToEngine(statement);
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
          convertToEngine.applyProp(item, name, val);
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
      const val = convertToEngine(statement);
      if (statement[0] === "qmlprop") {
        convertToEngine.applyProp(item, name, val);
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
  qmldefaultprop: tree => convertToEngine(tree),
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

// Try to bind out tree and return static variable instead of binding
convertToEngine.bindout = function(statement, binding) {
  // We want to process the content of the statement
  // (but still handle the case, we get the content directly)
  const tree = statement[0] === "stat" ? statement[1] : statement;

  const type = tree[0];
  const walker = convertToEngine.walkers[type];
  if (walker) {
    return walker(...tree.slice(1));
  }
  return new QmlWeb.QMLBinding(binding, tree);
};

function loadParser() {
  if (typeof QmlWeb.parse !== "undefined") {
    return;
  }

  console.log("Loading parser...");
  const tags = document.getElementsByTagName("script");
  for (const i in tags) {
    if (tags[i].src && tags[i].src.match(/\/(qt|qmlweb)\./)) {
      const src = tags[i].src.replace(
        /\/(qt|qmlweb)\.(es201.\.)?/,
        "/qmlweb.parser."
      );
      // TODO: rewrite to async loading
      const xhr = new XMLHttpRequest();
      xhr.open("GET", src, false);
      xhr.send(null);
      if (xhr.status !== 200 && xhr.status !== 0) {
        // xhr.status === 0 if accessing with file://
        throw new Error("Could not load QmlWeb parser!");
      }
      new Function(xhr.responseText)();
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
