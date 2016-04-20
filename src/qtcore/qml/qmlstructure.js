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

QMLMethod.prototype = new QMLBinding();
function QMLMethod(src) {
    this.src = src;
}

/**
 * Create an object representing a QML property definition.
 * @param {String} type The type of the property
 * @param {Array} value The default value of the property
 * @return {Object} Object representing the defintion
 */
function QMLPropertyDefinition(type, value) {
    this.type = type;
    this.value = value;
}

function QMLAliasDefinition(objName, propName) {
    this.objectName = objName;
    this.propertyName = propName;
}

/**
 * Create an object representing a QML signal definition.
 * @param {Array} params The parameters the signal ships
 * @return {Object} Object representing the defintion
 */
function QMLSignalDefinition(params) {
    this.parameters = params;
}

/**
 * Create an object representing a group of QML properties (like anchors).
 * @return {Object} Object representing the group
 */
function QMLMetaPropertyGroup() {}

/**
 * Create an object representing a QML element.
 * @param {String} type The type of the element
 * @param {String} onProp The name of the property specified with the "on" keyword
 */
function QMLMetaElement(type, onProp) {
    this.$class = type;
    this.$children = [];
    this.$on = onProp;
}

// Convert parser tree to the format understood by engine
function convertToEngine(tree) {

    // Help logger
    function amIn(str, tree) {
        console.log(str);
        if (tree) console.log(JSON.stringify(tree, null, "  "));
    }

    var walkers = {
        "toplevel": function(imports, statement) {
            var item = { $class: "Component" };
            item.$imports = imports;
            item.$children = [ walk(statement) ];
            return item;
        },
        "qmlelem": function(elem, onProp, statements) {
            var item = new QMLMetaElement(elem, onProp);

            for (var i in statements) {
                var statement = statements[i],
                    name = statement[1],
                    val = walk(statement);
                switch (statement[0]) {
                    case "qmldefaultprop":
                        item.$defaultProperty = name;
                    case "qmlprop":
                    case "qmlpropdef":
                    case "qmlaliasdef":
                    case "qmlmethod":
                    case "qmlsignaldef":
                        item[name] = val;
                        break;
                    case "qmlelem":
                        item.$children.push(val);
                        break;
                    case "qmlobjdef":
                        // Create object to item
                        item[name] = item[name] || new QMLMetaPropertyGroup();
                        item[name][statement[2]] = val;
                        break;
                    case "qmlobj":
                        // Create object to item
                        item[name] = item[name] || new QMLMetaPropertyGroup();
                        for (var i in val)
                            item[name][i] = val[i];
                        break;
                    default:
                        console.log("Unknown statement", statement);

                }
            }
            // Make $children be either a single item or an array, if it's more than one
            if (item.$children.length === 1)
                item.$children = item.$children[0];

            return item;
        },
        "qmlprop": function(name, tree, src) {
            if (name == "id") {
                // id property
                return tree[1][1];
            }
            return bindout(tree, src);
        },
        "qmlobjdef": function(name, property, tree, src) {
            return bindout(tree, src);
        },
        "qmlobj": function(elem, statements) {
            var item = {};

            for (var i in statements) {
                var statement = statements[i],
                    name = statement[1],
                    val = walk(statement);
                if (statement[0] == "qmlprop")
                    item[name] = val;
            }

            return item;
        },
        "qmlmethod": function(name, tree, src) {
            return new QMLMethod(src);
        },
        "qmlpropdef": function(name, type, tree, src) {
            return new QMLPropertyDefinition(type, tree ? bindout(tree, src) : undefined);
        },
        "qmlaliasdef": function(name, objName, propName) {
            return new QMLAliasDefinition(objName, propName);
        },
        "qmlsignaldef": function(name, params) {
            return new QMLSignalDefinition(params);
        },
        "qmldefaultprop": function(tree) {
            return walk(tree);
        },
        "name": function(src) {
            if (src == "true" || src == "false")
                return src == "true";
            return new QMLBinding(src, ["name", src]);
        },
        "num": function(src) {
            return +src;
        },
        "string": function(src) {
            return String(src);
        },
        "array": function(tree, src) {
            var a = [];
            var isList = false;
            var hasBinding = false;
            for (var i in tree) {
                var val = bindout(tree[i]);
                a.push(val);

                if (val instanceof QMLMetaElement)
                    isList = true;
                else if (val instanceof QMLBinding)
                    hasBinding = true;
            }

            if (hasBinding) {
                if (isList)
                    throw new TypeError("An array may either contain bindings or Element definitions.");
                return new QMLBinding(src, tree);
            }

            return a;
        }
    };

    function walk(tree) {
        var type = tree[0];
        var walker = walkers[type];
        if (!walker) {
            console.log("No walker for " + type);
            return;
        } else {
            return walker.apply(type, tree.slice(1));
        }
    }

    return walk(tree);

    // Try to bind out tree and return static variable instead of binding
    function bindout(tree, binding) {
        if (tree[0] === "stat") // We want to process the content of the statement
            tree = tree[1];     // (but still handle the case, we get the content directly)
        var type = tree[0];
        var walker = walkers[type];
        if (walker) {
            return walker.apply(type, tree.slice(1));
        } else {
            return new QMLBinding(binding, tree);
        }
    }

}

// Function to parse qml and output tree expected by engine
function parseQML(src, file) {
    loadParser();
    qmlweb_parse.nowParsingFile = file;
    var parsetree = qmlweb_parse(src, qmlweb_parse.QmlDocument);
    return convertToEngine(parsetree);
}

function loadParser() {
  if (typeof qmlweb_parse !== 'undefined')
    return;

  console.log('Loading parser...');
  var tags = document.getElementsByTagName('script');
  for (let i in tags) {
    if (tags[i].src && tags[i].src.indexOf('/qt.') !== -1) {
      let src = tags[i].src.replace('/qt.', '/qmlweb.parser.');
      // TODO: rewrite to async loading
      let xhr = new XMLHttpRequest();
      xhr.open('GET', src, false);
      xhr.send(null);
      if (xhr.status !== 200 && xhr.status !== 0) { // 0 if accessing with file://
          throw new Error('Could not load QmlWeb parser!');
      }
      (new Function(xhr.responseText))();
      return;
    }
  }
}
