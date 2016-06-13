;(function(global) {
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

/**
 * Create QML binding.
 * @param {Variant} val Sourcecode or function representing the binding
 * @param {Array} tree Parser tree of the binding
 * @return {Object} Object representing the binding
 */
global.QMLBinding = function (val, tree) {
    // this.isFunction states whether the binding is a simple js statement or a function containing
    // a return statement. We decide this on whether it is a code block or not. If it is, we require
    // a return statement. If it is a code block it could though also be a object definition, so we
    // need to check that as well (it is, if the content is labels).
    // need to check that as well (it is, if the content is labels).
    this.isFunction = tree && tree[0] == "block" && tree[1][0] && tree[1][0][0] !== "label";
    this.src = val;
};

global.QMLBinding.prototype.toJSON = function () {
    return { src: this.src,
        deps: JSON.stringify(this.deps),
        tree: JSON.stringify(this.tree) };
};

/**
 * Compile binding. Afterwards you may call binding.eval to evaluate.
 */
QMLBinding.prototype.compile = function () {
    this.eval = new Function('__executionObject', '__executionContext', "_executionContext = __executionContext; with(__executionContext) with(__executionObject) " + (this.isFunction ? "" : "return ") + this.src);
};

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
        "toplevel": function toplevel(imports, statement) {
            var item = { $class: "Component" };
            item.$imports = imports;
            item.$children = [walk(statement)];
            return item;
        },
        "qmlelem": function qmlelem(elem, onProp, statements) {
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
                        for (var i in val) {
                            item[name][i] = val[i];
                        }break;
                    default:
                        console.log("Unknown statement", statement);

                }
            }
            // Make $children be either a single item or an array, if it's more than one
            if (item.$children.length === 1) item.$children = item.$children[0];

            return item;
        },
        "qmlprop": function qmlprop(name, tree, src) {
            if (name == "id") {
                // id property
                return tree[1][1];
            }
            return bindout(tree, src);
        },
        "qmlobjdef": function qmlobjdef(name, property, tree, src) {
            return bindout(tree, src);
        },
        "qmlobj": function qmlobj(elem, statements) {
            var item = {};

            for (var i in statements) {
                var statement = statements[i],
                    name = statement[1],
                    val = walk(statement);
                if (statement[0] == "qmlprop") item[name] = val;
            }

            return item;
        },
        "qmlmethod": function qmlmethod(name, tree, src) {
            return new QMLMethod(src);
        },
        "qmlpropdef": function qmlpropdef(name, type, tree, src) {
            return new QMLPropertyDefinition(type, tree ? bindout(tree, src) : undefined);
        },
        "qmlaliasdef": function qmlaliasdef(name, objName, propName) {
            return new QMLAliasDefinition(objName, propName);
        },
        "qmlsignaldef": function qmlsignaldef(name, params) {
            return new QMLSignalDefinition(params);
        },
        "qmldefaultprop": function qmldefaultprop(tree) {
            return walk(tree);
        },
        "name": function name(src) {
            if (src == "true" || src == "false") return src == "true";
            return new QMLBinding(src, ["name", src]);
        },
        "num": function num(src) {
            return +src;
        },
        "string": function string(src) {
            return String(src);
        },
        "array": function array(tree, src) {
            var a = [];
            var isList = false;
            var hasBinding = false;
            for (var i in tree) {
                var val = bindout(tree[i]);
                a.push(val);

                if (val instanceof QMLMetaElement) isList = true;else if (val instanceof QMLBinding) hasBinding = true;
            }

            if (hasBinding) {
                if (isList) throw new TypeError("An array may either contain bindings or Element definitions.");
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
            tree = tree[1]; // (but still handle the case, we get the content directly)
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
    if (typeof qmlweb_parse !== 'undefined') return;

    console.log('Loading parser...');
    var tags = document.getElementsByTagName('script');
    for (var i in tags) {
        if (tags[i].src && tags[i].src.indexOf('/qt.') !== -1) {
            var src = tags[i].src.replace('/qt.', '/qmlweb.parser.');
            // TODO: rewrite to async loading
            var xhr = new XMLHttpRequest();
            xhr.open('GET', src, false);
            xhr.send(null);
            if (xhr.status !== 200 && xhr.status !== 0) {
                // 0 if accessing with file://
                throw new Error('Could not load QmlWeb parser!');
            }
            new Function(xhr.responseText)();
            return;
        }
    }
}

/* @license

MIT License

Copyright (c) 2011 Lauri Paimen <lauri@paimen.info>
Copyright (c) 2015 Pavel Vasev <pavel.vasev@gmail.com> - initial and working
                                                         import implementation.
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

/*
 * Misc classes for importing files.
 *
 * Currently the file contains a lot of unused code for future
 * purposes. Most of it can be rewritten as there is now Javascript parser
 * available.
 *
 * Exports:
 *
 * - getUrlContents(url) -- get URL contents. Returns contents or false in
 *   error.
 *
 * - Some other stuff not currently used/needed.
 *
 *
 */
(function () {

    /**
     * Get URL contents. EXPORTED.
     * @param url {String} Url to fetch.
     * @param skipExceptions {bool} when turned on, ignore exeptions and return false. This feature is used by readQmlDir.
     * @private
     * @return {mixed} String of contents or false in errors.
     *
     * Q1: can someone provide use-case when we need caching here?
     * A1:
     * Q2: should errors be cached? (now they aren't)
     * A2:
     
     * Q3: split getUrlContents into: getUrlContents, getUrlContentsWithCaching, getUrlContentsWithoutErrors..
     */
    getUrlContents = function getUrlContents(url, skipExceptions) {
        if (typeof urlContentCache[url] == 'undefined') {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, false);

            if (skipExceptions) {
                try {
                    xhr.send(null);
                } catch (e) {
                    return false;
                }
            } /* it is OK to not have logging here, because DeveloperTools already will have red log record */
            else xhr.send(null);

            if (xhr.status != 200 && xhr.status != 0) {
                // 0 if accessing with file://
                console.log("Retrieving " + url + " failed: " + xhr.responseText, xhr);
                return false;
            }
            urlContentCache[url] = xhr.responseText;
        }
        return urlContentCache[url];
    };
    if (typeof global.urlContentCache == 'undefined') global.urlContentCache = {};

    /**
     * Read qmldir spec file at directory. EXPORTED.
     * @param url Url of the directory
     * @return {Object} Object, where .internals lists qmldir internal references
     *                          and .externals lists qmldir external references.
     */

    /*  Note on how importing works.
    
       * parseQML gives us `tree.$imports` variable, which contains information from `import` statements.
    
       * After each call to parseQML, we call engine.loadImports(tree.$imports).
         It in turn invokes readQmlDir() calls for each import, with respect to current component base path and engine.importPathList().
    
       * We keep all component names from all qmldir files in global variable `engine.qmldir`.
       
       * In construct() function, we use `engine.qmldir` for component url lookup.
    
       Reference import info: http://doc.qt.io/qt-5/qtqml-syntax-imports.html 
       Also please look at notes and TODO's in qtcore.js::loadImports() and qtcore.js::construct() methods.
    */

    readQmlDir = function readQmlDir(url) {
        // in case 'url' is empty, do not attach "/"
        // Q1: when this happen?
        var qmldirFileUrl = url.length > 0 ? url + "/qmldir" : "qmldir";

        if (!qrc.includesFile(qmldirFileUrl)) qrc[qmldirFileUrl] = getUrlContents(qmldirFileUrl, true); // loading url contents with skipping errors
        var qmldir = qrc[qmldirFileUrl],
            lines,
            line,
            internals = {},
            externals = {},
            match,
            i;

        if (qmldir === false) {
            return false;
        }

        // we have to check for "://"
        // In that case, item path is meant to be absolute, and we have no need to prefix it with base url
        function makeurl(path) {
            if (path.indexOf("://") > 0) return path;
            return url + "/" + path;
        }

        lines = qmldir.split(/\r?\n/);
        for (i = 0; i < lines.length; i++) {
            // trim
            line = lines[i].replace(/^\s+|\s+$/g, "");
            if (!line.length || line[0] == "#") {
                // Empty line or comment
                continue;
            }
            match = line.split(/\s+/);
            if (match.length == 2 || match.length == 3) {
                if (match[0] == "plugin") {
                    console.log(url + ": qmldir plugins are not supported!");
                } else if (match[0] == "internal") {
                    internals[match[1]] = { url: makeurl(match[2]) };
                } else {
                    if (match.length == 2) {
                        externals[match[0]] = { url: makeurl(match[1]) };
                    } else {
                        externals[match[0]] = { url: makeurl(match[2]), version: match[1] };
                    }
                }
            } else {
                console.log(url + ": unmatched: " + line);
            }
        }
        return { internals: internals, externals: externals };
    };
})();

global.Easing = {
    Linear: 1,
    InQuad: 2, OutQuad: 3, InOutQuad: 4, OutInQuad: 5,
    InCubic: 6, OutCubic: 7, InOutCubic: 8, OutInCubic: 9,
    InQuart: 10, OutQuart: 11, InOutQuart: 12, OutInQuart: 13,
    InQuint: 14, OutQuint: 15, InOutQuint: 16, OutInQuint: 17,
    InSine: 18, OutSine: 19, InOutSine: 20, OutInSine: 21,
    InExpo: 22, OutExpo: 23, InOutExpo: 24, OutInExpo: 25,
    InCirc: 26, OutCirc: 27, InOutCirc: 28, OutInCirc: 29,
    InElastic: 30, OutElastic: 31, InOutElastic: 32, OutInElastic: 33,
    InBack: 34, OutBack: 35, InOutBack: 36, OutInBack: 37,
    InBounce: 38, OutBounce: 39, InOutBounce: 40, OutInBounce: 41
};

global.Font = {
    // Capitalization
    MixedCase: "none",
    AllUppercase: "uppercase",
    AllLowercase: "lowercase",
    SmallCaps: "smallcaps",
    Capitalize: "capitalize",
    // Weight
    Light: "lighter",
    Normal: "normal",
    DemiBold: "600",
    Bold: "bold",
    Black: "bolder"
};

global.qrc = {
    includesFile: function includesFile(path) {
        return typeof qrc[path] != 'undefined';
    }
};

global.Qt = {
    rgba: function rgba(r, g, b, a) {
        return "rgba(" + Math.round(r * 255) + "," + Math.round(g * 255) + "," + Math.round(b * 255) + "," + a + ")";
    },
    hsla: function hsla(h, s, l, a) {
        return "hsla(" + Math.round(h * 360) + "," + Math.round(s * 100) + "%," + Math.round(l * 100) + "%," + a + ")";
    },
    openUrlExternally: function openUrlExternally(url) {
        page = window.open(url, '_blank');
        page.focus();
    },
    // Load file, parse and construct as Component (.qml)
    createComponent: function createComponent(name) {
        if (name in engine.components) return engine.components[name];

        var nameIsUrl = name.indexOf("//") >= 0 || name.indexOf(":/") >= 0; // e.g. // in protocol, or :/ in disk urls (D:/)

        // Do not perform path lookups if name starts with @ sign.
        // This is used when we load components from qmldir files
        // because in that case we do not need any lookups.
        var origName = name;
        if (name.length > 0 && name[0] == "@") {
            nameIsUrl = true;
            name = name.substr(1, name.length - 1);
        }

        var file = nameIsUrl ? name : engine.$basePath + name;

        var src = getUrlContents(file, true);
        // if failed to load, and provided name is not direct url, try to load from dirs in importPathList()
        if (src == false && !nameIsUrl) {
            var moredirs = engine.importPathList();

            for (var i = 0; i < moredirs.length; i++) {
                file = moredirs[i] + name;
                src = getUrlContents(file, true);
                if (src !== false) break;
            }
        }

        // When createComponent failed to load content from all probable sources, it should return undefined.
        if (src === false) return undefined;

        var tree = parseQML(src, file);

        if (tree.$children.length !== 1) console.error("A QML component must only contain one root element!");

        var component = new QMLComponent({ object: tree, context: _executionContext });
        component.$basePath = engine.extractBasePath(file);
        component.$imports = tree.$imports;
        component.$file = file; // just for debugging

        engine.loadImports(tree.$imports, component.$basePath);

        engine.components[origName] = component;
        return component;
    },

    createQmlObject: function createQmlObject(src, parent, file) {
        var tree = parseQML(src, file);

        // Create and initialize objects

        var component = new QMLComponent({ object: tree, parent: parent, context: _executionContext });

        engine.loadImports(tree.$imports);

        if (!file) file = Qt.resolvedUrl("createQmlObject_function");
        component.$basePath = engine.extractBasePath(file);
        component.$imports = tree.$imports; // for later use
        component.$file = file; // not just for debugging, but for basepath too, see above

        var obj = component.createObject(parent);
        obj.parent = parent;
        parent.childrenChanged();

        if (engine.operationState !== QMLOperationState.Init && engine.operationState !== QMLOperationState.Idle) {
            // We don't call those on first creation, as they will be called
            // by the regular creation-procedures at the right time.
            engine.$initializePropertyBindings();

            engine.callCompletedSignals();
        }

        return obj;
    },

    // Returns url resolved relative to the URL of the caller.
    // http://doc.qt.io/qt-5/qml-qtqml-qt.html#resolvedUrl-method
    resolvedUrl: function resolvedUrl(url) {
        if (!url || !url.substr) // url is not a string object
            return url;

        // Must check for cases: D:/, file://, http://, or slash at the beginning.
        // This means the url is absolute => we have to skip processing (except removing dot segments).
        if (url == "" || url.indexOf(":/") != -1 || url.indexOf("/") == 0) return engine.removeDotSegments(url);

        // we have $basePath variable placed in context of "current" document
        // this is done in construct() function

        // let's go to the callers and inspect their arguments
        // The 2-nd argument of the callers we hope is context object
        // e.g. see calling signature of bindings and signals

        var detectedBasePath = "";
        var currentCaller = Qt.resolvedUrl.caller;
        var maxcount = 10;
        while (maxcount-- > 0 && currentCaller) {
            if (currentCaller.arguments[1] && currentCaller.arguments[1]["$basePath"]) {
                detectedBasePath = currentCaller.arguments[1]["$basePath"];
                break;
            }
            currentCaller = currentCaller.caller;
        }

        return engine.removeDotSegments(detectedBasePath + url);
    },

    // Buttons masks
    LeftButton: 1,
    RightButton: 2,
    MiddleButton: 4,
    // Modifiers masks
    NoModifier: 0,
    ShiftModifier: 1,
    ControlModifier: 2,
    AltModifier: 4,
    MetaModifier: 8,
    KeypadModifier: 16, // Note: Not available in web
    // Layout directions
    LeftToRight: 0,
    RightToLeft: 1,
    // Orientations
    Vertical: 0,
    Horizontal: 1,
    // Keys
    Key_Escape: 27,
    Key_Tab: 9,
    Key_Backtab: 245,
    Key_Backspace: 8,
    Key_Return: 13,
    Key_Enter: 13,
    Key_Insert: 45,
    Key_Delete: 46,
    Key_Pause: 19,
    Key_Print: 42,
    Key_SysReq: 0,
    Key_Clear: 12,
    Key_Home: 36,
    Key_End: 35,
    Key_Left: 37,
    Key_Up: 38,
    Key_Right: 39,
    Key_Down: 40,
    Key_PageUp: 33,
    Key_PageDown: 34,
    Key_Shift: 16,
    Key_Control: 17,
    Key_Meta: 91,
    Key_Alt: 18,
    Key_AltGr: 0,
    Key_CapsLock: 20,
    Key_NumLock: 144,
    Key_ScrollLock: 145,
    Key_F1: 112, Key_F2: 113, Key_F3: 114, Key_F4: 115, Key_F5: 116, Key_F6: 117, Key_F7: 118, Key_F8: 119, Key_F9: 120, Key_F10: 121, Key_F11: 122, Key_F12: 123, Key_F13: 124, Key_F14: 125, Key_F15: 126, Key_F16: 127, Key_F17: 128, Key_F18: 129, Key_F19: 130, Key_F20: 131, Key_F21: 132, Key_F22: 133, Key_F23: 134, Key_F24: 135, Key_F25: 0, Key_F26: 0, Key_F27: 0, Key_F28: 0, Key_F29: 0, Key_F30: 0, Key_F31: 0, Key_F32: 0, Key_F33: 0, Key_F34: 0, Key_F35: 0,
    Key_Super_L: 0,
    Key_Super_R: 0,
    Key_Menu: 0,
    Key_Hyper_L: 0,
    Key_Hyper_R: 0,
    Key_Help: 6,
    Key_Direction_L: 0,
    Key_Direction_R: 0,
    Key_Space: 32,
    Key_Any: 32,
    Key_Exclam: 161,
    Key_QuoteDbl: 162,
    Key_NumberSign: 163,
    Key_Dollar: 164,
    Key_Percent: 165,
    Key_Ampersant: 166,
    Key_Apostrophe: 222,
    Key_ParenLeft: 168,
    Key_ParenRight: 169,
    Key_Asterisk: 170,
    Key_Plus: 171,
    Key_Comma: 188,
    Key_Minus: 173,
    Key_Period: 190,
    Key_Slash: 191,
    Key_0: 48, Key_1: 49, Key_2: 50, Key_3: 51, Key_4: 52, Key_5: 53, Key_6: 54, Key_7: 55, Key_8: 56, Key_9: 57,
    Key_Colon: 58,
    Key_Semicolon: 59,
    Key_Less: 60,
    Key_Equal: 61,
    Key_Greater: 62,
    Key_Question: 63,
    Key_At: 64,
    Key_A: 65, Key_B: 66, Key_C: 67, Key_D: 68, Key_E: 69, Key_F: 70, Key_G: 71, Key_H: 72, Key_I: 73, Key_J: 74, Key_K: 75, Key_L: 76, Key_M: 77, Key_N: 78, Key_O: 79, Key_P: 80, Key_Q: 81, Key_R: 82, Key_S: 83, Key_T: 84, Key_U: 85, Key_V: 86, Key_W: 87, Key_X: 88, Key_Y: 89, Key_Z: 90,
    Key_BracketLeft: 219,
    Key_Backslash: 220,
    Key_BracketRight: 221,
    Key_AsciiCircum: 160,
    Key_Underscore: 167,
    Key_QuoteLeft: 0,
    Key_BraceLeft: 174,
    Key_Bar: 172,
    Key_BraceRight: 175,
    Key_AsciiTilde: 176,
    Key_Back: 0,
    Key_Forward: 0,
    Key_Stop: 0,
    Key_VolumeDown: 182,
    Key_VolumeUp: 183,
    Key_VolumeMute: 181,
    Key_multiply: 106,
    Key_add: 107,
    Key_substract: 109,
    Key_divide: 111,
    Key_News: 0,
    Key_OfficeHome: 0,
    Key_Option: 0,
    Key_Paste: 0,
    Key_Phone: 0,
    Key_Calendar: 0,
    Key_Reply: 0,
    Key_Reload: 0,
    Key_RotateWindows: 0,
    Key_RotationPB: 0,
    Key_RotationKB: 0,
    Key_Save: 0,
    Key_Send: 0,
    Key_Spell: 0,
    Key_SplitScreen: 0,
    Key_Support: 0,
    Key_TaskPane: 0,
    Key_Terminal: 0,
    Key_Tools: 0,
    Key_Travel: 0,
    Key_Video: 0,
    Key_Word: 0,
    Key_Xfer: 0,
    Key_ZoomIn: 0,
    Key_ZoomOut: 0,
    Key_Away: 0,
    Key_Messenger: 0,
    Key_WebCam: 0,
    Key_MailForward: 0,
    Key_Pictures: 0,
    Key_Music: 0,
    Key_Battery: 0,
    Key_Bluetooth: 0,
    Key_WLAN: 0,
    Key_UWB: 0,
    Key_AudioForward: 0,
    Key_AudioRepeat: 0,
    Key_AudioRandomPlay: 0,
    Key_Subtitle: 0,
    Key_AudioCycleTrack: 0,
    Key_Time: 0,
    Key_Hibernate: 0,
    Key_View: 0,
    Key_TopMenu: 0,
    Key_PowerDown: 0,
    Key_Suspend: 0,
    Key_ContrastAdjust: 0,
    Key_MediaLast: 0,
    Key_unknown: -1,
    Key_Call: 0,
    Key_Camera: 0,
    Key_CameraFocus: 0,
    Key_Context1: 0,
    Key_Context2: 0,
    Key_Context3: 0,
    Key_Context4: 0,
    Key_Flip: 0,
    Key_Hangup: 0,
    Key_No: 0,
    Key_Select: 93,
    Key_Yes: 0,
    Key_ToggleCallHangup: 0,
    Key_VoiceDial: 0,
    Key_LastNumberRedial: 0,
    Key_Execute: 43,
    Key_Printer: 42,
    Key_Play: 250,
    Key_Sleep: 95,
    Key_Zoom: 251,
    Key_Cancel: 3,
    // Align
    AlignLeft: 0x0001,
    AlignRight: 0x0002,
    AlignHCenter: 0x0004,
    AlignJustify: 0x0008,
    AlignTop: 0x0020,
    AlignBottom: 0x0040,
    AlignVCenter: 0x0080,
    AlignCenter: 0x0084,
    AlignBaseline: 0x0100,
    AlignAbsolute: 0x0010,
    AlignLeading: 0x0001,
    AlignTrailing: 0x0002,
    AlignHorizontal_Mask: 0x001f,
    AlignVertical_Mask: 0x01e0,
    // Screen
    PrimaryOrientation: 0,
    PortraitOrientation: 1,
    LandscapeOrientation: 2,
    InvertedPortraitOrientation: 4,
    InvertedLandscapeOrientation: 8,
    // CursorShape
    ArrowCursor: 0,
    UpArrowCursor: 1,
    CrossCursor: 2,
    WaitCursor: 3,
    IBeamCursor: 4,
    SizeVerCursor: 5,
    SizeHorCursor: 6,
    SizeBDiagCursor: 7,
    SizeFDiagCursor: 8,
    SizeAllCursor: 9,
    BlankCursor: 10,
    SplitVCursor: 11,
    SplitHCursor: 12,
    PointingHandCursor: 13,
    ForbiddenCursor: 14,
    WhatsThisCursor: 15,
    BusyCursor: 16,
    OpenHandCursor: 17,
    ClosedHandCursor: 18,
    DragCopyCursor: 19,
    DragMoveCursor: 20,
    DragLinkCursor: 21,
    LastCursor: 21, //DragLinkCursor,
    BitmapCursor: 24,
    CustomCursor: 25,
    // ScrollBar Policy
    ScrollBarAsNeeded: 0,
    ScrollBarAlwaysOff: 1,
    ScrollBarAlwaysOn: 2
};

/**
 * Creates and returns a signal with the parameters specified in @p params.
 *
 * @param params Array with the parameters of the signal. Each element has to be
 *               an object with the two properties "type" and "name" specifying
 *               the datatype of the parameter and its name. The type is
 *               currently ignored.
 * @param options Options that allow finetuning of the signal.
 */
global.Signal = function Signal(params, options) {
    options = options || {};
    var connectedSlots = [];
    var obj = options.obj;

    var signal = function signal() {
        pushEvalStack();
        for (var i in connectedSlots) {
            try {
                connectedSlots[i].slot.apply(connectedSlots[i].thisObj, arguments);
            } catch (err) {
                console.log(err.message);
            }
        }popEvalStack();
    };
    signal.parameters = params || [];
    signal.connect = function () {
        if (arguments.length == 1) connectedSlots.push({ thisObj: global, slot: arguments[0] });else if (typeof arguments[1] == 'string' || arguments[1] instanceof String) {
            if (arguments[0].$tidyupList && arguments[0] !== obj) arguments[0].$tidyupList.push(this);
            connectedSlots.push({ thisObj: arguments[0], slot: arguments[0][arguments[1]] });
        } else {
            if (arguments[0].$tidyupList && (!obj || arguments[0] !== obj && arguments[0] !== obj.$parent)) arguments[0].$tidyupList.push(this);
            connectedSlots.push({ thisObj: arguments[0], slot: arguments[1] });
        }

        // Notify object of connect
        if (options.obj && options.obj.$connectNotify) {
            options.obj.$connectNotify(options);
        }
    };
    signal.disconnect = function () {
        // callType meaning: 1 = function  2 = string  3 = object with string method  4 = object with function

        var callType = arguments.length == 1 ? arguments[0] instanceof Function ? 1 : 2 : typeof arguments[1] == 'string' || arguments[1] instanceof String ? 3 : 4;
        for (var i = 0; i < connectedSlots.length; i++) {
            var item = connectedSlots[i];
            if (callType == 1 && item.slot == arguments[0] || callType == 2 && item.thisObj == arguments[0] || callType == 3 && item.thisObj == arguments[0] && item.slot == arguments[0][arguments[1]] || item.thisObj == arguments[0] && item.slot == arguments[1]) {
                if (item.thisObj) item.thisObj.$tidyupList.splice(item.thisObj.$tidyupList.indexOf(this), 1);
                connectedSlots.splice(i, 1);
                i--; // We have removed an item from the list so the indexes shifted one backwards
            }
        }

        // Notify object of disconnect
        if (options.obj && options.obj.$disconnectNotify) {
            options.obj.$disconnectNotify(options);
        }
    };
    signal.isConnected = function () {
        var callType = arguments.length == 1 ? 1 : typeof arguments[1] == 'string' || arguments[1] instanceof String ? 2 : 3;
        for (var i in connectedSlots) {
            var item = connectedSlots[i];
            if (callType == 1 && item.slot == arguments[0] || callType == 2 && item.thisObj == arguments[0] && item.slot == arguments[0][arguments[1]] || item.thisObj == arguments[0] && item.slot == arguments[1]) return true;
        }
        return false;
    };
    return signal;
};

// Property that is currently beeing evaluated. Used to get the information
// which property called the getter of a certain other property for
// evaluation and is thus dependant on it.
var evaluatingProperty;
var evaluatingPropertyStack = [];
var evaluatingPropertyPaused = false;
var evaluatingPropertyStackOfStacks = [];

var _executionContext = null;

// All object constructors
var constructors = {
    'int': QMLInteger,
    real: Number,
    'double': Number,
    string: String,
    'bool': Boolean,
    list: QMLList,
    color: QMLColor,
    'enum': Number,
    url: String,
    variant: QMLVariant,
    'var': QMLVariant
};

var modules = {
    Main: constructors
};

var dependants = {};

// Helper. Adds a type to the constructor list
global.registerGlobalQmlType = function (name, type) {
    global[type.name] = type;
    constructors[name] = type;
    modules.Main[name] = type;
};

// Helper. Register a type to a module
global.registerQmlType = function (options, constructor) {
    if (constructor !== undefined) {
        options.constructor = constructor;
    }

    if (typeof options.baseClass === 'string') {
        // TODO: Does not support version specification (yet?)
        var baseModule, baseName;
        var dot = options.baseClass.lastIndexOf('.');
        if (dot === -1) {
            baseModule = options.module;
            baseName = options.baseClass;
        } else {
            baseModule = options.baseClass.substring(0, dot);
            baseName = options.baseClass.substring(dot + 1);
        }
        var found = (modules[baseModule] || []).filter(function (descr) {
            return descr.name === baseName;
        });
        if (found.length > 0) {
            // Ok, we found our base class
            options.baseClass = found[0].constructor;
        } else {
            // Base class not found, delay the loading
            var baseId = [baseModule, baseName].join('.');
            if (!dependants.hasOwnProperty(baseId)) {
                dependants[baseId] = [];
            }
            dependants[baseId].push(options);
            return;
        }
    }

    if (typeof options === 'function') {
        options = {
            module: options.module,
            name: options.element,
            versions: options.versions,
            baseClass: options.baseClass,
            enums: options.enums,
            properties: options.properties,
            constructor: options
        };
    };

    options.constructor.$qmlTypeInfo = {
        enums: options.enums,
        defaultProperty: options.defaultProperty,
        properties: options.properties
    };

    if (options.global) {
        registerGlobalQmlType(options.name, options.constructor);
    } else {
        var moduleDescriptor = {
            name: options.name,
            versions: options.versions,
            constructor: options.constructor
        };

        if (typeof modules[options.module] == 'undefined') modules[options.module] = [];
        modules[options.module].push(moduleDescriptor);
    }

    if (typeof options.baseClass !== 'undefined') {
        inherit(options.constructor, options.baseClass);
    }

    var id = [options.module, options.name].join('.');
    if (dependants.hasOwnProperty(id)) {
        dependants[id].forEach(function (opt) {
            return global.registerQmlType(opt);
        });
        dependants[id].length = 0;
    }
};

global.getConstructor = function (moduleName, version, name) {
    if (typeof modules[moduleName] != 'undefined') {
        for (var i = 0; i < modules[moduleName].length; ++i) {
            var type = modules[moduleName][i];

            if (type.name == name && type.versions.test(version)) return type.constructor;
        }
    }
    return null;
};

global.collectConstructorsForModule = function (moduleName, version) {
    var constructors = {};

    if (typeof modules[moduleName] == 'undefined') {
        console.warn("module `" + moduleName + "` not found");
        return constructors;
    }
    for (var i = 0; i < modules[moduleName].length; ++i) {
        var module = modules[moduleName][i];

        if (module.versions.test(version)) {
            constructors[module.name] = module.constructor;
        }
    }
    return constructors;
};

global.mergeObjects = function (obj1, obj2) {
    var mergedObject = {};

    if (typeof obj1 != 'undefined' && obj1 != null) {
        for (var key in obj1) {
            mergedObject[key] = obj1[key];
        }
    }
    if (typeof obj2 != 'undefined' && obj2 != null) {
        for (var key in obj2) {
            mergedObject[key] = obj2[key];
        }
    }
    return mergedObject;
};

global.perContextConstructors = {};

global.loadImports = function (self, imports) {
    constructors = mergeObjects(modules.Main, null);
    if (imports.filter(function (row) {
        return row[1] === 'QtQml';
    }).length === 0 && imports.filter(function (row) {
        return row[1] === 'QtQuick';
    }).length === 1) {
        imports.push(['qmlimport', 'QtQml', 2, '', true]);
    }
    for (var i = 0; i < imports.length; ++i) {
        var moduleName = imports[i][1],
            moduleVersion = imports[i][2],
            moduleAlias = imports[i][3],
            moduleConstructors = collectConstructorsForModule(moduleName, moduleVersion);

        if (moduleAlias !== "") constructors[moduleAlias] = mergeObjects(constructors[moduleAlias], moduleConstructors);else constructors = mergeObjects(constructors, moduleConstructors);
    }
    perContextConstructors[self.objectId] = constructors;
};

global.inherit = function (constructor, baseClass) {
    var oldProto = constructor.prototype;
    constructor.prototype = Object.create(baseClass.prototype);
    Object.getOwnPropertyNames(oldProto).forEach(function (prop) {
        constructor.prototype[prop] = oldProto[prop];
    });
    constructor.prototype.constructor = baseClass;
};

function callSuper(self, meta) {
    var info = meta.super.$qmlTypeInfo || {};
    meta.super = meta.super.prototype.constructor;
    meta.super.call(self, meta);

    if (info.enums) {
        // TODO: not exported to the whole file scope yet
        Object.keys(info.enums).forEach(function (name) {
            self[name] = info.enums[name];
        });
    }
    if (info.properties) {
        Object.keys(info.properties).forEach(function (name) {
            var desc = info.properties[name];
            if (typeof desc === 'string') {
                desc = { type: desc };
            }
            createProperty(desc.type, self, name, desc);
        });
    }
    if (info.defaultProperty) {
        self.$defaultProperty = info.defaultProperty;
    }
}

/**
 * QML Object constructor.
 * @param {Object} meta Meta information about the object and the creation context
 * @return {Object} New qml object
 */
function construct(meta) {
    var item, component;

    if (meta.object.$class in constructors) {
        meta.super = constructors[meta.object.$class];
        item = new constructors[meta.object.$class](meta);
        meta.super = undefined;
    } else {
        // Load component from file. Please look at import.js for main notes.
        // Actually, we have to use that order:
        // 1) try to load component from current basePath
        // 2) from importPathList
        // 3) from directories in imports statements and then
        // 4) from qmldir files
        // Currently we support only 1,2 and 4 and use order: 4,1,2
        // TODO: engine.qmldirs is global for all loaded components. That's not qml's original behaviour.
        var qdirInfo = engine.qmldirs[meta.object.$class]; // Are we have info on that component in some imported qmldir files?
        if (qdirInfo) {
            // We have that component in some qmldir, load it from qmldir's url
            component = Qt.createComponent("@" + qdirInfo.url);
        } else component = Qt.createComponent(meta.object.$class + ".qml");

        if (component) {
            var item = component.createObject(meta.parent, {}, meta.context);

            if (typeof item.dom != 'undefined') item.dom.className += " " + meta.object.$class + (meta.object.id ? " " + meta.object.id : "");
            var dProp; // Handle default properties
        } else {
                throw new Error("No constructor found for " + meta.object.$class);
            }
    }

    // id
    if (meta.object.id) setupGetterSetter(meta.context, meta.object.id, function () {
        return item;
    }, function () {});

    // keep path in item for probale use it later in Qt.resolvedUrl
    item.$context["$basePath"] = engine.$basePath; //gut

    // Apply properties (Bindings won't get evaluated, yet)
    applyProperties(meta.object, item, item, item.$context);

    return item;
}

/**
 * Create property getters and setters for object.
 * @param {Object} obj Object for which gsetters will be set
 * @param {String} propName Property name
 * @param {Object} [options] Options that allow finetuning of the property
 */
function createProperty(type, obj, propName) {
    var options = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];

    var prop = new QMLProperty(type, obj, propName);
    var getter, setter;

    obj[propName + "Changed"] = prop.changed;
    obj.$properties[propName] = prop;
    obj.$properties[propName].set(options.initialValue, QMLProperty.ReasonInit);
    getter = function getter() {
        return obj.$properties[propName].get();
    };
    if (!options.readOnly) setter = function setter(newVal) {
        obj.$properties[propName].set(newVal, QMLProperty.ReasonUser);
    };else {
        setter = function setter(newVal) {
            if (obj.$canEditReadOnlyProperties != true) throw "property '" + propName + "' has read only access";
            obj.$properties[propName].set(newVal, QMLProperty.ReasonUser);
        };
    }
    setupGetterSetter(obj, propName, getter, setter);
    if (obj.$isComponentRoot) setupGetterSetter(obj.$context, propName, getter, setter);
}

/**
 * Set up simple getter function for property
 */

function setupGetter(obj, propName, func) {
    Object.defineProperty(obj, propName, {
        get: func,
        configurable: true,
        enumerable: true
    });
}

function setupSetter(obj, propName, func) {
    Object.defineProperty(obj, propName, {
        set: func,
        configurable: true,
        enumerable: false
    });
}

function setupGetterSetter(obj, propName, getter, setter) {
    Object.defineProperty(obj, propName, {
        get: getter,
        set: setter,
        configurable: true,
        enumerable: false
    });
}

/**
 * Apply properties from metaObject to item.
 * @param {Object} metaObject Source of properties
 * @param {Object} item Target of property apply
 * @param {Object} objectScope Scope in which properties should be evaluated
 * @param {Object} componentScope Component scope in which properties should be evaluated
 */
function applyProperties(metaObject, item, objectScope, componentScope) {
    var i;
    objectScope = objectScope || item;
    _executionContext = componentScope;

    if (metaObject.$children && metaObject.$children.length !== 0) {
        if (item.$defaultProperty) item.$properties[item.$defaultProperty].set(metaObject.$children, QMLProperty.ReasonInit, objectScope, componentScope);else throw "Cannot assign to unexistant default property";
    }
    // We purposefully set the default property AFTER using it, in order to only have it applied for
    // instanciations of this component, but not for its internal children
    if (metaObject.$defaultProperty) item.$defaultProperty = metaObject.$defaultProperty;

    for (i in metaObject) {
        var value = metaObject[i];
        if (i == "id" || i == "$class") {
            // keep them
            item[i] = value;
            continue;
        }

        // skip global id's and internal values
        if (i == "id" || i[0] == "$") {
            continue;
        }
        // slots
        if (i.indexOf("on") == 0 && i[2].toUpperCase() == i[2]) {
            var signalName = i[2].toLowerCase() + i.slice(3);
            if (!item[signalName]) {
                console.warn("No signal called " + signalName + " found!");
                continue;
            } else if (typeof item[signalName].connect != 'function') {
                console.warn(signalName + " is not a signal!");
                continue;
            }
            if (!value.eval) {
                var params = "";
                for (var j in item[signalName].parameters) {
                    params += j == 0 ? "" : ", ";
                    params += item[signalName].parameters[j].name;
                }
                value.src = "(function(" + params + ") { _executionContext = __executionContext;" + value.src + "})";
                value.isFunction = false;
                value.compile();
            }
            item[signalName].connect(item, value.eval(objectScope, componentScope));
            continue;
        }

        if (value instanceof Object) {
            if (value instanceof QMLSignalDefinition) {
                item[i] = Signal(value.parameters);
                if (item.$isComponentRoot) componentScope[i] = item[i];
                continue;
            } else if (value instanceof QMLMethod) {
                value.compile();
                item[i] = value.eval(objectScope, componentScope);
                if (item.$isComponentRoot) componentScope[i] = item[i];
                continue;
            } else if (value instanceof QMLAliasDefinition) {
                // TODO: 1. Alias must be able to point to prop or id of local object,eg: property alias q: t
                //       2. Alias may have same name as id it points to: property alias someid: someid
                //       3. Alias proxy (or property proxy) to proxy prop access to selected incapsulated object. (think twice).
                createProperty("alias", item, i);
                item.$properties[i].componentScope = componentScope;
                item.$properties[i].val = value;
                item.$properties[i].get = function () {
                    var obj = this.componentScope[this.val.objectName];
                    return this.val.propertyName ? obj.$properties[this.val.propertyName].get() : obj;
                };
                item.$properties[i].set = function (newVal, reason, objectScope, componentScope) {
                    if (!this.val.propertyName) throw "Cannot set alias property pointing to an QML object.";
                    this.componentScope[this.val.objectName].$properties[this.val.propertyName].set(newVal, reason, objectScope, componentScope);
                };

                if (value.propertyName) {
                    var con = function con(prop) {
                        var obj = prop.componentScope[prop.val.objectName];
                        if (!obj) {
                            console.error("qtcore: target object ", prop.val.objectName, " not found for alias ", prop);
                        } else {
                            var targetProp = obj.$properties[prop.val.propertyName];
                            if (!targetProp) {
                                console.error("qtcore: target property [", prop.val.objectName, "].", prop.val.propertyName, " not found for alias ", prop.name);
                            } else {
                                // targetProp.changed.connect( prop.changed );
                                // it is not sufficient to connect to `changed` of source property
                                // we have to propagate own changed to it too
                                // seems the best way to do this is to make them identical?..
                                // prop.changed = targetProp.changed;
                                // obj[i + "Changed"] = prop.changed;
                                // no. because those object might be destroyed later.
                                (function () {
                                    var loopWatchdog = false;
                                    targetProp.changed.connect(item, function () {
                                        if (loopWatchdog) return;loopWatchdog = true;
                                        prop.changed.apply(item, arguments);
                                        loopWatchdog = false;
                                    });
                                    prop.changed.connect(obj, function () {
                                        if (loopWatchdog) return;loopWatchdog = true;
                                        targetProp.changed.apply(obj, arguments);
                                        loopWatchdog = false;
                                    });
                                })();
                            }
                        }
                    };
                    engine.pendingOperations.push([con, item.$properties[i]]);
                }

                continue;
            } else if (value instanceof QMLPropertyDefinition) {
                createProperty(value.type, item, i);
                item.$properties[i].set(value.value, QMLProperty.ReasonInit, objectScope, componentScope);
                continue;
            } else if (item[i] && value instanceof QMLMetaPropertyGroup) {
                // Apply properties one by one, otherwise apply at once
                applyProperties(value, item[i], objectScope, componentScope);
                continue;
            }
        }
        if (item.$properties && i in item.$properties) item.$properties[i].set(value, QMLProperty.ReasonInit, objectScope, componentScope);else if (i in item) item[i] = value;else if (item.$setCustomData) item.$setCustomData(i, value);else console.warn("Cannot assign to non-existent property \"" + i + "\". Ignoring assignment.");
    }
}

// ItemModel. EXPORTED.
JSItemModel = function JSItemModel() {
    this.roleNames = [];

    this.setRoleNames = function (names) {
        this.roleNames = names;
    };

    this.dataChanged = Signal([{ type: "int", name: "startIndex" }, { type: "int", name: "endIndex" }]);
    this.rowsInserted = Signal([{ type: "int", name: "startIndex" }, { type: "int", name: "endIndex" }]);
    this.rowsMoved = Signal([{ type: "int", name: "sourceStartIndex" }, { type: "int", name: "sourceEndIndex" }, { type: "int", name: "destinationIndex" }]);
    this.rowsRemoved = Signal([{ type: "int", name: "startIndex" }, { type: "int", name: "endIndex" }]);
    this.modelReset = Signal();
};

// -----------------------------------------------------------------------------
// Stuff below defines QML things
// -----------------------------------------------------------------------------

// Helper
function unboundMethod() {
    console.log("Unbound method for", this);
}

global.addEventListener('load', function () {
    var metaTags = document.getElementsByTagName('BODY');

    for (var i = 0; i < metaTags.length; ++i) {
        var metaTag = metaTags[i];
        var source = metaTag.getAttribute('data-qml');

        if (source != null) {
            global.qmlEngine = new QMLEngine();
            qmlEngine.loadFile(source);
            qmlEngine.start();
            break;
        }
    }
});

global.importJavascriptInContext = function (jsData, $context) {
    /* Remove any ".pragma" statements, as they are not valid JavaScript */
    var source = jsData.source.replace(/\.pragma.*(?:\r\n|\r|\n)/, "\n");
    // TODO: pass more objects to the scope?
    new Function('jsData', '$context', "\n      with ($context) {\n        " + source + "\n      }\n      " + jsData.exports.map(function (sym) {
        return "$context." + sym + " = " + sym + ";";
    }).join('') + "\n    ")(jsData, $context);
};

// TODO
function QMLColor(val) {
    if (typeof val === "number") {
        // we assume it is int value and must be converted to css hex with padding
        // http://stackoverflow.com/questions/57803/how-to-convert-decimal-to-hex-in-javascript
        val = "#" + (Math.round(val) + 0x1000000).toString(16).substr(-6).toUpperCase();
    } else {
        if (typeof val === "array" && val.length >= 3) {
            // array like [r,g,b] where r,g,b are in 0..1 range
            var m = 255;
            val = "rgb(" + Math.round(m * val[0]) + "," + Math.round(m * val[1]) + "," + Math.round(m * val[2]) + ")";
        }
    }
    return val;
};

/*
 * - QMLEngine(element, options) -- Returns new qml engine object, for which:
 *   - loadFile(file) -- Load file to the engine (.qml or .qml.js atm)
 *   - start() -- start the engine/application
 *   - stop() -- stop the engine/application. Restarting is experimental.
 *   element is HTMLCanvasElement and options are for debugging.
 *   For further reference, see testpad and qml viewer applications.
 */

// There can only be one running QMLEngine. This variable points to the currently running engine.
var engine = null;

// QML engine. EXPORTED.
QMLEngine = function QMLEngine(element, options) {
    //----------Public Members----------
    this.fps = 60;
    this.$interval = Math.floor(1000 / this.fps); // Math.floor, causes bugs to timing?
    this.running = false;

    // List of available Components
    this.components = {};

    this.rootElement = element;

    // List of Component.completed signals
    this.completedSignals = [];

    // Current operation state of the engine (Idle, init, etc.)
    this.operationState = 1;

    // List of properties whose values are bindings. For internal use only.
    this.bindedProperties = [];

    // List of operations to perform later after init. For internal use only.
    this.pendingOperations = [];

    // Root object of the engine
    this.rootObject = null;

    // Base path of qml engine (used for resource loading)
    this.$basePath = "";

    //----------Public Methods----------
    // Start the engine
    this.start = function () {
        engine = this;
        var i;
        if (this.operationState !== QMLOperationState.Running) {
            this.operationState = QMLOperationState.Running;
            tickerId = setInterval(tick, this.$interval);
            for (i = 0; i < whenStart.length; i++) {
                whenStart[i]();
            }
        }
    };

    // Stop the engine
    this.stop = function () {
        var i;
        if (this.operationState == QMLOperationState.Running) {
            clearInterval(tickerId);
            this.operationState = QMLOperationState.Idle;
            for (i = 0; i < whenStop.length; i++) {
                whenStop[i]();
            }
        }
    };

    this.ensureFileIsLoadedInQrc = function (file) {
        if (!qrc.includesFile(file)) {
            var src = getUrlContents(file);

            if (src) {
                loadParser();
                console.log('Loading file [', file, ']');
                qrc[file] = qmlweb_parse(src, qmlweb_parse.QMLDocument);
            } else {
                console.log('Can not load file [', file, ']');
            }
        }
    };

    this.extractBasePath = function (file) {
        var basePath = file.split(/[\/\\]/); // work both in url ("/") and windows ("\", from file://d:\test\) notation
        basePath[basePath.length - 1] = "";
        basePath = basePath.join("/");
        return basePath;
    };
    // Load file, parse and construct (.qml or .qml.js)
    this.loadFile = function (file) {
        var parentComponent = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

        var tree;

        this.$basePath = this.extractBasePath(file);
        this.ensureFileIsLoadedInQrc(file);
        tree = convertToEngine(qrc[file]);
        return this.loadQMLTree(tree, parentComponent, file);
    };

    // parse and construct qml
    this.loadQML = function (src) {
        var parentComponent = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
        var file = arguments.length <= 2 || arguments[2] === undefined ? undefined : arguments[2];
        // file is not required; only for debug purposes
        return this.loadQMLTree(parseQML(src, file), parentComponent, file);
    };

    this.loadQMLTree = function (tree) {
        var parentComponent = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
        var file = arguments.length <= 2 || arguments[2] === undefined ? undefined : arguments[2];

        engine = this;
        if (options.debugTree) {
            options.debugTree(tree);
        }

        // Create and initialize objects
        var component = new QMLComponent({ object: tree, parent: parentComponent });

        this.loadImports(tree.$imports);
        component.$basePath = engine.$basePath;
        component.$imports = tree.$imports; // for later use
        component.$file = file; // just for debugging

        this.rootObject = component.createObject(parentComponent);
        component.finalizeImports(this.rootContext());
        this.$initializePropertyBindings();

        this.start();

        this.callCompletedSignals();

        return component;
    };

    /** from http://docs.closure-library.googlecode.com/git/local_closure_goog_uri_uri.js.source.html
     *
     * Removes dot segments in given path component, as described in
     * RFC 3986, section 5.2.4.
     *
     * @param {string} path A non-empty path component.
     * @return {string} Path component with removed dot segments.
     */
    this.removeDotSegments = function (path) {
        var leadingSlash = path && path[0] == "/"; // path.startsWith('/'); -- startsWith seems to be undefined in some browsers
        var segments = path.split('/');
        var out = [];

        for (var pos = 0; pos < segments.length;) {
            var segment = segments[pos++];

            if (segment == '.') {
                if (leadingSlash && pos == segments.length) {
                    out.push('');
                }
            } else if (segment == '..') {
                if (out.length > 1 || out.length == 1 && out[0] != '') {
                    out.pop();
                }
                if (leadingSlash && pos == segments.length) {
                    out.push('');
                }
            } else {
                out.push(segment);
                leadingSlash = true;
            }
        }

        return out.join('/');
    };

    /*
      engine.loadImports( imports, currentDir ) : performs loading of qmldir files from given qml import records.
       Input:
      * parameter `importsArray` - import statements. It is in parser notation, e.g. [import1, import2, ...] where each importN is also array: ["qmlimport","name",version,as,isQualifiedName]
      * parameter `currentFileDir` - base dir for imports lookup. It will be used together with importPathList()
       Implicit input:
      * engine object function `importPathList()` - list of urls bases used for qmldir files lookup
       Additional implicit input/output:
      * engine object variable `qmldirsContents` - used for caching, e.g. memory for previously loaded qmldir files
       Output: 
      * engine object variable `qmldirs` - new records will be added there
       Return value: 
      * nothing
       Details:
       For each of given import statements, loadImports 
      1. computes qmldir file location according to http://doc.qt.io/qt-5/qtqml-syntax-imports.html
      2. calls `readQmlDir` for actual reading and parsing of qmldir file content
      3. gets `external` declarations of that qmldir file and pushes them to `engine.qmldirs` hash.
       `engine.qmldirs` is a hash of form: { componentName => componentFileUrl }
      This hash then used by `qml.js::construct` method for computing component urls.
       Notes:
      1. This method is not suited for loading js imports. This may be done probably after answering to Q1 (below).
      2. Please look for additional notes at readQmlDir function.
       QNA
      Q1: How and where in engine component names might be prefixed? E.g. names with dot inside: SomeModule.Component1
      A1: Seems it doesn't matter. Seems we may just save name with dot-inside right to qmldirs, and it may be used by construct() seamlessly. Check it..
       Q2: How we may access component object from here, to store qmldirs info in components logical scope, and not at engine scope?
      A2: Probably, answer is in Component.js and in global.loadImports
       TODO 
      * We have to keep output in component scope, not in engine scope.
      * We have to add module "as"-names to component's names (which is possible after keeping imports in component scope).
      * Determine how this stuff is related to `global.loadImports`
      * Check A1
      * Make a complete picture of what going in with imports, including Component.js own imports loading
      * Note importJs method in import.js 
    */

    this.loadImports = function (importsArray, currentFileDir) {
        if (!this.qmldirsContents) this.qmldirsContents = { "QtQuick": {}, "QtQuick.Controls": {} }; // cache
        // putting initial keys in qmldirsContents - is a hack. We should find a way to explain to qmlweb, is this built-in module or qmldir-style module.

        if (!this.qmldirs) this.qmldirs = {}; // resulting components lookup table

        if (!importsArray || importsArray.length == 0) return;
        if (!currentFileDir) currentFileDir = this.$basePath; // use this.$basePath by default

        for (var i = 0; i < importsArray.length; i++) {
            var entry = importsArray[i];

            var name = entry[1];

            var nameIsUrl = name.indexOf("//") == 0 || name.indexOf("://") >= 0; // is it url to remote resource
            var nameIsQualifiedModuleName = entry[4]; // e.g. QtQuick, QtQuick.Controls, etc
            var nameIsDir = !nameIsQualifiedModuleName && !nameIsUrl; // local [relative] dir

            if (nameIsDir) {
                // resolve name from relative to full dir path
                // we hope all dirs are relative
                if (currentFileDir && currentFileDir.length > 0) name = this.removeDotSegments(currentFileDir + name);
                if (name[name.length - 1] == "/") name = name.substr(0, name.length - 1); // remove trailing slash as it required for `readQmlDir`
            }
            // TODO if nameIsDir, we have also to add `name` to importPathList() for current component...

            // check if we have already loaded that qmldir file
            if (this.qmldirsContents[name]) continue;

            var content = false;
            if (nameIsQualifiedModuleName && this.userAddedModulePaths && this.userAddedModulePaths[name]) {
                // 1. we have qualified module and user had configured path for that module with this.addModulePath
                content = readQmlDir(this.userAddedModulePaths[name]);
            } else if (nameIsUrl || nameIsDir) {
                // 2. direct load
                // nameIsUrl => url do not need dirs
                // nameIsDir => already computed full path above
                content = readQmlDir(name);
            } else {
                // 3. qt-style lookup for qualified module
                var probableDirs = [currentFileDir].concat(this.importPathList());
                var diredName = name.replace(/\./g, "/");

                for (var k = 0; k < probableDirs.length; k++) {
                    var file = probableDirs[k] + diredName;
                    content = readQmlDir(file);
                    if (content) break;
                }
            }

            if (!content) {
                console.log("qmlengine::loadImports: cannot load qmldir file for import name=", name);
                // save blank info, meaning that we failed to load import
                // this prevents repeated lookups
                this.qmldirsContents[name] = {};

                // NEW
                // add that dir to import path list
                // that means, lookup qml files in that failed dir by trying to load them directly
                // this is not the same behavior as in Qt for "url" schemes,
                // but it is same as for ordirnal disk files.
                // So, we do it for experimental purposes.
                if (nameIsDir) this.addImportPath(name + "/");

                continue;
            }

            // copy founded externals to global var
            // TODO actually we have to copy it to current component
            for (var attrname in content.externals) {
                this.qmldirs[attrname] = content.externals[attrname];
            }

            // keep already loaded qmldir files
            this.qmldirsContents[name] = content;
        }
    };

    this.rootContext = function () {
        return this.rootObject.$context;
    };

    this.focusedElement = function () {
        return this.rootContext().activeFocus;
    }.bind(this);

    // KEYBOARD MANAGEMENT
    var keyboardSignals = {};
    keyboardSignals[Qt.Key_Asterisk] = 'asteriskPressed';
    keyboardSignals[Qt.Key_Back] = 'backPressed';
    keyboardSignals[Qt.Key_Backtab] = 'backtabPressed';
    keyboardSignals[Qt.Key_Call] = 'callPressed';
    keyboardSignals[Qt.Key_Cancel] = 'cancelPressed';
    keyboardSignals[Qt.Key_Delete] = 'deletePressed';
    keyboardSignals[Qt.Key_0] = 'digit0Pressed';
    keyboardSignals[Qt.Key_1] = 'digit1Pressed';
    keyboardSignals[Qt.Key_2] = 'digit2Pressed';
    keyboardSignals[Qt.Key_3] = 'digit3Pressed';
    keyboardSignals[Qt.Key_4] = 'digit4Pressed';
    keyboardSignals[Qt.Key_5] = 'digit5Pressed';
    keyboardSignals[Qt.Key_6] = 'digit6Pressed';
    keyboardSignals[Qt.Key_7] = 'digit7Pressed';
    keyboardSignals[Qt.Key_8] = 'digit8Pressed';
    keyboardSignals[Qt.Key_9] = 'digit9Pressed';
    keyboardSignals[Qt.Key_Escape] = 'escapePressed';
    keyboardSignals[Qt.Key_Flip] = 'flipPressed';
    keyboardSignals[Qt.Key_Hangup] = 'hangupPressed';
    keyboardSignals[Qt.Key_Menu] = 'menuPressed';
    keyboardSignals[Qt.Key_No] = 'noPressed';
    keyboardSignals[Qt.Key_Return] = 'returnPressed';
    keyboardSignals[Qt.Key_Select] = 'selectPressed';
    keyboardSignals[Qt.Key_Space] = 'spacePressed';
    keyboardSignals[Qt.Key_Tab] = 'tabPressed';
    keyboardSignals[Qt.Key_VolumeDown] = 'volumeDownPressed';
    keyboardSignals[Qt.Key_VolumeUp] = 'volumeUpPressed';
    keyboardSignals[Qt.Key_Yes] = 'yesPressed';
    keyboardSignals[Qt.Key_Up] = 'upPressed';
    keyboardSignals[Qt.Key_Right] = 'rightPressed';
    keyboardSignals[Qt.Key_Down] = 'downPressed';
    keyboardSignals[Qt.Key_Left] = 'leftPressed';

    function keyCodeToQt(e) {
        e.keypad = e.keyCode >= 96 && e.keyCode <= 111;
        if (e.keyCode == Qt.Key_Tab && e.shiftKey == true) return Qt.Key_Backtab;else if (e.keyCode >= 97 && e.keyCode <= 122) return e.keyCode - (97 - Qt.Key_A);
        return e.keyCode;
    }

    function eventToKeyboard(e) {
        return {
            accepted: false,
            count: 1,
            isAutoRepeat: false,
            key: keyCodeToQt(e),
            modifiers: e.ctrlKey * Qt.CtrlModifier | e.altKey * Qt.AltModifier | e.shiftKey * Qt.ShiftModifier | e.metaKey * Qt.MetaModifier | e.keypad * Qt.KeypadModifier,
            text: String.fromCharCode(e.charCode)
        };
    }

    document.onkeypress = function (e) {
        var focusedElement = this.focusedElement();
        var event = eventToKeyboard(e || window.event);
        var eventName = keyboardSignals[event.key];

        while (event.accepted != true && focusedElement != null) {
            var backup = focusedElement.$context.event;

            focusedElement.$context.event = event;
            focusedElement.Keys.pressed(event);
            if (eventName != null) focusedElement.Keys[eventName](event);
            focusedElement.$context.event = backup;
            if (event.accepted == true) e.preventDefault();else focusedElement = focusedElement.$parent;
        }
    }.bind(this);

    document.onkeyup = function (e) {
        var focusedElement = this.focusedElement();
        var event = eventToKeyboard(e || window.event);

        while (event.accepted != true && focusedElement != null) {
            var backup = focusedElement.$context.event;

            focusedElement.$context.event = event;
            focusedElement.Keys.released(event);
            focusedElement.$context.event = backup;
            if (event.accepted == true) e.preventDefault();else focusedElement = focusedElement.$parent;
        }
    }.bind(this);
    // END KEYBOARD MANAGEMENT

    this.registerProperty = function (obj, propName) {
        var dependantProperties = [];
        var value = obj[propName];

        function getter() {
            if (evaluatingProperty && dependantProperties.indexOf(evaluatingProperty) == -1) dependantProperties.push(evaluatingProperty);

            return value;
        }

        function setter(newVal) {
            value = newVal;

            for (i in dependantProperties) {
                dependantProperties[i].update();
            }
        }

        setupGetterSetter(obj, propName, getter, setter);
    };

    // next 3 methods used in Qt.createComponent for qml files lookup
    // please open qt site for documentation
    // http://doc.qt.io/qt-5/qqmlengine.html#addImportPath

    this.addImportPath = function (dirpath) {
        if (!this.userAddedImportPaths) this.userAddedImportPaths = [];
        this.userAddedImportPaths.push(dirpath);
    };

    this.setImportPathList = function (arrayOfDirs) {
        this.userAddedImportPaths = arrayOfDirs;
    };

    this.importPathList = function () {
        return this.userAddedImportPaths || [];
    };

    // `addModulePath` defines conrete path for module lookup
    // e.g. addModulePath( "QtQuick.Controls","http://someserver.com/controls" )
    // will force system to `import QtQuick.Controls` module from `http://someserver.com/controls/qmldir`

    this.addModulePath = function (moduleName, dirPath) {

        // remove trailing slash as it required for `readQmlDir`
        if (dirPath[dirPath.length - 1] == "/") dirPath = dirPath.substr(0, dirPath.length - 1);

        // keep the mapping. It will be used in loadImports() function .
        if (!this.userAddedModulePaths) this.userAddedModulePaths = {};
        this.userAddedModulePaths[moduleName] = dirPath;
    };

    //Intern

    // Load file, parse and construct as Component (.qml)
    this.loadComponent = function (name) {
        if (name in this.components) return this.components[name];

        var file = engine.$basePath + name + ".qml";

        this.ensureFileIsLoadedInQrc(file);
        tree = convertToEngine(qrc[file]);
        this.components[name] = tree;
        return tree;
    };

    this.$initializePropertyBindings = function () {
        // Initialize property bindings
        // we use `while`, because $initializePropertyBindings may be called recursive (because of Loader and/or createQmlObject )
        while (this.bindedProperties.length > 0) {
            var property = this.bindedProperties.shift();
            if (!property.binding) continue; // Probably, the binding was overwritten by an explicit value. Ignore.
            if (property.needsUpdate) property.update();else if (["width", "height", "fill", "x", "y", "left", "right", "top", "bottom"].indexOf(property.name) >= 0) {
                // It is possible that bindings with these names was already evaluated during eval of other bindings
                // but in that case updateHGeometry and updateVGeometry could be blocked during their eval.
                // So we call them explicitly, just in case.

                if (property.changed.isConnected(property.obj, updateHGeometry)) updateHGeometry.apply(property.obj, [property.val, property.val, property.name]);
                if (property.changed.isConnected(property.obj, updateVGeometry)) updateVGeometry.apply(property.obj, [property.val, property.val, property.name]);
            }
        }

        this.$initializeAliasSignals();
    };

    this.$initializeAliasSignals = function () {
        // Perform pending operations. Now we use it only to init alias's "changed" handlers, that's why we have such strange function name.
        while (this.pendingOperations.length > 0) {
            var op = this.pendingOperations.shift();
            op[0](op[1], op[2], op[3]);
        }
        this.pendingOperations = [];
    };

    // Return a path to load the file
    this.$resolvePath = function (file) {
        // probably, replace :// with :/ ?
        if (file == "" || file.indexOf("://") != -1 || file.indexOf("/") == 0 || file.indexOf("data:") == 0 || file.indexOf("blob:") == 0) {
            return file;
        }
        return this.$basePath + file;
    };

    this.$registerStart = function (f) {
        whenStart.push(f);
    };

    this.$registerStop = function (f) {
        whenStop.push(f);
    };

    this.$addTicker = function (t) {
        tickers.push(t);
    };

    this.$removeTicker = function (t) {
        var index = tickers.indexOf(t);
        if (index != -1) {
            tickers.splice(index, 1);
        }
    };

    this.size = function () {
        return { width: this.rootObject.getWidth(), height: this.rootObject.getHeight() };
    };

    //----------Private Methods----------

    function tick() {
        var i,
            now = new Date().getTime(),
            elapsed = now - lastTick;
        lastTick = now;
        for (i = 0; i < tickers.length; i++) {
            tickers[i](now, elapsed);
        }
    }

    //----------Private Members----------
    // Target canvas
    var // Callbacks for stopping or starting the engine
    whenStop = [],
        whenStart = [],

    // Ticker resource id and ticker callbacks
    tickerId,
        tickers = [],
        lastTick = new Date().getTime(),
        i;

    //----------Construct----------

    options = options || {};

    if (options.debugConsole) {
        // Replace QML-side console.log
        console = {};
        console.log = function () {
            var args = Array.prototype.slice.call(arguments);
            options.debugConsole.apply(undefined, args);
        };
    }

    // TODO: Move to module initialization
    for (i in constructors) {
        if (constructors[i].getAttachedObject) setupGetter(QMLBaseObject.prototype, i, constructors[i].getAttachedObject);
    }
};

QMLEngine.prototype.callCompletedSignals = function () {
    // the while loop is better than for..in loop, because completedSignals array might change dynamically when
    // some completed signal handlers will create objects dynamically via createQmlObject or Loader
    while (this.completedSignals.length > 0) {
        var handler = this.completedSignals.shift();
        handler();
    }
};

function QMLInteger(val) {
    return val | 0;
}

function QMLList(meta) {
    var list = [];
    if (meta.object instanceof Array) for (var i in meta.object) {
        list.push(construct({ object: meta.object[i], parent: meta.parent, context: meta.context }));
    } else if (meta.object instanceof QMLMetaElement) list.push(construct({ object: meta.object, parent: meta.parent, context: meta.context }));

    return list;
}

QMLOperationState = {
    Idle: 1,
    Init: 2,
    Running: 3
};

function QMLProperty(type, obj, name) {
    this.obj = obj;
    this.name = name;
    this.changed = Signal([], { obj: obj });
    this.binding = null;
    this.objectScope = null;
    this.componentScope = null;
    this.value = undefined;
    this.type = type;
    this.animation = null;
    this.needsUpdate = true;

    // This list contains all signals that hold references to this object.
    // It is needed when deleting, as we need to tidy up all references to this object.
    this.$tidyupList = [];
}

QMLProperty.ReasonUser = 0;
QMLProperty.ReasonInit = 1;
QMLProperty.ReasonAnimation = 2;

function pushEvalStack() {
    evaluatingPropertyStackOfStacks.push(evaluatingPropertyStack);
    evaluatingPropertyStack = [];
    evaluatingProperty = undefined;
    //  console.log("evaluatingProperty=>undefined due to push stck ");
}

function popEvalStack() {
    evaluatingPropertyStack = evaluatingPropertyStackOfStacks.pop() || [];
    evaluatingProperty = evaluatingPropertyStack[evaluatingPropertyStack.length - 1];
}

function pushEvaluatingProperty(prop) {
    // TODO say warnings if already on stack. This means binding loop. BTW actually we do not loop because needsUpdate flag is reset before entering update again.
    if (evaluatingPropertyStack.indexOf(prop) >= 0) {
        console.error("Property binding loop detected for property ", prop.name, [prop].slice(0));
    }
    evaluatingProperty = prop;
    evaluatingPropertyStack.push(prop); //keep stack of props
}

function popEvaluatingProperty() {

    evaluatingPropertyStack.pop();
    evaluatingProperty = evaluatingPropertyStack[evaluatingPropertyStack.length - 1];
}

// Updater recalculates the value of a property if one of the
// dependencies changed
QMLProperty.prototype.update = function () {
    this.needsUpdate = false;

    if (!this.binding) return;

    var oldVal = this.val;

    try {
        pushEvaluatingProperty(this);
        if (!this.binding.eval) this.binding.compile();
        this.val = this.binding.eval(this.objectScope, this.componentScope);
    } catch (e) {
        console.log("QMLProperty.update binding error:", e, Function.prototype.toString.call(this.binding.eval));
    } finally {
        popEvaluatingProperty();
    }

    if (this.animation) {
        this.animation.$actions = [{
            target: this.animation.target || this.obj,
            property: this.animation.property || this.name,
            from: this.animation.from || oldVal,
            to: this.animation.to || this.val
        }];
        this.animation.restart();
    }

    if (this.val !== oldVal) this.changed(this.val, oldVal, this.name);
};

// Define getter
QMLProperty.prototype.get = function () {
    //if (this.needsUpdate && !evaluatingPropertyPaused) {
    if (this.needsUpdate && engine.operationState !== QMLOperationState.Init) {
        this.update();
    }

    // If this call to the getter is due to a property that is dependant on this
    // one, we need it to take track of changes
    if (evaluatingProperty && !this.changed.isConnected(evaluatingProperty, QMLProperty.prototype.update)) {
        // console.log( this,evaluatingPropertyStack.slice(0),this.val );
        this.changed.connect(evaluatingProperty, QMLProperty.prototype.update);
    }

    return this.val;
};

var typeInitialValues = {
    int: 0,
    real: 0,
    double: 0,
    string: '',
    bool: false,
    list: [],
    url: ''
};

// Define setter
QMLProperty.prototype.set = function (newVal, reason, objectScope, componentScope) {
    var i,
        oldVal = this.val;

    if (newVal instanceof QMLBinding) {
        if (!objectScope || !componentScope) throw "Internal error: binding assigned without scope";
        this.binding = newVal;
        this.objectScope = objectScope;
        this.componentScope = componentScope;

        if (engine.operationState !== QMLOperationState.Init) {
            if (!newVal.eval) newVal.compile();
            try {
                pushEvaluatingProperty(this);

                this.needsUpdate = false;
                newVal = this.binding.eval(objectScope, componentScope);
            } finally {
                popEvaluatingProperty();
            }
        } else {
            engine.bindedProperties.push(this);
            return;
        }
    } else {
        if (reason != QMLProperty.ReasonAnimation) this.binding = null;
        if (newVal instanceof Array) newVal = newVal.slice(); // Copies the array
    }

    if (reason === QMLProperty.ReasonInit && typeof newVal === 'undefined') {
        if (typeInitialValues.hasOwnProperty(this.type)) {
            newVal = typeInitialValues[this.type];
        }
    }

    if (constructors[this.type] == QMLList) {
        this.val = QMLList({ object: newVal, parent: this.obj, context: componentScope });
    } else if (newVal instanceof QMLMetaElement) {
        if (constructors[newVal.$class] == QMLComponent || constructors[this.type] == QMLComponent) this.val = new QMLComponent({ object: newVal, parent: this.obj, context: componentScope });else this.val = construct({ object: newVal, parent: this.obj, context: componentScope });
    } else if (newVal instanceof Object || !newVal) {
        this.val = newVal;
    } else {
        this.val = constructors[this.type](newVal);
    }

    if (this.val !== oldVal) {
        if (this.animation && reason == QMLProperty.ReasonUser) {
            this.animation.running = false;
            this.animation.$actions = [{
                target: this.animation.target || this.obj,
                property: this.animation.property || this.name,
                from: this.animation.from || oldVal,
                to: this.animation.to || this.val
            }];
            this.animation.running = true;
        }
        if (this.obj.$syncPropertyToRemote instanceof Function && reason == QMLProperty.ReasonUser) {
            // is a remote object from e.g. a QWebChannel
            this.obj.$syncPropertyToRemote(this.name, newVal);
        } else {
            this.changed(this.val, oldVal, this.name);
        }
    }
};

function QMLVariant(val) {
    return val;
}

// Base object for all qml thingies
var objectIds = 0;
function QObject(parent) {
    this.$parent = parent;
    if (parent && parent.$tidyupList) parent.$tidyupList.push(this);
    // List of things to tidy up when deleting this object.
    this.$tidyupList = [];
    this.$properties = {};

    this.objectId = objectIds++;
    this.$delete = function () {
        if (this.$Component) this.$Component.destruction();

        while (this.$tidyupList.length > 0) {
            var item = this.$tidyupList[0];
            if (item.$delete) // It's a QObject
                item.$delete();else // It must be a signal
                item.disconnect(this);
        }

        for (var i in this.$properties) {
            var prop = this.$properties[i];
            while (prop.$tidyupList.length > 0) {
                prop.$tidyupList[0].disconnect(prop);
            }
        }

        if (this.$parent && this.$parent.$tidyupList) this.$parent.$tidyupList.splice(this.$parent.$tidyupList.indexOf(this), 1);

        // must do this:
        // 1) parent will be notified and erase object from it's children.
        // 2) DOM node will be removed.
        this.parent = undefined;
    };

    // must have `destroy` method
    // http://doc.qt.io/qt-5/qtqml-javascript-dynamicobjectcreation.html
    this.destroy = this.$delete;
}

function updateHGeometry(newVal, oldVal, propName) {
    var anchors = this.anchors || this;
    if (this.$updatingHGeometry) return;
    this.$updatingHGeometry = true;

    var t,
        w,
        width,
        x,
        left,
        hC,
        right,
        lM = anchors.leftMargin || anchors.margins,
        rM = anchors.rightMargin || anchors.margins;

    // Width
    if (this.$isUsingImplicitWidth && propName == "implicitWidth") width = this.implicitWidth;else if (propName == "width") this.$isUsingImplicitWidth = false;

    // Position TODO: Layouts
    if ((t = anchors.fill) !== undefined) {
        if (!t.$properties.left.changed.isConnected(this, updateHGeometry)) t.$properties.left.changed.connect(this, updateHGeometry);
        if (!t.$properties.right.changed.isConnected(this, updateHGeometry)) t.$properties.right.changed.connect(this, updateHGeometry);
        if (!t.$properties.width.changed.isConnected(this, updateHGeometry)) t.$properties.width.changed.connect(this, updateHGeometry);

        this.$isUsingImplicitWidth = false;
        width = t.width - lM - rM;
        x = t.left - (this.parent ? this.parent.left : 0) + lM;
        left = t.left + lM;
        right = t.right - rM;
        hC = (left + right) / 2;
    } else if ((t = anchors.centerIn) !== undefined) {
        if (!t.$properties.horizontalCenter.changed.isConnected(this, updateHGeometry)) t.$properties.horizontalCenter.changed.connect(this, updateHGeometry);

        w = width || this.width;
        hC = t.horizontalCenter;
        x = hC - w / 2 - (this.parent ? this.parent.left : 0);
        left = hC - w / 2;
        right = hC + w / 2;
    } else if ((t = anchors.left) !== undefined) {
        left = t + lM;
        if ((u = anchors.right) !== undefined) {
            right = u - rM;
            this.$isUsingImplicitWidth = false;
            width = right - left;
            x = left - (this.parent ? this.parent.left : 0);
            hC = (right + left) / 2;
        } else if ((hC = anchors.horizontalCenter) !== undefined) {
            this.$isUsingImplicitWidth = false;
            width = (hC - left) * 2;
            x = left - (this.parent ? this.parent.left : 0);
            right = 2 * hC - left;
        } else {
            w = width || this.width;
            x = left - (this.parent ? this.parent.left : 0);
            right = left + w;
            hC = left + w / 2;
        }
    } else if ((t = anchors.right) !== undefined) {
        right = t - rM;
        if ((hC = anchors.horizontalCenter) !== undefined) {
            this.$isUsingImplicitWidth = false;
            width = (right - hC) * 2;
            x = 2 * hC - right - (this.parent ? this.parent.left : 0);
            left = 2 * hC - right;
        } else {
            w = width || this.width;
            x = right - w - (this.parent ? this.parent.left : 0);
            left = right - w;
            hC = right - w / 2;
        }
    } else if ((hC = anchors.horizontalCenter) !== undefined) {
        w = width || this.width;
        x = hC - w / 2 - (this.parent ? this.parent.left : 0);
        left = hC - w / 2;
        right = hC + w / 2;
    } else {
        if (this.parent && !this.parent.$properties.left.changed.isConnected(this, updateHGeometry)) this.parent.$properties.left.changed.connect(this, updateHGeometry);

        w = width || this.width;
        left = this.x + (this.parent ? this.parent.left : 0);
        right = left + w;
        hC = left + w / 2;
    }

    if (left !== undefined) this.left = left;
    if (hC !== undefined) this.horizontalCenter = hC;
    if (right !== undefined) this.right = right;
    if (x !== undefined) this.x = x;
    if (width !== undefined) this.width = width;

    this.$updatingHGeometry = false;

    if (this.parent) updateChildrenRect(this.parent);
}

function updateVGeometry(newVal, oldVal, propName) {
    var anchors = this.anchors || this;
    if (this.$updatingVGeometry) return;
    this.$updatingVGeometry = true;

    var t,
        w,
        height,
        y,
        top,
        vC,
        bottom,
        tM = anchors.topMargin || anchors.margins,
        bM = anchors.bottomMargin || anchors.margins;

    // Height
    if (this.$isUsingImplicitHeight && propName == "implicitHeight") height = this.implicitHeight;else if (propName == "height") this.$isUsingImplicitHeight = false;

    // Position TODO: Layouts
    if ((t = anchors.fill) !== undefined) {
        if (!t.$properties.top.changed.isConnected(this, updateVGeometry)) t.$properties.top.changed.connect(this, updateVGeometry);
        if (!t.$properties.bottom.changed.isConnected(this, updateVGeometry)) t.$properties.bottom.changed.connect(this, updateVGeometry);
        if (!t.$properties.height.changed.isConnected(this, updateVGeometry)) t.$properties.height.changed.connect(this, updateVGeometry);

        this.$isUsingImplicitHeight = false;
        height = t.height - tM - bM;
        y = t.top - (this.parent ? this.parent.top : 0) + tM;
        top = t.top + tM;
        bottom = t.bottom - bM;
        vC = (top + bottom) / 2;
    } else if ((t = anchors.centerIn) !== undefined) {
        if (!t.$properties.verticalCenter.changed.isConnected(this, updateVGeometry)) t.$properties.verticalCenter.changed.connect(this, updateVGeometry);

        w = height || this.height;
        vC = t.verticalCenter;
        y = vC - w / 2 - (this.parent ? this.parent.top : 0);
        top = vC - w / 2;
        bottom = vC + w / 2;
    } else if ((t = anchors.top) !== undefined) {
        top = t + tM;
        if ((u = anchors.bottom) !== undefined) {
            bottom = u - bM;
            this.$isUsingImplicitHeight = false;
            height = bottom - top;
            y = top - (this.parent ? this.parent.top : 0);
            vC = (bottom + top) / 2;
        } else if ((vC = anchors.verticalCenter) !== undefined) {
            this.$isUsingImplicitHeight = false;
            height = (vC - top) * 2;
            y = top - (this.parent ? this.parent.top : 0);
            bottom = 2 * vC - top;
        } else {
            w = height || this.height;
            y = top - (this.parent ? this.parent.top : 0);
            bottom = top + w;
            vC = top + w / 2;
        }
    } else if ((t = anchors.bottom) !== undefined) {
        bottom = t - bM;
        if ((vC = anchors.verticalCenter) !== undefined) {
            this.$isUsingImplicitHeight = false;
            height = (bottom - vC) * 2;
            y = 2 * vC - bottom - (this.parent ? this.parent.top : 0);
            top = 2 * vC - bottom;
        } else {
            w = height || this.height;
            y = bottom - w - (this.parent ? this.parent.top : 0);
            top = bottom - w;
            vC = bottom - w / 2;
        }
    } else if ((vC = anchors.verticalCenter) !== undefined) {
        w = height || this.height;
        y = vC - w / 2 - (this.parent ? this.parent.top : 0);
        top = vC - w / 2;
        bottom = vC + w / 2;
    } else {
        if (this.parent && !this.parent.$properties.top.changed.isConnected(this, updateVGeometry)) this.parent.$properties.top.changed.connect(this, updateVGeometry);

        w = height || this.height;
        top = this.y + (this.parent ? this.parent.top : 0);
        bottom = top + w;
        vC = top + w / 2;
    }

    if (top !== undefined) this.top = top;
    if (vC !== undefined) this.verticalCenter = vC;
    if (bottom !== undefined) this.bottom = bottom;
    if (y !== undefined) this.y = y;
    if (height !== undefined) this.height = height;

    this.$updatingVGeometry = false;

    if (this.parent) updateChildrenRect(this.parent);
}

function updateChildrenRect(component) {
    var children = component !== undefined ? component.children : undefined;
    if (children == undefined || children.length == 0) return;

    var maxWidth = 0;
    var maxHeight = 0;
    var minX = children.length > 0 ? children[0].x : 0;
    var minY = children.length > 0 ? children[0].y : 0;
    var child;

    for (var i = 0; i < children.length; i++) {
        child = children[i];
        maxWidth = Math.max(maxWidth, child.x + child.width);
        maxHeight = Math.max(maxHeight, child.y + child.heighth);
        minX = Math.min(minX, child.x);
        minY = Math.min(minX, child.y);
    }

    component.childrenRect.x = minX;
    component.childrenRect.y = minY;
    component.childrenRect.width = maxWidth;
    component.childrenRect.height = maxHeight;
}

function QMLDomElement(meta) {
    callSuper(this, meta);
    var tagName = meta.object.tagName || 'div';
    this.dom = document.createElement(tagName);

    createProperty('string', this, 'tagName');

    // TODO: support properties, styles, perhaps changing the tagName
}

registerQmlType({
    module: 'QmlWeb.Dom',
    name: 'DomElement',
    versions: /.*/,
    baseClass: 'QtQuick.Item',
    constructor: QMLDomElement
});

registerQmlType({
    module: 'QmlWeb',
    name: 'RestModel',
    versions: /.*/,
    baseClass: 'QtQuick.Item',
    constructor: function QMLRestModel(meta) {
        callSuper(this, meta);
        var self = this;
        var attributes = this.getAttributes();

        createProperty("string", this, "url");
        createProperty("bool", this, "isLoading");
        createProperty("string", this, "mimeType");
        createProperty("string", this, "queryMimeType");

        this.mimeType = "application/json";
        this.queryMimeType = "application/x-www-urlencoded";
        this.isLoading = false;
        this.attributes = attributes;

        this.fetched = Signal();
        this.saved = Signal();

        this.runningRequests = 0;

        this.fetch = function () {
            ajax({
                method: 'GET',
                mimeType: self.mimetype,
                success: function success(xhr) {
                    xhrReadResponse(xhr);
                    self.fetched();
                }
            });
        };

        this.create = function () {
            sendToServer('POST');
        };

        this.save = function () {
            sendToServer('PUT');
        };

        function sendToServer(method) {
            var body = generateBodyForPostQuery();

            ajax({
                method: method,
                mimeType: self.queryMimeType,
                body: body,
                success: function success(xhr) {
                    xhrReadResponse(xhr);
                    self.saved();
                }
            });
        }

        this.remove = function () {
            ajax({
                method: 'DELETE',
                success: function success(xhr) {
                    self.destroy();
                }
            });
        };

        function generateBodyForPostQuery() {
            var object = {};
            var body;

            for (var i = 0; i < self.attributes.length; ++i) {
                object[self.attributes[i]] = self.$properties[self.attributes[i]].get();
            }console.log(object);
            if (self.queryMimeType == 'application/json' || self.queryMimeType == 'text/json') body = JSON.stringify(object);else if (self.queryMimeType == 'application/x-www-urlencoded') body = objectToUrlEncoded(object);
            return body;
        }

        function myEncodeURIComponent(str) {
            return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
                return '%' + c.charCodeAt(0).toString(16);
            });
        }

        function objectToUrlEncoded(object, prefix) {
            var str = '';
            for (var key in object) {
                if (object.hasOwnProperty(key)) {
                    var value = object[key];
                    if (str != '') str += '&';
                    if (typeof prefix != 'undefined') key = prefix + '[' + key + ']';
                    if ((typeof value === "undefined" ? "undefined" : _typeof(value)) == 'object') str += objectToUrlEncoded(value, key);else str += myEncodeURIComponent(key) + '=' + myEncodeURIComponent(value);
                }
            }
            return str;
        }

        function ajax(options) {
            var xhr = new XMLHttpRequest();

            xhr.overrideMimeType(self.mimeType);
            xhr.onreadystatechange = function () {
                if (xhr.readyState == XMLHttpRequest.DONE) {
                    if (xhr.status == 200) options.success(xhr);else options.failure(xhr);
                    self.runningRequests -= 1;
                    if (self.runningRequests <= 0) self.isLoading = false;
                }
            };
            xhr.open(options.method, self.url, true);
            if (typeof options.body != 'undefined') {
                xhr.setRequestHeader('Content-Type', self.queryMimeType);
                xhr.send(options.body);
            } else xhr.send(null);
            self.runningRequests += 1;
            self.isLoading = true;
        }

        function xhrReadResponse(xhr) {
            var responseObject;

            if (self.mimeType == 'application/json' || self.mimeType == 'text/json') {
                responseObject = JSON.parse(xhr.responseText);
            }
            updatePropertiesFromResponseObject(responseObject);
        }

        function updatePropertiesFromResponseObject(responseObject) {
            for (var key in responseObject) {
                if (responseObject.hasOwnProperty(key) && self.$hasProperty(key)) {
                    self.$properties[key].set(responseObject[key], QMLProperty.ReasonUser);
                }
            }
        }

        this.$hasProperty = function (name) {
            return typeof self.$properties[name] != 'undefined';
        };
    }
});

registerQmlType({
    module: 'Qt.labs.settings',
    name: 'Settings',
    versions: /.*/,
    baseClass: 'QtQuick.Item',
    constructor: function QMLSettings(meta) {
        callSuper(this, meta);

        createProperty("string", this, "category");

        if (typeof window.localStorage == 'undefined') return;

        var attributes;

        var getKey = function (attrName) {
            return this.category + '/' + attrName;
        }.bind(this);

        var loadProperties = function () {
            for (var i = 0; i < attributes.length; ++i) {
                this[attributes[i]] = localStorage.getItem(getKey(attributes[i]));
            }
        }.bind(this);

        var initializeProperties = function () {
            for (var i = 0; i < attributes.length; ++i) {
                var attrName = attributes[i];
                var signalName = attrName + 'Changed';
                var emitter = this;

                if (this.$properties[attrName].type == 'alias') {
                    emitter = this.$context[this.$properties[attrName].val.objectName];
                    signalName = this.$properties[attrName].val.propertyName + 'Changed';
                }
                emitter[signalName].connect(this, function () {
                    localStorage.setItem(getKey(this.attrName), this.self[this.attrName]);
                }.bind({ self: this, attrName: attrName }));
            }
        }.bind(this);

        this.Component.completed.connect(this, function () {
            attributes = this.getAttributes();
            loadProperties();
            initializeProperties();
        }.bind(this));
    }
});

registerQmlType({
    module: 'QtGraphicalEffects',
    name: 'FastBlur',
    versions: /.*/,
    baseClass: 'QtQuick.Item',
    constructor: function QMLFastBlur(meta) {
        callSuper(this, meta);

        var previousSource = null;
        var filterObject;

        createProperty("real", this, "radius");
        createProperty("var", this, "source");
        this.radius = 0;
        this.source = null;

        var updateFilterObject = function () {
            filterObject = {
                transformType: 'filter',
                operation: 'blur',
                parameters: this.radius + 'px'
            };
        }.bind(this);

        function stripEffectFromSource(source) {
            if (previousSource != null) {
                var index = previousSource.transform.indexOf(filterObject);

                previousSource.transform.splice(index, 1);
                previousSource.$updateTransform();
            }
        }

        function updateEffect(source) {
            console.log("updating effect");
            stripEffectFromSource(previousSource);
            if (source != null && typeof source.transform != 'undefined') {
                updateFilterObject();
                console.log("updating effect:", filterObject, source);
                source.transform.push(filterObject);
                source.$updateTransform();
                previousSource = source;
            } else {
                previousSource = null;
            }
        }

        this.radiusChanged.connect(this, function (newVal) {
            updateEffect(this.source);
        }.bind(this));

        this.sourceChanged.connect(this, function (newVal) {
            updateEffect(this.source);
        }.bind(this));
    }
});

registerQmlType({
    module: 'QtMobility',
    name: 'GeoLocation',
    versions: /.*/,
    baseClass: 'QtQuick.Item',
    constructor: function QMLGeoLocation(meta) {
        callSuper(this, meta);
        var self = this;

        createProperty("double", this, "accuracy");
        createProperty("double", this, "altitude");
        createProperty("double", this, "altitudeAccuracy");
        createProperty("double", this, "heading");
        createProperty("string", this, "label");
        createProperty("double", this, "latitude");
        createProperty("double", this, "longitude");
        createProperty("double", this, "speed");
        createProperty("date", this, "timestamp");

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition;
        }

        var updatePosition = function (position) {
            this.accuracy = position.coords.accuracy;
            this.altitude = position.coords.altitude;
            this.altitudeAccuracy = position.coords.altitudeAccuracy;
            this.heading = position.coords.heading;
            this.latitude = position.coords.latitude;
            this.longitude = position.coords.longitude;
            this.speed = position.coords.speed;
            this.timestamp = position.timestamp;
        }.bind(this);

        navigator.geolocation.getCurrentPosition(updatePosition);
        navigator.geolocation.watchPosition(updatePosition);
    }
});

global.MediaPlayer = {
    NoError: 0, ResourceError: 1, FormatError: 2, NetworkError: 4, AccessDenied: 8, ServiceMissing: 16,
    StoppedState: 0, PlayingState: 1, PausedState: 2,
    NoMedia: 0, Loading: 1, Loaded: 2, Buffering: 4, Stalled: 8, EndOfMedia: 16, InvalidMedia: 32, UnknownStatus: 64
};

global.VideoOutput = {
    PreserveAspectFit: 0, PreserveAspectCrop: 1, Stretch: 2
};

registerQmlType({
    module: 'QtMultimedia',
    name: 'Video',
    versions: /^5\./,
    baseClass: 'QtQuick.Item',
    constructor: function QMLVideo(meta) {
        callSuper(this, meta);

        var runningEventListener = 0;
        var volumeBackup;

        var domVideo = this.impl = document.createElement('video');
        domVideo.style.width = domVideo.style.height = "100%";
        domVideo.style.margin = "0";
        this.dom.appendChild(domVideo);

        createProperty("bool", this, "autoPlay");
        createProperty("enum", this, "fillMode");
        createProperty("int", this, "duration");
        createProperty("int", this, "position");
        createProperty("bool", this, "muted");
        createProperty("real", this, "playbackRate");
        createProperty("enum", this, "playbackState");
        createProperty("string", this, "source");
        createProperty("real", this, "volume");
        createProperty("enum", this, "status");
        createProperty("enum", this, "error");
        this.status = MediaPlayer.NoMedia;
        this.error = MediaPlayer.NoError;
        this.fillMode = VideoOutput.PreserveAspectFit;
        this.volume = domVideo.volume;
        this.duration = domVideo.duration;
        this.playbackState = MediaPlayer.StoppedState;
        this.muted = false;

        this.paused = Signal();
        this.playing = Signal();
        this.stopped = Signal();

        this.autoPlayChanged.connect(this, function (newVal) {
            domVideo.autoplay = newVal;
        }.bind(this));

        domVideo.addEventListener("play", function () {
            this.playing();
            this.playbackState = MediaPlayer.PlayingState;
        }.bind(this));

        domVideo.addEventListener("pause", function () {
            this.paused();
            this.playbackState = MediaPlayer.PausedState;
        }.bind(this));

        domVideo.addEventListener("timeupdate", function () {
            runningEventListener++;
            this.position = domVideo.currentTime * 1000;
            runningEventListener--;
        }.bind(this));

        domVideo.addEventListener("ended", function () {
            this.stopped();
            this.playbackState = MediaPlayer.StoppedState;
        }.bind(this));

        domVideo.addEventListener("progress", function () {
            if (domVideo.buffered.length > 0) {
                this.progress = domVideo.buffered.end(0) / domVideo.duration;
                this.status = this.progress < 1 ? MediaPlayer.Buffering : MediaPlayer.Buffered;
            }
        }.bind(this));

        domVideo.addEventListener("stalled", function () {
            this.status = MediaPlayer.Stalled;
        }.bind(this));

        domVideo.addEventListener("canplaythrough", function () {
            this.status = MediaPlayer.Buffered;
        }.bind(this));

        domVideo.addEventListener("loadstart", function () {
            this.status = MediaPlayer.Loading;
        }.bind(this));

        domVideo.addEventListener("durationchanged", function () {
            this.duration = domVideo.duration;
        }.bind(this));

        domVideo.addEventListener("volumechanged", function () {
            runningEventListener++;
            this.volume = demoVideo.volume;
            runningEventListener--;
        }.bind(this));

        domVideo.addEventListener("suspend", function () {
            this.error |= MediaPlayer.NetworkError;
        }.bind(this));

        domVideo.addEventListener("error", function () {
            this.error |= MediaPlayer.ResourceError;
        }.bind(this));

        domVideo.addEventListener("ratechange", function () {
            runningEventListener++;
            this.playbackRate = domVideo.playbackRate;
            runningEventListener--;
        }.bind(this));

        this.pause = function () {
            domVideo.pause();
        }.bind(this);

        this.play = function () {
            domVideo.play();
        }.bind(this);

        this.seek = function (offset) {
            domVideo.currentTime = offset * 1000;
        }.bind(this);

        this.stop = function () {}.bind(this);

        this.mimetypeFromExtension = function (extension) {
            var mimetypes = {
                ogg: 'video/ogg',
                ogv: 'video/ogg',
                ogm: 'video/ogg',
                mp4: 'video/mp4',
                webm: 'video/webm'
            };

            if (typeof mimetypes[extension] == 'undefined') return "";
            return mimetypes[extension];
        };

        this.sourceChanged.connect(this, function (source) {
            var parts = source.split('.');
            var extension = parts[parts.length - 1];

            domVideo.src = source;
            if (domVideo.canPlayType(this.mimetypeFromExtension(extension.toLowerCase())) == "") this.error |= MediaPlayer.FormatError;
        }.bind(this));

        this.positionChanged.connect(this, function (currentTime) {
            if (runningEventListener == 0) domVideo.currentTime = currentTime / 1000;
        }.bind(this));

        this.volumeChanged.connect(this, function (volume) {
            if (runningEventListener == 0) domVideo.volume = volume;
        }.bind(this));

        this.playbackRateChanged.connect(this, function (playbackRate) {
            if (runningEventListener == 0) domVideo.playbackRate = playbackRate;
        }.bind(this));

        this.mutedChanged.connect(this, function (newValue) {
            if (newValue == true) {
                volulmeBackup = domVideo.volume;
                this.volume = 0;
            } else {
                this.volume = volumeBackup;
            }
        }.bind(this));

        this.fillModeChanged.connect(this, function (newValue) {
            switch (newValue) {
                case VideoOutput.Stretch:
                    domVideo.style.objectFit = 'fill';
                    break;
                case VideoOutput.PreserveAspectFit:
                    domVideo.style.objectFit = '';
                    break;
                case VideoOutput.PreserveAspectCrop:
                    domVideo.style.objectFit = 'cover';
                    break;
            }
        }.bind(this));
    }
});

function QMLContext() {
    this.nameForObject = function (obj) {
        for (var name in this) {
            if (this[name] == obj) return name;
        }
    };
}

QMLComponent.getAttachedObject = function () {
    // static
    if (!this.$Component) {
        this.$Component = new QObject(this);
        this.$Component.completed = Signal([]);
        engine.completedSignals.push(this.$Component.completed);

        this.$Component.destruction = Signal([]);
    }
    return this.$Component;
};

QMLComponent.prototype.createObject = function (parent, properties, componentContext) {
    var oldState = engine.operationState;
    engine.operationState = QMLOperationState.Init;
    // change base path to current component base path
    var bp = engine.$basePath;engine.$basePath = this.$basePath ? this.$basePath : engine.$basePath;

    if (!componentContext) componentContext = this.$context;

    var item = construct({
        object: this.$metaObject,
        parent: parent,
        context: componentContext ? Object.create(componentContext) : new QMLContext(),
        isComponentRoot: true
    });

    // change base path back
    //TODO looks a bit hacky
    engine.$basePath = bp;

    engine.operationState = oldState;
    return item;
};

function QMLComponent(meta) {
    if (constructors[meta.object.$class] == QMLComponent) this.$metaObject = meta.object.$children[0];else this.$metaObject = meta.object;
    this.$context = meta.context;

    var jsImports = [];

    this.finalizeImports = function ($context) {
        for (var i = 0; i < jsImports.length; ++i) {
            var importDesc = jsImports[i];
            var src = importDesc[1];
            var js;

            if (typeof engine.$basePath != 'undefined') src = engine.$basePath + src;
            if (typeof qrc[src] != 'undefined') js = qrc[src];else {
                loadParser();
                js = qmlweb_jsparse(getUrlContents(src));
            }
            if (importDesc[3] !== "") {
                $context[importDesc[3]] = {};
                importJavascriptInContext(js, $context[importDesc[3]]);
            } else importJavascriptInContext(js, $context);
        }
    }.bind(this);

    if (meta.object.$imports instanceof Array) {
        var moduleImports = [];
        var loadImport = function (importDesc) {
            if (/\.js$/.test(importDesc[1])) jsImports.push(importDesc);else moduleImports.push(importDesc);
        }.bind(this);

        for (var i = 0; i < meta.object.$imports.length; ++i) {
            loadImport(meta.object.$imports[i]);
        }
        loadImports(this, moduleImports);
        if (typeof this.$context != 'undefined' && this.$context != null) this.finalizeImports(this.$context);
    }
}

registerQmlType({
    global: true,
    module: 'QtQml',
    name: 'Component',
    versions: /.*/,
    baseClass: 'QtObject',
    constructor: QMLComponent
});

// Base object for all qml elements
function QMLBaseObject(meta) {
    QObject.call(this, meta.parent);
    var i, prop;

    this.$isComponentRoot = meta.isComponentRoot;
    this.$context = meta.context;

    // Component get own properties
    var attributes = [];
    for (var key in meta.object) {
        if (meta.object.hasOwnProperty(key) && typeof meta.object[key] != 'undefined' && meta.object[key] != null && (meta.object[key].__proto__.constructor.name == 'QMLPropertyDefinition' || meta.object[key].__proto__.constructor.name == 'QMLAliasDefinition')) {
            attributes.push(key);
        }
    }

    this.Keys = new QObject(this);
    this.Keys.asteriskPresed = Signal();
    this.Keys.backPressed = Signal();
    this.Keys.backtabPressed = Signal();
    this.Keys.callPressed = Signal();
    this.Keys.cancelPressed = Signal();
    this.Keys.deletePressed = Signal();
    for (var i = 0; i < 10; ++i) {
        this.Keys['digit' + i + 'Pressed'] = Signal();
    }this.Keys.escapePressed = Signal();
    this.Keys.flipPressed = Signal();
    this.Keys.hangupPressed = Signal();
    this.Keys.leftPressed = Signal();
    this.Keys.menuPressed = Signal();
    this.Keys.noPressed = Signal();
    this.Keys.pressed = Signal();
    this.Keys.released = Signal();
    this.Keys.returnPressed = Signal();
    this.Keys.rightPressed = Signal();
    this.Keys.selectPressed = Signal();
    this.Keys.spacePressed = Signal();
    this.Keys.tabPressed = Signal();
    this.Keys.upPressed = Signal();
    this.Keys.volumeDownPressed = Signal();
    this.Keys.volumeUpPressed = Signal();
    this.Keys.yesPressed = Signal();

    this.getAttributes = function () {
        return attributes;
    };
}

registerQmlType({
    module: 'QtQml',
    name: 'QtObject',
    versions: /.*/,
    constructor: QMLBaseObject
});

registerQmlType({
    module: 'QtQml',
    name: 'Timer',
    versions: /.*/,
    baseClass: 'QtObject',
    constructor: function QMLTimer(meta) {
        callSuper(this, meta);
        var prevTrigger,
            self = this;

        createProperty("int", this, "interval", { interval: 1000 });
        createProperty("bool", this, "repeat");
        createProperty("bool", this, "running");
        createProperty("bool", this, "triggeredOnStart");

        // Create trigger as simple property. Reading the property triggers
        // the function!
        this.triggered = Signal();

        engine.$addTicker(ticker);
        function ticker(now, elapsed) {
            if (self.running) {
                if (now - prevTrigger >= self.interval) {
                    prevTrigger = now;
                    trigger();
                }
            }
        }

        /* This ensures that if the user toggles the "running" property manually,
         * the timer will trigger. */
        this.runningChanged.connect(this, function () {
            if (this.running) {
                prevTrigger = new Date().getTime();
                if (this.triggeredOnStart) {
                    trigger();
                }
            }
        });

        this.start = function () {
            this.running = true;
        };
        this.stop = function () {
            this.running = false;
        };
        this.restart = function () {
            this.stop();
            this.start();
        };

        function trigger() {
            if (!self.repeat)
                // We set the value directly in order to be able to emit the runningChanged
                // signal after triggered, like Qt does it.
                self.$properties.running.val = false;

            // Trigger this.
            self.triggered();

            if (!self.repeat)
                // Emit changed signal manually after setting the value manually above.
                self.runningChanged();
        }

        engine.$registerStart(function () {
            if (self.running) {
                self.running = false; // toggled back by self.start();
                self.start();
            }
        });

        engine.$registerStop(function () {
            self.stop();
        });
    }
});

function QMLButton(meta) {
    var _this = this;

    callSuper(this, meta);

    var button = this.impl = document.createElement('button');
    button.style.pointerEvents = 'auto';
    this.dom.appendChild(button);

    createProperty("string", this, "text");
    createProperty("bool", this, "enabled", { initialValue: true });
    this.clicked = Signal();

    this.Component.completed.connect(this, function () {
        this.implicitWidth = button.offsetWidth;
        this.implicitHeight = button.offsetHeight;
    });
    this.textChanged.connect(this, function (newVal) {
        button.textContent = newVal;
        //TODO: Replace those statically sized borders
        this.implicitWidth = button.offsetWidth;
        this.implicitHeight = button.offsetHeight;
    });
    this.enabledChanged.connect(this, function (newVal) {
        button.disabled = !newVal;
    });

    button.onclick = function () {
        _this.clicked();
    };
}

registerQmlType({
    module: 'QtQuick.Controls',
    name: 'Button',
    versions: /.*/,
    baseClass: 'QtQuick.Item',
    constructor: QMLButton
});

registerQmlType({
    module: 'QtQuick.Controls',
    name: 'CheckBox',
    versions: /.*/,
    baseClass: 'QtQuick.Item',
    constructor: function QMLCheckbox(meta) {
        callSuper(this, meta);

        var label = this.impl = document.createElement('label');
        label.style.pointerEvents = 'auto';

        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.style.verticalAlign = 'text-bottom';
        label.appendChild(checkbox);

        var span = document.createElement('span');
        label.appendChild(span);

        this.dom.appendChild(label);

        var self = this;

        var QMLFont = new getConstructor('QtQuick', '2.0', 'Font');
        this.font = new QMLFont(this);

        createProperty("string", this, "text");
        createProperty("bool", this, "checked");
        createProperty("color", this, "color");

        this.Component.completed.connect(this, function () {
            this.implicitHeight = label.offsetHeight;
            this.implicitWidth = label.offsetWidth > 0 ? label.offsetWidth + 4 : 0;
        });
        this.textChanged.connect(this, function (newVal) {
            span.innerHTML = newVal;
            this.implicitHeight = label.offsetHeight;
            this.implicitWidth = label.offsetWidth > 0 ? label.offsetWidth + 4 : 0;
        });
        this.colorChanged.connect(this, function (newVal) {
            span.style.color = QMLColor(newVal);
        });

        this.checkedChanged.connect(this, function (newVal) {
            checkbox.checked = self.checked;
        });

        checkbox.onchange = function () {
            self.checked = this.checked;
        };
    }
});

registerQmlType({
    module: 'QtQuick.Controls',
    name: 'ComboBox',
    versions: /.*/,
    baseClass: 'QtQuick.Item',
    constructor: QMLComboBox
});

function QMLComboBox(meta) {
    callSuper(this, meta);
    var self = this;

    this.dom.style.pointerEvents = "auto";
    this.name = "QMLComboBox";

    createProperty("int", this, "count");
    createProperty("int", this, "currentIndex");
    createProperty("string", this, "currentText");
    createProperty("array", this, "menu");
    createProperty("array", this, "model");
    createProperty("bool", this, "pressed");

    this.count = 0;
    this.currentIndex = 0;
    this.currentText = "";
    this.menu = [];
    this.model = [];
    this.pressed = false;

    var updateCB = function updateCB() {
        var head = "<select>";
        var tail = "</select>";
        var html = head;

        var model = self.model;
        var count = model.length;
        self.count = count;

        for (var i = 0; i < count; i++) {
            var elt = model[i];
            //if (elt instanceof Array) { // TODO - optgroups? update model !
            //    var count_i = elt.length;
            //    for (var j = 0; j < count_i; j++)
            //        html += "<option>" + elt[j] + "</option>";
            //}
            //else
            html += "<option>" + elt + "</option>";
        }
        html += tail;
        return html;
    };

    this.accepted = Signal();
    this.activated = Signal([{ type: "int", name: "index" }]);

    this.find = function (text) {
        return self.model.indexOf(text);
    };
    this.selectAll = function () {}; // TODO
    this.textAt = function (index) {
        return this.model[index];
    };

    this.Component.completed.connect(this, function () {
        this.dom.innerHTML = updateCB();
        var child = this.dom.firstChild;
        this.implicitWidth = child.offsetWidth;
        this.implicitHeight = child.offsetHeight;
    });

    this.modelChanged.connect(updateCB);

    this.dom.onclick = function (e) {
        var index = self.dom.firstChild.selectedIndex;
        self.currentIndex = index;
        self.currentText = self.model[index];
        self.accepted();
        self.activated(index);
    };
}

function QMLScrollView(meta) {
    callSuper(this, meta);

    var self = this;

    this.css.pointerEvents = "auto";
    this.setupFocusOnDom(this.dom);

    createProperty("Item", this, "contentItem");
    this.$defaultProperty = "contentItem";
    createProperty("Item", this, "flickableItem"); //TODO  0) implement it  1) make it read-only
    createProperty("Item", this, "viewport"); //TODO
    createProperty("bool", this, "frameVisible");
    createProperty("bool", this, "highlightOnFocus"); //TODO test
    createProperty("enum", this, "verticalScrollBarPolicy");
    createProperty("enum", this, "horizontalScrollBarPolicy");
    createProperty("Component", this, "style"); //TODO

    this.contentItemChanged.connect(this, function (newItem) {
        if ((typeof newItem === "undefined" ? "undefined" : _typeof(newItem)) !== undefined) {
            newItem.parent = self;
        }
    });
    this.flickableItemChanged.connect(this, function (newItem) {});
    this.viewportChanged.connect(this, function (newViewport) {});
    this.frameVisibleChanged.connect(this, function (visible) {
        this.css.border = visible ? "1px solid gray" : "hidden";
    });
    this.highlightOnFocusChanged.connect(this, function (highlight) {});

    this.horizontalScrollBarPolicyChanged.connect(this, function (newPolicy) {
        this.css.overflowX = this.scrollBarPolicyToCssOverflow(newPolicy);
    });
    this.verticalScrollBarPolicyChanged.connect(this, function (newPolicy) {
        this.css.overflowY = this.scrollBarPolicyToCssOverflow(newPolicy);
    });

    this.styleChanged.connect(this, function (newStyle) {});

    ////
    this.childrenChanged.connect(this, function () {
        if (_typeof(self.contentItem) == undefined && self.children.length == 1) {
            self.contentItem = self.children[0];
        }
    });
    this.focusChanged.connect(this, function (focus) {
        this.css.outline = self.highlight && focus ? "outline: lightblue solid 2px;" : "";
    });

    this.width = this.implicitWidth = 240; // default QML ScrollView width
    this.height = this.implicitHeight = 150; // default QML ScrollView height
    this.width = this.implicitWidth;
    this.height = this.implicitHeight;

    this.contentItem = undefined;
    this.flickableItem = undefined;
    this.viewport = undefined;
    this.frameVisible = false;
    this.highlightOnFocus = false;
    this.verticalScrollBarPolicy = Qt.ScrollBarAsNeeded;
    this.horizontalScrollBarPolicy = Qt.ScrollBarAsNeeded;
    this.style = undefined;
}

QMLScrollView.prototype.scrollBarPolicyToCssOverflow = function (policy) {
    switch (newPolicy) {
        case Qt.ScrollBarAsNeeded:
            return 'auto';
        case Qt.ScrollBarAlwaysOff:
            return 'hidden';
        case Qt.ScrollBarAlwaysOn:
            return 'scroll';
    }
    return 'auto';
};

registerQmlType({
    module: 'QtQuick.Controls',
    name: 'ScrollView',
    versions: /.*/,
    baseClass: 'QtQuick.Item',
    constructor: QMLScrollView
});

function QMLTextArea(meta) {
    callSuper(this, meta);
    var textarea = this.impl;
    textarea.style.padding = '5px';
    textarea.style.borderWidth = '1px';
    textarea.style.backgroundColor = '#fff';
}

registerQmlType({
    module: 'QtQuick.Controls',
    name: 'TextArea',
    versions: /.*/,
    baseClass: 'QtQuick.TextEdit',
    constructor: QMLTextArea
});

/**
 *
 * TextField is used to accept a line of text input.
 * Input constraints can be placed on a TextField item
 * (for example, through a validator or inputMask).
 * Setting echoMode to an appropriate value enables TextField
 * to be used for a password input field.
 *
 * Valid entries for echoMode and alignment are defined in TextInput.
 *
 */

registerQmlType({
    module: 'QtQuick.Controls',
    name: 'TextField',
    versions: /.*/,
    baseClass: 'QtQuick.Item',
    constructor: QMLTextInput
});

function QMLTextInput(meta) {
    callSuper(this, meta);

    var self = this;

    this.font = new getConstructor('QtQuick', '2.0', 'Font')(this);

    var input = this.impl = document.createElement('input');
    input.type = 'text';
    input.disabled = true;
    input.style.pointerEvents = "auto";
    input.style.margin = "0";
    input.style.width = "100%";
    this.dom.appendChild(input);

    this.setupFocusOnDom(input);

    createProperty("string", this, "text");
    createProperty("int", this, "maximumLength");
    createProperty("bool", this, "readOnly");
    createProperty("var", this, "validator");
    createProperty("enum", this, "echoMode");
    this.accepted = Signal();
    this.readOnly = false;
    this.maximumLength = -1;
    input.disabled = false;

    this.Component.completed.connect(this, function () {
        this.implicitWidth = input.offsetWidth;
        this.implicitHeight = input.offsetHeight;
    });

    this.textChanged.connect(this, function (newVal) {
        input.value = newVal;
    });

    this.echoModeChanged.connect(this, function (newVal) {
        switch (newVal) {
            case TextField.Normal:
                input.type = "text";
                break;
            case TextField.Password:
                input.type = "password";
                break;
        }
    }.bind(this));

    this.maximumLengthChanged.connect(this, function (newVal) {
        if (newVal < 0) newVal = null;
        input.maxLength = newVal;
    });

    this.readOnlyChanged.connect(this, function (newVal) {
        input.disabled = newVal;
    });

    this.Keys.pressed.connect(this, function (e) {
        if ((e.key === Qt.Key_Return || e.key === Qt.Key_Enter) && testValidator()) {
            self.accepted();
            e.accepted = true;
        }
    }.bind(this));

    function testValidator() {
        if (typeof self.validator !== 'undefined' && self.validator !== null) return self.validator.validate(self.text);
        return true;
    }

    function updateValue(e) {
        if (self.text !== self.dom.firstChild.value) {
            self.$canEditReadOnlyProperties = true;
            self.text = self.dom.firstChild.value;
            self.$canEditReadOnlyProperties = false;
        }
    }

    input.oninput = updateValue;
    input.onpropertychanged = updateValue;
}

registerQmlType({
    module: 'QtQuick.Window',
    name: 'Screen',
    versions: /.*/,
    baseClass: 'QtQuick.Item',
    constructor: QMLScreen
});

function QMLScreen(meta) {
    callSuper(this, meta);
    var self = this;

    // TODO: rewrite as an attached object and forbid constructing

    createProperty("int", this, "desktopAvailableHeight");
    createProperty("int", this, "desktopAvailableWidth");
    createProperty("real", this, "devicePixelRatio");
    createProperty("int", this, "height");
    createProperty("string", this, "name");
    createProperty("enum", this, "orientation");
    createProperty("enum", this, "orientationUpdateMask");
    createProperty("real", this, "pixelDensity");
    createProperty("enum", this, "primaryOrientation");
    createProperty("int", this, "width");

    this.Component.completed.connect(this, updateSC);

    function updateSC() {
        self.desktopAvailableHeight = window.outerHeight;
        self.desktopAvailableWidth = window.outerWidth;
        self.devicePixelRatio = window.devicePixelRatio;
        self.height = window.innerHeight;
        self.name = this.name;
        self.orientation = Qt.PrimaryOrientation;
        self.orientationUpdateMask = 0;
        self.pixelDensity = 100.0; // TODO
        self.primaryOrientation = Qt.PrimaryOrientation;
        self.width = window.innerWidth;
    }
}

registerQmlType({
    module: 'QtQuick',
    name: 'AnimatedImage',
    versions: /.*/,
    baseClass: 'Image',
    constructor: function QMLAnimatedImage(meta) {
        callSuper(this, meta);
    }
});

function QMLAnimation(meta) {
    callSuper(this, meta);

    // Exports
    this.Animation = {
        Infinite: -1
    };

    createProperty("bool", this, "alwaysRunToEnd");
    createProperty("int", this, "loops", { initialValue: 1 });
    createProperty("bool", this, "paused");
    createProperty("bool", this, "running");

    // Methods
    this.restart = function () {
        this.stop();
        this.start();
    };
    this.start = function () {
        this.running = true;
    };
    this.stop = function () {
        this.running = false;
    };
    this.pause = function () {
        this.paused = true;
    };
    this.resume = function () {
        this.paused = false;
    };

    // To be overridden
    this.complete = unboundMethod;
}

registerQmlType({
    module: 'QtQuick',
    name: 'Animation',
    versions: /.*/,
    baseClass: 'QtQml.QtObject',
    constructor: QMLAnimation
});

registerQmlType({
    module: 'QtQuick',
    name: 'Behavior',
    versions: /.*/,
    baseClass: 'QtQml.QtObject',
    constructor: function QMLBehavior(meta) {
        callSuper(this, meta);

        createProperty("Animation", this, "animation");
        this.$defaultProperty = "animation";
        createProperty("bool", this, "enabled", { initialValue: true });

        this.animationChanged.connect(this, function (newVal) {
            newVal.target = this.$parent;
            newVal.property = meta.object.$on;
            this.$parent.$properties[meta.object.$on].animation = newVal;
        });
        this.enabledChanged.connect(this, function (newVal) {
            this.$parent.$properties[meta.object.$on].animation = newVal ? this.animation : null;
        });
    }
});

registerQmlType({
    module: 'QtQuick',
    name: 'BorderImage',
    versions: /.*/,
    baseClass: 'Item',
    constructor: function QMLBorderImage(meta) {
        callSuper(this, meta);
        var self = this;

        this.BorderImage = {
            // tileMode
            Stretch: "stretch",
            Repeat: "repeat",
            Round: "round",
            // status
            Null: 1,
            Ready: 2,
            Loading: 3,
            Error: 4
        };

        createProperty("url", this, "source");
        createProperty("enum", this, "status", { initialValue: this.BorderImage.Null });
        this.border = new QObject(this);
        createProperty("int", this.border, "left");
        createProperty("int", this.border, "right");
        createProperty("int", this.border, "top");
        createProperty("int", this.border, "bottom");
        createProperty("enum", this, "horizontalTileMode", { initialValue: this.BorderImage.Stretch });
        createProperty("enum", this, "verticalTileMode", { initialValue: this.BorderImage.Stretch });

        this.sourceChanged.connect(this, function () {
            this.dom.style.borderImageSource = "url(" + engine.$resolvePath(this.source) + ")";
        });
        this.border.leftChanged.connect(this, updateBorder);
        this.border.rightChanged.connect(this, updateBorder);
        this.border.topChanged.connect(this, updateBorder);
        this.border.bottomChanged.connect(this, updateBorder);
        this.horizontalTileModeChanged.connect(this, updateBorder);
        this.verticalTileModeChanged.connect(this, updateBorder);

        function updateBorder() {
            this.dom.style.MozBorderImageSource = "url(" + engine.$resolvePath(this.source) + ")";
            this.dom.style.MozBorderImageSlice = this.border.top + " " + this.border.right + " " + this.border.bottom + " " + this.border.left + " " + "fill";
            this.dom.style.MozBorderImageRepeat = this.horizontalTileMode + " " + this.verticalTileMode;
            this.dom.style.MozBorderImageWidth = this.border.top + " " + this.border.right + " " + this.border.bottom + " " + this.border.left;

            this.dom.style.webkitBorderImageSource = "url(" + engine.$resolvePath(this.source) + ")";
            this.dom.style.webkitBorderImageSlice = this.border.top + " " + this.border.right + " " + this.border.bottom + " " + this.border.left + " " + "fill";
            this.dom.style.webkitBorderImageRepeat = this.horizontalTileMode + " " + this.verticalTileMode;
            this.dom.style.webkitBorderImageWidth = this.border.top + " " + this.border.right + " " + this.border.bottom + " " + this.border.left;

            this.dom.style.OBorderImageSource = "url(" + engine.$resolvePath(this.source) + ")";
            this.dom.style.OBorderImageSlice = this.border.top + " " + this.border.right + " " + this.border.bottom + " " + this.border.left + " " + "fill";
            this.dom.style.OBorderImageRepeat = this.horizontalTileMode + " " + this.verticalTileMode;
            this.dom.style.OBorderImageWidth = this.border.top + "px " + this.border.right + "px " + this.border.bottom + "px " + this.border.left + "px";

            this.dom.style.borderImageSlice = this.border.top + " " + this.border.right + " " + this.border.bottom + " " + this.border.left + " " + "fill";
            this.dom.style.borderImageRepeat = this.horizontalTileMode + " " + this.verticalTileMode;
            this.dom.style.borderImageWidth = this.border.top + "px " + this.border.right + "px " + this.border.bottom + "px " + this.border.left + "px";
        }
    }
});

// TODO
// Currently only a skeleton implementation

registerQmlType({
    module: 'QtQuick',
    name: 'Canvas',
    versions: /.*/,
    baseClass: 'Item',
    constructor: function constructor(meta) {
        callSuper(this, meta);

        var self = this;

        createProperty('bool', this, 'available');
        createProperty('var', this, 'canvasSize');
        createProperty('var', this, 'canvasWindow');
        createProperty('var', this, 'context');
        createProperty('string', this, 'contextType');
        createProperty('enum', this, 'renderStrategy');
        createProperty('enum', this, 'renderTarget');
        createProperty('var', this, 'tileSize');

        this.available = true;
        this.canvasSize = [0, 0];
        this.canvasWindow = [0, 0, 0, 0];
        this.context = {};
        this.contextType = "contextType";
        this.renderStrategy = 0;
        this.renderTarget = 0;
        this.tileSize = [0, 0];

        this.imageLoaded = Signal();
        this.paint = Signal([{ type: "var", name: "region" }]);
        this.painted = Signal();

        this.cancelRequestAnimationFrame = function (handle) {
            return false;
        };

        this.getContext = function (context_id) {
            var args = arguments.slice(1, arguments.length);
            return {};
        };

        this.isImageError = function (image) {
            return true;
        };

        this.isImageLoaded = function (image) {
            return false;
        };

        this.isImageLoading = function (image) {
            return false;
        };

        this.loadImage = function (image) {
            //loadImageAsync(image);
            if (this.isImageLoaded(image)) this.imageLoaded();
        };

        this.markDirty = function (area) {
            // if dirty
            this.paint(area);
        };

        this.requestAnimationFrame = function (callback) {
            return 0;
        };

        this.requestPaint = function () {};

        this.save = function (file_name) {
            return false;
        };

        this.toDataURL = function (mime_type) {
            return "";
        };

        this.unloadImage = function (image) {};
    }
});

function QMLColumn(meta) {
    callSuper(this, meta);
}

QMLColumn.prototype.layoutChildren = function () {
    var curPos = 0,
        maxWidth = 0;
    for (var i = 0; i < this.children.length; i++) {
        var child = this.children[i];
        if (!(child.visible && child.width && child.height)) continue;
        maxWidth = child.width > maxWidth ? child.width : maxWidth;

        child.y = curPos;
        curPos += child.height + this.spacing;
    }
    this.implicitWidth = maxWidth;
    this.implicitHeight = curPos - this.spacing; // We want no spacing at the bottom side
};

registerQmlType({
    module: 'QtQuick',
    name: 'Column',
    versions: /.*/,
    baseClass: 'Positioner',
    constructor: QMLColumn
});

global.DoubleValidator = {
    StandardNotation: 1, ScientificNotation: 2
};

registerQmlType({
    module: 'QtQuick',
    name: 'DoubleValidator',
    versions: /.*/,
    baseClass: 'Item',
    constructor: function QMLDoubleValidator(meta) {
        callSuper(this, meta);

        createProperty("real", this, "bottom");
        createProperty("real", this, "top");
        createProperty("int", this, "decimals");
        createProperty("enum", this, "notation");
        this.bottom = -Infinity;
        this.top = Infinity;
        this.decimals = 1000;
        this.notation = DoubleValidator.ScientificNotation;

        var standardRegExp = /^(-|\+)?\s*[0-9]+(\.[0-9]+)?$/;
        var scientificRegExp = /^(-|\+)?\s*[0-9]+(\.[0-9]+)?(E(-|\+)?[0-9]+)?$/;

        this.getRegExpForNotation = function (notation) {
            switch (notation) {
                case DoubleValidator.ScientificNotation:
                    return scientificRegExp;
                    break;
                case DoubleValidator.StandardNotation:
                    return standardRegExp;
                    break;
            }
            return null;
        }.bind(this);

        function getDecimalsForNumber(number) {
            if (Math.round(number) != number) {
                var str = '' + number;

                return (/\d*$/.exec(str)[0].length
                );
            }
            return 0;
        }

        this.validate = function (string) {
            var regExp = this.getRegExpForNotation(this.notation);
            var acceptable = regExp.test(string.trim());

            if (acceptable) {
                var value = parseFloat(string);

                acceptable = this.bottom <= value && this.top >= value;
                acceptable = acceptable && getDecimalsForNumber(value) <= this.decimals;
            }
            return acceptable;
        }.bind(this);
    }
});

function QMLFlow(meta) {
    callSuper(this, meta);

    this.Flow = {
        LeftToRight: 0,
        TopToBottom: 1
    };

    createProperty("enum", this, "flow", { initialValue: this.Flow.LeftToRight });
    createProperty("enum", this, "layoutDirection", { initialValue: 0 });

    this.flowChanged.connect(this, this.layoutChildren);
    this.layoutDirectionChanged.connect(this, this.layoutChildren);
    this.widthChanged.connect(this, this.layoutChildren);
    this.layoutChildren();
}

QMLFlow.prototype.layoutChildren = function () {
    var curHPos = 0,
        curVPos = 0,
        rowSize = 0;
    for (var i = 0; i < this.children.length; i++) {
        var child = this.children[i];
        if (!(child.visible && child.width && child.height)) continue;

        if (this.flow == this.Flow.LeftToRight) {
            if (curHPos + child.width > this.width) {
                curHPos = 0;
                curVPos += rowSize + this.spacing;
                rowSize = 0;
            }
            rowSize = child.height > rowSize ? child.height : rowSize;

            child.x = this.layoutDirection == 1 ? this.width - curHPos - child.width : curHPos;
            child.y = curVPos;
            curHPos += child.width + this.spacing;
        } else {
            if (curVPos + child.height > this.height) {
                curVPos = 0;
                curHPos += rowSize + this.spacing;
                rowSize = 0;
            }
            rowSize = child.width > rowSize ? child.width : rowSize;

            child.x = this.layoutDirection == 1 ? this.width - curHPos - child.width : curHPos;
            child.y = curVPos;
            curVPos += child.height + this.spacing;
        }
    }
    if (this.flow == 0) this.implicitHeight = curVPos + rowSize;else this.implicitWidth = curHPos + rowSize;
};

registerQmlType({
    module: 'QtQuick',
    name: 'Flow',
    versions: /.*/,
    baseClass: 'Positioner',
    constructor: QMLFlow
});

registerQmlType({
    module: 'QtQuick',
    name: 'Font',
    versions: /.*/,
    baseClass: 'QtQml.QtObject',
    constructor: function QMLFont(parent) {
        var _this2 = this;

        QObject.call(this);
        createProperty("bool", this, "bold");
        createProperty("enum", this, "capitalization", { initialValue: 0 });
        createProperty("string", this, "family", { initialValue: 'sans-serif' });
        createProperty("bool", this, "italic");
        createProperty("real", this, "letterSpacing");
        createProperty("int", this, "pixelSize", { initialValue: 13 });
        createProperty("real", this, "pointSize", { initialValue: 10 });
        createProperty("bool", this, "strikeout");
        createProperty("bool", this, "underline");
        createProperty("enum", this, "weight");
        createProperty("real", this, "wordSpacing");
        var sizeLock = false;

        this.boldChanged.connect(function (newVal) {
            parent.dom.firstChild.style.fontWeight = parent.font.weight !== undefined ? parent.font.weight : newVal ? "bold" : "normal";
        });
        this.capitalizationChanged.connect(function (newVal) {
            parent.dom.firstChild.style.fontVariant = newVal == "smallcaps" ? "small-caps" : "normal";
            newVal = newVal == "smallcaps" ? "none" : newVal;
            parent.dom.firstChild.style.textTransform = newVal;
        });
        this.familyChanged.connect(function (newVal) {
            parent.dom.firstChild.style.fontFamily = newVal;
        });
        this.italicChanged.connect(function (newVal) {
            parent.dom.firstChild.style.fontStyle = newVal ? "italic" : "normal";
        });
        this.letterSpacingChanged.connect(function (newVal) {
            parent.dom.firstChild.style.letterSpacing = newVal !== undefined ? newVal + "px" : "";
        });
        this.pixelSizeChanged.connect(function (newVal) {
            if (!sizeLock) {
                _this2.pointSize = newVal * 0.75;
            }
            var val = newVal + 'px';
            parent.dom.style.fontSize = val;
            parent.dom.firstChild.style.fontSize = val;
        });
        this.pointSizeChanged.connect(function (newVal) {
            sizeLock = true;
            _this2.pixelSize = Math.round(newVal / 0.75);
            sizeLock = false;
        });
        this.strikeoutChanged.connect(function (newVal) {
            parent.dom.firstChild.style.textDecoration = newVal ? "line-through" : parent.font.underline ? "underline" : "none";
        });
        this.underlineChanged.connect(function (newVal) {
            parent.dom.firstChild.style.textDecoration = parent.font.strikeout ? "line-through" : newVal ? "underline" : "none";
        });
        this.weightChanged.connect(function (newVal) {
            parent.dom.firstChild.style.fontWeight = newVal !== undefined ? newVal : parent.font.bold ? "bold" : "normal";
        });
        this.wordSpacingChanged.connect(function (newVal) {
            parent.dom.firstChild.style.wordSpacing = newVal !== undefined ? newVal + "px" : "";
        });
    }
});

registerQmlType({
    module: 'QtQuick',
    name: 'FontLoader',
    versions: /.*/,
    baseClass: 'QtQml.QtObject',
    constructor: function QMLFontLoader(meta) {
        callSuper(this, meta);

        // Exports.
        this.FontLoader = {
            // status
            Null: 0,
            Ready: 1,
            Loading: 2,
            Error: 3
        };

        createProperty("string", this, "name");
        createProperty("url", this, "source");
        createProperty("enum", this, "status");

        this.status = this.FontLoader.Null;

        var self = this,
            domStyle = document.createElement('style'),
            lastName = '',
            inTouchName = false;

        // Maximum timeout is the maximum time for a font to load. If font isn't loaded in this time, the status is set to Error.
        // For both cases (with and without FontLoader.js) if the font takes more than the maximum timeout to load,
        // dimensions recalculations for elements that are using this font will not be triggered or will have no effect.

        // FontLoader.js uses only the last timeout. The state and name properties are set immediately when the font loads.
        // If the font could not be loaded, the Error status will be set only when this timeout expires.
        // If the font loading takes more than the timeout, the name property is set, but the status is set to Error.

        // Fallback sets the font name immediately and touches it several times to trigger dimensions recalcuations.
        // The status is set to Error and should not be used.
        var timeouts = [20, 50, 100, 300, 500, 1000, 3000, 5000, 10000, 15000]; // 15 seconds maximum

        function cycleTouchName(fontName, i) {
            if (lastName !== fontName) return;
            if (i > 0) {
                var name = self.name;
                inTouchName = true;
                // Calling self.nameChanged() is not enough, we have to actually change the value to flush the bindings.
                self.name = 'sans-serif';
                self.name = name;
                inTouchName = false;
            }
            if (i < timeouts.length) {
                setTimeout(function () {
                    cycleTouchName(fontName, i + 1);
                }, timeouts[i] - (i > 0 ? timeouts[i - 1] : 0));
            }
        }

        function loadFont(fontName) {
            if (lastName === fontName || inTouchName) return;
            lastName = fontName;

            if (!fontName) {
                self.status = self.FontLoader.Null;
                return;
            }
            self.status = self.FontLoader.Loading;
            if (typeof FontLoader !== 'undefined') {
                var fontLoader = new FontLoader([fontName], {
                    "fontsLoaded": function fontsLoaded(error) {
                        if (error !== null) {
                            if (lastName === fontName && error.notLoadedFontFamilies[0] === fontName) {
                                self.name = fontName; // Set the name for the case of font loading after the timeout.
                                self.status = self.FontLoader.Error;
                            }
                        }
                    },
                    "fontLoaded": function fontLoaded(fontFamily) {
                        if (lastName === fontName && fontFamily == fontName) {
                            self.name = fontName;
                            self.status = self.FontLoader.Ready;
                        }
                    }
                }, timeouts[timeouts.length - 1]);
                FontLoader.testDiv = null; // Else I get problems loading multiple fonts (FontLoader.js bug?)
                fontLoader.loadFonts();
            } else {
                console.warn('FontLoader.js library is not loaded.\nYou should load https://github.com/smnh/FontLoader if you want to use QtQuick FontLoader elements.');
                self.status = self.FontLoader.Error; // You should not rely on 'status' property without FontLoader.js.
                self.name = fontName;
                cycleTouchName(fontName, 0);
            }
        }

        this.sourceChanged.connect(this, function (font_src) {
            var fontName = 'font_' + new Date().getTime().toString(36) + '_' + Math.round(Math.random() * 1e15).toString(36);
            domStyle.innerHTML = '@font-face { font-family: \'' + fontName + '\'; src: url(\'' + engine.$resolvePath(font_src) + '\'); }';
            document.getElementsByTagName('head')[0].appendChild(domStyle);
            loadFont(fontName);
        });

        this.nameChanged.connect(this, loadFont);
    }
});

registerQmlType({
    module: 'QtQuick',
    name: 'Grid',
    versions: /.*/,
    baseClass: 'Positioner',
    constructor: QMLGrid
});

function QMLGrid(meta) {
    callSuper(this, meta);

    this.Grid = {
        LeftToRight: 0,
        TopToBottom: 1
    };

    createProperty("int", this, "columns");
    createProperty("int", this, "rows");
    createProperty("enum", this, "flow", { initialValue: 0 });
    createProperty("enum", this, "layoutDirection", { initialValue: 0 });
    this.columnsChanged.connect(this, this.layoutChildren);
    this.rowsChanged.connect(this, this.layoutChildren);
    this.flowChanged.connect(this, this.layoutChildren);
    this.layoutDirectionChanged.connect(this, this.layoutChildren);
    this.layoutChildren();
}

QMLGrid.prototype.layoutChildren = function () {
    var visibleItems = [],
        r = 0,
        c = 0,
        colWidth = [],
        rowHeight = [],
        gridWidth = -this.spacing,
        gridHeight = -this.spacing,
        curHPos = 0,
        curVPos = 0;

    // How many items are actually visible?
    for (var i = 0; i < this.children.length; i++) {
        var child = this.children[i];
        if (child.visible && child.width && child.height) visibleItems.push(this.children[i]);
    }

    // How many rows and columns do we need?
    if (!this.columns && !this.rows) {
        c = 4;
        r = Math.ceil(visibleItems.length / 4);
    } else if (!this.columns) {
        r = this.rows;
        c = Math.ceil(visibleItems.length / r);
    } else {
        c = this.columns;
        r = Math.ceil(visibleItems.length / c);
    }

    // How big are the colums/rows?
    if (this.flow == 0) for (var i = 0; i < r; i++) {
        for (var j = 0; j < c; j++) {
            var item = visibleItems[i * c + j];
            if (!item) break;
            if (!colWidth[j] || item.width > colWidth[j]) colWidth[j] = item.width;
            if (!rowHeight[i] || item.height > rowHeight[i]) rowHeight[i] = item.height;
        }
    } else for (var i = 0; i < c; i++) {
        for (var j = 0; j < r; j++) {
            var item = visibleItems[i * r + j];
            if (!item) break;
            if (!rowHeight[j] || item.height > rowHeight[j]) rowHeight[j] = item.height;
            if (!colWidth[i] || item.width > colWidth[i]) colWidth[i] = item.width;
        }
    }

    for (var i in colWidth) {
        gridWidth += colWidth[i] + this.spacing;
    }for (var i in rowHeight) {
        gridHeight += rowHeight[i] + this.spacing;
    } // Do actual positioning
    // When layoutDirection is RightToLeft we need oposite order of coumns
    var step = this.layoutDirection == 1 ? -1 : 1,
        startingPoint = this.layoutDirection == 1 ? c - 1 : 0,
        endPoint = this.layoutDirection == 1 ? -1 : c;
    if (this.flow == 0) for (var i = 0; i < r; i++) {
        for (var j = startingPoint; j !== endPoint; j += step) {
            var item = visibleItems[i * c + j];
            if (!item) break;
            item.x = curHPos;
            item.y = curVPos;

            curHPos += colWidth[j] + this.spacing;
        }
        curVPos += rowHeight[i] + this.spacing;
        curHPos = 0;
    } else for (var i = startingPoint; i !== endPoint; i += step) {
        for (var j = 0; j < r; j++) {
            var item = visibleItems[i * r + j];
            if (!item) break;
            item.x = curHPos;
            item.y = curVPos;

            curVPos += rowHeight[j] + this.spacing;
        }
        curHPos += colWidth[i] + this.spacing;
        curVPos = 0;
    }

    this.implicitWidth = gridWidth;
    this.implicitHeight = gridHeight;
};

function QMLImage(meta) {
    callSuper(this, meta);
    var img = new Image(),
        self = this;

    // Exports.
    this.Image = {
        // fillMode
        Stretch: 1,
        PreserveAspectFit: 2,
        PreserveAspectCrop: 3,
        Tile: 4,
        TileVertically: 5,
        TileHorizontally: 6,
        // status
        Null: 1,
        Ready: 2,
        Loading: 3,
        Error: 4
    };

    // no-op properties
    createProperty("bool", this, "asynchronous", { initialValue: true });
    createProperty("bool", this, "cache", { initialValue: true });
    createProperty("bool", this, "smooth", { initialValue: true });

    createProperty("enum", this, "fillMode", { initialValue: this.Image.Stretch });
    createProperty("bool", this, "mirror");
    createProperty("real", this, "progress");
    createProperty("url", this, "source");
    createProperty("enum", this, "status", { initialValue: this.Image.Null });

    this.sourceSize = new QObject(this);

    createProperty("int", this.sourceSize, "width");
    createProperty("int", this.sourceSize, "height");

    var bg = this.impl = document.createElement('div');
    bg.style.pointerEvents = 'none';
    bg.style.height = '100%';
    this.dom.appendChild(bg);

    // Bind status to img element
    img.onload = function () {
        var w = img.naturalWidth;
        var h = img.naturalHeight;
        self.sourceSize.width = w;
        self.sourceSize.height = h;
        self.implicitWidth = w;
        self.implicitHeight = h;

        self.progress = 1;
        self.status = self.Image.Ready;
    };
    img.onerror = function () {
        self.status = self.Image.Error;
    };

    var updateFillMode = function updateFillMode(val) {
        if (typeof val == 'undefined') val = this.fillMode;
        switch (val) {
            default:
            case this.Image.Stretch:
                bg.style.backgroundRepeat = 'auto';
                bg.style.backgroundSize = '100% 100%';
                bg.style.backgroundPosition = 'auto';
                break;
            case this.Image.Tile:
                bg.style.backgroundRepeat = 'auto';
                bg.style.backgroundSize = 'auto';
                bg.style.backgroundPosition = 'auto';
                break;
            case this.Image.PreserveAspectFit:
                bg.style.backgroundRepeat = 'no-repeat';
                bg.style.backgroundSize = 'contain';
                bg.style.backgroundPosition = 'center';
                break;
            case this.Image.PreserveAspectCrop:
                bg.style.backgroundRepeat = 'no-repeat';
                bg.style.backgroundSize = 'cover';
                bg.style.backgroundPosition = 'center';
                break;
            case this.Image.TileVertically:
                bg.style.backgroundRepeat = 'repeat-y';
                bg.style.backgroundSize = '100% auto';
                bg.style.backgroundPosition = 'auto';
                break;
            case this.Image.TileHorizontally:
                bg.style.backgroundRepeat = 'repeat-x';
                bg.style.backgroundSize = 'auto 100%';
                bg.style.backgroundPosition = 'auto';
                break;
        }
    };
    updateFillMode = updateFillMode.bind(this);

    var updateMirroring = function (val) {
        var transformRule = 'scale(-1,1)';
        if (!val) {
            var index = this.transform.indexOf(transformRule);

            if (index >= 0) this.transform.splice(index, 1);
        } else this.transform.push(transformRule);
        this.$updateTransform();
    }.bind(this);

    this.sourceChanged.connect(this, function (val) {
        this.progress = 0;
        this.status = this.Image.Loading;
        bg.style.backgroundImage = "url('" + engine.$resolvePath(val) + "')";
        img.src = engine.$resolvePath(val);
        if (img.complete) this.status = this.Image.Ready;
        updateFillMode();
    });

    this.mirrorChanged.connect(this, updateMirroring);
    this.fillModeChanged.connect(this, updateFillMode);
}

registerQmlType({
    module: 'QtQuick',
    name: 'Image',
    versions: /.*/,
    baseClass: 'Item',
    constructor: QMLImage
});

registerQmlType({
    module: 'QtQuick',
    name: 'IntValidator',
    versions: /.*/,
    baseClass: 'Item',
    constructor: function QMLIntValidator(meta) {
        callSuper(this, meta);

        createProperty("int", this, "bottom");
        createProperty("int", this, "top");
        this.bottom = -2147483647;
        this.top = 2147483647;

        this.validate = function (string) {
            var regExp = /^(-|\+)?\s*[0-9]+$/;
            var acceptable = regExp.test(string.trim());

            if (acceptable) {
                var value = parseInt(string);

                acceptable = this.bottom <= value && this.top >= value;
            }
            return acceptable;
        }.bind(this);
    }
});

function QMLItem(meta) {
    callSuper(this, meta);
    var child, o, i;

    if (this.$parent === null) {
        // This is the root element. Initialize it.
        this.dom = engine.rootElement || document.body;
        this.dom.innerHTML = "";
        var self = this;
        this.dom.style.position = "relative"; // Needed to make absolute positioning work
        this.dom.style.top = "0";
        this.dom.style.left = "0";
        this.dom.style.overflow = "hidden"; // No QML stuff should stand out the root element
    } else {
            if (!this.dom) // Create a dom element for this item.
                this.dom = document.createElement("div");
            this.dom.style.position = "absolute";
        }
    this.dom.style.pointerEvents = "none";
    this.dom.className = meta.object.$class + (this.id ? " " + this.id : "");
    this.css = this.dom.style;
    this.impl = null; // Store the actually drawn element

    this.css.boxSizing = 'border-box';

    this.parentChanged.connect(this, function (newParent, oldParent) {
        if (oldParent) {
            oldParent.children.splice(oldParent.children.indexOf(this), 1);
            oldParent.childrenChanged();
            oldParent.dom.removeChild(this.dom);
        }
        if (newParent && newParent.children.indexOf(this) == -1) {
            newParent.children.push(this);
            newParent.childrenChanged();
        }
        if (newParent) newParent.dom.appendChild(this.dom);
    });
    this.parentChanged.connect(this, updateHGeometry);
    this.parentChanged.connect(this, updateVGeometry);
    this.dataChanged.connect(this, function (newData) {
        for (var i in newData) {
            var child = newData[i];
            if (child.hasOwnProperty("parent")) // Seems to be an Item. TODO: Use real inheritance and ask using instanceof.
                child.parent = this; // This will also add it to children.
            else this.resources.push(child);
        }
    });

    if (this.$isComponentRoot) createProperty("var", this, "activeFocus");

    this.xChanged.connect(this, updateHGeometry);
    this.yChanged.connect(this, updateVGeometry);
    this.widthChanged.connect(this, updateHGeometry);
    this.heightChanged.connect(this, updateVGeometry);
    this.implicitWidthChanged.connect(this, updateHGeometry);
    this.implicitHeightChanged.connect(this, updateVGeometry);

    this.setupFocusOnDom = function (element) {
        var updateFocus = function () {
            var hasFocus = document.activeElement == this.dom || document.activeElement == this.dom.firstChild;

            if (this.focus != hasFocus) this.focus = hasFocus;
        }.bind(this);
        element.addEventListener("focus", updateFocus);
        element.addEventListener("blur", updateFocus);
    }.bind(this);

    this.focusChanged.connect(this, function (newVal) {
        if (newVal == true) {
            if (this.dom.firstChild != null) this.dom.firstChild.focus();
            document.qmlFocus = this;
            this.$context.activeFocus = this;
        } else if (document.qmlFocus == this) {
            document.getElementsByTagName("BODY")[0].focus();
            document.qmlFocus = engine.rootContext().base;
            this.$context.activeFocus = null;
        }
    }.bind(this));

    this.$isUsingImplicitWidth = true;
    this.$isUsingImplicitHeight = true;

    this.anchors = new QObject(this);
    createProperty("var", this.anchors, "left");
    createProperty("var", this.anchors, "right");
    createProperty("var", this.anchors, "top");
    createProperty("var", this.anchors, "bottom");
    createProperty("var", this.anchors, "horizontalCenter");
    createProperty("var", this.anchors, "verticalCenter");
    createProperty("Item", this.anchors, "fill");
    createProperty("Item", this.anchors, "centerIn");
    createProperty("real", this.anchors, "margins");
    createProperty("real", this.anchors, "leftMargin");
    createProperty("real", this.anchors, "rightMargin");
    createProperty("real", this.anchors, "topMargin");
    createProperty("real", this.anchors, "bottomMargin");
    this.anchors.leftChanged.connect(this, updateHGeometry);
    this.anchors.rightChanged.connect(this, updateHGeometry);
    this.anchors.topChanged.connect(this, updateVGeometry);
    this.anchors.bottomChanged.connect(this, updateVGeometry);
    this.anchors.horizontalCenterChanged.connect(this, updateHGeometry);
    this.anchors.verticalCenterChanged.connect(this, updateVGeometry);
    this.anchors.fillChanged.connect(this, updateHGeometry);
    this.anchors.fillChanged.connect(this, updateVGeometry);
    this.anchors.centerInChanged.connect(this, updateHGeometry);
    this.anchors.centerInChanged.connect(this, updateVGeometry);
    this.anchors.leftMarginChanged.connect(this, updateHGeometry);
    this.anchors.rightMarginChanged.connect(this, updateHGeometry);
    this.anchors.topMarginChanged.connect(this, updateVGeometry);
    this.anchors.bottomMarginChanged.connect(this, updateVGeometry);
    this.anchors.marginsChanged.connect(this, updateHGeometry);
    this.anchors.marginsChanged.connect(this, updateVGeometry);

    // childrenRect property
    this.childrenRect = new QObject(this);
    createProperty("real", this.childrenRect, "x"); // TODO ro
    createProperty("real", this.childrenRect, "y"); // TODO ro
    createProperty("real", this.childrenRect, "width"); // TODO ro
    createProperty("real", this.childrenRect, "height"); // TODO ro

    this.stateChanged.connect(this, function (newVal, oldVal) {
        var oldState, newState, i, j, k;
        for (i = 0; i < this.states.length; i++) {
            if (this.states[i].name === newVal) newState = this.states[i];else if (this.states[i].name === oldVal) oldState = this.states[i];
        }var actions = this.$revertActions.slice();

        // Get current values for revert actions
        for (i in actions) {
            var action = actions[i];
            action.from = action.target[action.property];
        }
        if (newState) {
            var changes = newState.$getAllChanges();

            // Get all actions we need to do and create actions to revert them
            for (i = 0; i < changes.length; i++) {
                var change = changes[i];

                for (j = 0; j < change.$actions.length; j++) {
                    var item = change.$actions[j];

                    var action = {
                        target: change.target,
                        property: item.property,
                        origValue: change.target.$properties[item.property].binding || change.target.$properties[item.property].val,
                        value: item.value,
                        from: change.target[item.property],
                        to: undefined,
                        explicit: change.explicit
                    };
                    var found = false;
                    for (k in actions) {
                        if (actions[k].target == action.target && actions[k].property == action.property) {
                            found = true;
                            actions[k] = action;
                            break;
                        }
                    }if (!found) actions.push(action);

                    // Look for existing revert action, else create it
                    var found = false;
                    for (k = 0; k < this.$revertActions.length; k++) {
                        if (this.$revertActions[k].target == change.target && this.$revertActions[k].property == item.property) {
                            if (!change.restoreEntryValues) this.$revertActions.splice(k, 1); // We don't want to revert, so remove it
                            found = true;
                            break;
                        }
                    }if (!found && change.restoreEntryValues) this.$revertActions.push({
                        target: change.target,
                        property: item.property,
                        value: change.target.$properties[item.property].binding || change.target.$properties[item.property].val,
                        from: undefined,
                        to: change.target[item.property]
                    });
                }
            }
        }

        // Set all property changes and fetch the actual values afterwards
        // The latter is needed for transitions. We need to set all properties
        // before we fetch the values because properties can be interdependent.
        for (i in actions) {
            var action = actions[i];
            action.target.$properties[action.property].set(action.value, QMLProperty.ReasonUser, action.target, newState ? newState.$context : action.target.$context);
        }
        for (i in actions) {
            var action = actions[i];
            action.to = action.target[action.property];
            if (action.explicit) {
                action.target[action.property] = action.target[action.property]; //Remove binding
                action.value = action.target[action.property];
            }
        }

        // Find the best transition to use
        var transition,
            rating = 0;
        for (var i = 0; i < this.transitions.length; i++) {
            this.transitions[i].$stop(); // We need to stop running transitions, so let's do
            // it while iterating through the transitions anyway
            var curTransition = this.transitions[i],
                curRating = 0;
            if (curTransition.from == oldVal || curTransition.reversible && curTransition.from == newVal) curRating += 2;else if (curTransition.from == "*") curRating++;else continue;
            if (curTransition.to == newVal || curTransition.reversible && curTransition.to == oldVal) curRating += 2;else if (curTransition.to == "*") curRating++;else continue;
            if (curRating > rating) {
                rating = curRating;
                transition = curTransition;
            }
        }
        if (transition) transition.$start(actions);
    });

    var QMLRotation = getConstructor('QtQuick', '2.0', 'Rotation');
    var QMLScale = getConstructor('QtQuick', '2.0', 'Scale');
    var QMLTranslate = getConstructor('QtQuick', '2.0', 'Translate');

    this.$updateTransform = function () {
        var transform = "rotate(" + this.rotation + "deg) scale(" + this.scale + ")";
        var filter = "";
        var transformStyle = "preserve-3d";

        for (var i = 0; i < this.transform.length; i++) {
            var t = this.transform[i];
            if (t instanceof QMLRotation) transform += " rotate3d(" + t.axis.x + ", " + t.axis.y + ", " + t.axis.z + ", " + t.angle + "deg)";else if (t instanceof QMLScale) transform += " scale(" + t.xScale + ", " + t.yScale + ")";else if (t instanceof QMLTranslate) transform += " translate(" + t.x + "px, " + t.y + "px)";else if (typeof t.transformType != 'undefined') {
                if (t.transformType == 'filter') filter += t.operation + '(' + t.parameters + ') ';
            } else if (typeof t == 'string') transform += t;
        }
        if (typeof this.z == "number") transform += " translate3d(0, 0, " + this.z + "px)";
        this.dom.style.transform = transform;
        this.dom.style.transformStyle = transformStyle;
        this.dom.style.MozTransform = transform; // Firefox
        this.dom.style.webkitTransform = transform; // Chrome, Safari and Opera
        this.dom.style.webkitTransformStyle = transformStyle;
        this.dom.style.OTransform = transform; // Opera
        this.dom.style.msTransform = transform; // IE
        this.dom.style.filter = filter;
        this.dom.style.msFilter = filter; // IE
        this.dom.style.webkitFilter = filter; // Chrome, Safari and Opera
        this.dom.style.MozFilter = filter; // Firefox
    };
    this.rotationChanged.connect(this, this.$updateTransform);
    this.scaleChanged.connect(this, this.$updateTransform);
    this.transformChanged.connect(this, this.$updateTransform);
    this.visibleChanged.connect(this, function (newVal) {
        this.css.visibility = newVal ? "inherit" : "hidden";
    });
    this.clipChanged.connect(this, function (newVal) {
        this.css.overflow = newVal ? "hidden" : "visible";
    });
    this.zChanged.connect(this, function (newVal) {
        this.$updateTransform();
    });
    this.xChanged.connect(this, function (newVal) {
        this.css.left = newVal + "px";
    });
    this.yChanged.connect(this, function (newVal) {
        this.css.top = newVal + "px";
    });
    this.widthChanged.connect(this, function (newVal) {
        this.css.width = newVal ? newVal + "px" : "auto";
    });
    this.heightChanged.connect(this, function (newVal) {
        this.css.height = newVal ? newVal + "px" : "auto";
    });

    this.Component.completed.connect(this, this.$calculateOpacity);
    this.opacityChanged.connect(this, this.$calculateOpacity);
    if (this.$parent) {
        this.$parent.$opacityChanged.connect(this, this.$calculateOpacity);
    }

    this.spacing = 0;
    this.$revertActions = [];
    this.css.left = this.x + 'px';
    this.css.top = this.y + 'px';

    // Init size of root element
    if (this.$parent === null) {
        if (engine.rootElement == undefined) {
            // Case 1: Qml scene is placed in body tag

            // event handling by addEventListener is probably better than setting window.onresize
            var updateQmlGeometry = function updateQmlGeometry() {
                self.implicitHeight = window.innerHeight;
                self.implicitWidth = window.innerWidth;
            };
            window.addEventListener("resize", updateQmlGeometry);
            updateQmlGeometry();
        } else {
            // Case 2: Qml scene is placed in some element tag

            // we have to call `self.implicitHeight =` and `self.implicitWidth =`
            // each time the rootElement changes it's geometry
            // to reposition child elements of qml scene

            // it is good to have this as named method of dom element, so we can call it
            // from outside too, whenever element changes it's geometry (not only on window resize)
            this.dom.updateQmlGeometry = function () {
                self.implicitHeight = self.dom.offsetHeight;
                self.implicitWidth = self.dom.offsetWidth;
            };
            window.addEventListener("resize", this.dom.updateQmlGeometry);
            this.dom.updateQmlGeometry();
        }
    }
}

QMLItem.prototype.$calculateOpacity = function () {
    // TODO: reset all opacity on layer.enabled changed
    if (false) {
        // TODO: check layer.enabled
        this.css.opacity = this.opacity;
    }
    var parentOpacity = this.$parent && this.$parent.$opacity || 1;
    this.$opacity = this.opacity * parentOpacity;
    if (this.impl) {
        this.impl.style.opacity = this.$opacity;
    }
};

registerQmlType({
    module: 'QtQuick',
    name: 'Item',
    versions: /.*/,
    baseClass: 'QtQml.QtObject',
    properties: {
        $opacity: { type: 'real', initialValue: 1 },
        parent: 'Item',
        state: 'string',
        states: 'list',
        transitions: 'list',
        data: 'list',
        children: 'list',
        resources: 'list',
        transform: 'list',
        x: 'real',
        y: 'real',
        z: 'real',
        width: 'real',
        height: 'real',
        implicitWidth: 'real',
        implicitHeight: 'real',
        left: 'real',
        right: 'real',
        top: 'real',
        bottom: 'real',
        horizontalCenter: 'real',
        verticalCenter: 'real',
        rotation: 'real',
        scale: { type: 'real', initialValue: 1 },
        opacity: { type: 'real', initialValue: 1 },
        visible: { type: 'bool', initialValue: true },
        clip: 'bool',
        focus: 'bool'
    },
    defaultProperty: 'data',
    constructor: QMLItem
});

registerQmlType({
    module: 'QtQuick',
    name: 'ListElement',
    versions: /.*/,
    baseClass: 'QtQml.QtObject',
    constructor: function QMLListElement(meta) {
        callSuper(this, meta);

        for (var i in meta.object) {
            if (i[0] != "$") {
                createProperty("variant", this, i);
            }
        }
        applyProperties(meta.object, this, this, this.$context);
    }
});

registerQmlType({
    module: 'QtQuick',
    name: 'ListModel',
    versions: /.*/,
    baseClass: 'QtQml.QtObject',
    constructor: function QMLListModel(meta) {
        callSuper(this, meta);
        var self = this,
            firstItem = true;
        var QMLListElement = getConstructor('QtQuick', '2.0', 'ListElement');

        createProperty("int", this, "count");
        createProperty("list", this, "$items");
        this.$defaultProperty = "$items";
        this.$model = new JSItemModel();

        this.$itemsChanged.connect(this, function (newVal) {
            this.count = this.$items.length;
            if (firstItem && newVal.length > 0) {
                firstItem = false;
                var roleNames = [];
                var dict = newVal[0];
                for (var i in dict instanceof QMLListElement ? dict.$properties : dict) {
                    if (i != "index") roleNames.push(i);
                }
                this.$model.setRoleNames(roleNames);
            }
        });

        this.$model.data = function (index, role) {
            return self.$items[index][role];
        };
        this.$model.rowCount = function () {
            return self.$items.length;
        };

        this.append = function (dict) {
            var index = this.$items.length;
            var c = 0;

            if (dict instanceof Array) {
                for (var key in dict) {
                    this.$items.push(dict[key]);
                    c++;
                }
            } else {
                this.$items.push(dict);
                c = 1;
            }

            this.$itemsChanged(this.$items);
            this.$model.rowsInserted(index, index + c);
        };
        this.clear = function () {
            this.$model.modelReset();
            this.$items.length = 0;
            this.count = 0;
        };
        this.get = function (index) {
            return this.$items[index];
        };
        this.insert = function (index, dict) {
            this.$items.splice(index, 0, dict);
            this.$itemsChanged(this.$items);
            this.$model.rowsInserted(index, index + 1);
        };
        this.move = function (from, to, n) {
            var vals = this.$items.splice(from, n);
            for (var i = 0; i < vals.length; i++) {
                this.$items.splice(to + i, 0, vals[i]);
            }
            this.$model.rowsMoved(from, from + n, to);
        };
        this.remove = function (index) {
            this.$items.splice(index, 1);
            this.$model.rowsRemoved(index, index + 1);
            this.count = this.$items.length;
        };
        this.set = function (index, dict) {
            this.$items[index] = dict;
            this.$model.dataChanged(index, index);
        };
        this.setProperty = function (index, property, value) {
            this.$items[index][property] = value;
        };
    }
});

registerQmlType({
    module: 'QtQuick',
    name: 'ListView',
    versions: /.*/,
    baseClass: 'Repeater',
    constructor: function QMLListView(meta) {
        callSuper(this, meta);
        var self = this;

        createProperty("enum", this, "orientation");
        createProperty("real", this, "spacing");

        this.container = function () {
            return self;
        };
        this.modelChanged.connect(styleChanged);
        this.delegateChanged.connect(styleChanged);
        this.orientationChanged.connect(styleChanged);
        this.spacingChanged.connect(styleChanged);

        this._childrenInserted.connect(applyStyleOnItem);

        function applyStyleOnItem($item) {
            $item.dom.style.position = 'initial';
            if (self.orientation == Qt.Horizontal) {
                $item.dom.style.display = 'inline-block';
                if ($item != self.$items[0]) $item.dom.style["margin-left"] = self.spacing + "px";
            } else {
                $item.dom.style.display = 'block';
                if ($item != self.$items[0]) $item.dom.style["margin-top"] = self.spacing + "px";
            }
        }

        function styleChanged() {
            for (var i = 0; i < self.$items.length; ++i) {
                applyStyleOnItem(self.$items[i]);
            }
        }
    }
});

registerQmlType({
    module: 'QtQuick',
    name: 'Loader',
    versions: /.*/,
    baseClass: 'Item',
    constructor: function constructor(meta) {
        var _this3 = this;

        callSuper(this, meta);

        createProperty('bool', this, 'active', { initialValue: true });
        createProperty('bool', this, 'asynchronous');
        createProperty('var', this, 'item');
        createProperty('real', this, 'progress');
        createProperty('url', this, 'source');
        createProperty('Component', this, 'sourceComponent');
        createProperty('enum', this, 'status', { initialValue: 1 });

        var sourceUrl = '';

        this.loaded = Signal();

        this.activeChanged.connect(function () {
            if (!_this3.active) {
                unload();
                return;
            }
            if (_this3.source) {
                sourceChanged();
            } else if (_this3.sourceComponent) {
                sourceComponentChanged();
            }
        });

        this.sourceChanged.connect(function (newVal) {
            // if (newVal == sourceUrl && this.item !== undefined) return // TODO
            if (!_this3.active) {
                return;
            }

            unload();

            // TODO: we require '.qml' for now, that should be fixed
            if (newVal.length <= 4) {
                // 0
                return;
            }
            if (newVal.substr(newVal.length - 4, 4) !== '.qml') {
                return;
            }
            var fileName = newVal.substring(0, newVal.length - 4);

            var tree = engine.loadComponent(fileName);
            var meta = { object: tree, context: _this3, parent: _this3 };
            var qmlComponent = new QMLComponent(meta);
            var loadedComponent = createComponentObject(qmlComponent, _this3);
            _this3.sourceComponent = loadedComponent;
            sourceUrl = newVal;
        });

        this.sourceComponentChanged.connect(function (newItem) {
            if (!_this3.active) {
                return;
            }

            unload();

            var qmlComponent = newItem;

            if (newItem instanceof QMLComponent) {
                var meta = { object: newItem.$metaObject, context: _this3, parent: _this3 };
                qmlComponent = construct(meta);
            }

            qmlComponent.parent = _this3;
            _this3.item = qmlComponent;

            updateGeometry();

            if (_this3.item) {
                _this3.loaded();
            }
        });

        function createComponentObject(qmlComponent, parent) {
            var newComponent = qmlComponent.createObject(parent);

            newComponent.parent = parent;
            qmlComponent.finalizeImports();

            if (engine.operationState !== QMLOperationState.Init) {
                // We don't call those on first creation, as they will be called
                // by the regular creation-procedures at the right time.
                engine.$initializePropertyBindings();
                callOnCompleted(newComponent);
            }

            return newComponent;
        }

        var updateGeometry = function updateGeometry() {
            // Loader size doesn't exist
            if (!_this3.width) {
                _this3.width = _this3.item ? _this3.item.width : 0;
            } else if (_this3.item) {
                // Loader size exists
                _this3.item.width = _this3.width;
            }

            if (!_this3.height) {
                _this3.height = _this3.item ? _this3.item.height : 0;
            } else if (_this3.item) {
                // Loader size exists
                _this3.item.height = _this3.height;
            }
        };
        this.widthChanged.connect(updateGeometry);
        this.heightChanged.connect(updateGeometry);

        var unload = function unload() {
            if (_this3.item) {
                _this3.item.$delete();
                _this3.item.parent = undefined;
                _this3.item = undefined;
            }
        };

        function callOnCompleted(child) {
            child.Component.completed();
            child.children.forEach(callOnCompleted);
        }

        this.setSource = function (url, options) {
            sourceUrl = url;
            this.props = options;
            this.source = url;
        };
    }
});

registerQmlType({
    module: 'QtQuick',
    name: 'MouseArea',
    versions: /.*/,
    baseClass: 'Item',
    constructor: function QMLMouseArea(meta) {
        callSuper(this, meta);
        var self = this;

        this.dom.style.pointerEvents = "all";

        // IE does not handle mouse clicks to transparent divs, so we have
        // to set a background color and make it invisible using opacity
        // as that doesn't affect the mouse handling.
        this.dom.style.backgroundColor = "white";
        this.dom.style.opacity = 0;

        createProperty("variant", this, "acceptedButtons", { initialValue: Qt.LeftButton });
        createProperty("bool", this, "enabled", { initialValue: true });
        createProperty("bool", this, "hoverEnabled");
        createProperty("real", this, "mouseX");
        createProperty("real", this, "mouseY");
        createProperty("bool", this, "pressed");
        createProperty("bool", this, "containsMouse");
        createProperty("variant", this, "pressedButtons", { initialValue: 0 });
        createProperty("enum", this, "cursorShape", { initialValue: Qt.ArrowCursor });

        this.clicked = Signal([{ type: "variant", name: "mouse" }]);
        this.entered = Signal();
        this.exited = Signal();
        this.positionChanged = Signal([{ type: "variant", name: "mouse" }]);

        function eventToMouse(e) {
            return {
                accepted: true,
                button: e.button == 0 ? Qt.LeftButton : e.button == 1 ? Qt.MiddleButton : e.button == 2 ? Qt.RightButton : 0,
                modifiers: e.ctrlKey * Qt.CtrlModifier | e.altKey * Qt.AltModifier | e.shiftKey * Qt.ShiftModifier | e.metaKey * Qt.MetaModifier,
                x: e.offsetX || e.layerX,
                y: e.offsetY || e.layerY
            };
        }
        function handleClick(e) {
            var mouse = eventToMouse(e);

            if (self.enabled && self.acceptedButtons & mouse.button) {
                self.clicked(mouse);
            }
            // This decides whether to show the browser's context menu on right click or not
            return !(self.acceptedButtons & Qt.RightButton);
        }
        this.dom.onclick = handleClick;
        this.dom.oncontextmenu = handleClick;
        this.dom.onmousedown = function (e) {
            if (self.enabled) {
                var mouse = eventToMouse(e);
                self.mouseX = mouse.x;
                self.mouseY = mouse.y;
                self.pressed = true;
            }
            self.pressedButtons = mouse.button;
        };
        this.dom.onmouseup = function (e) {
            self.pressed = false;
            self.pressedButtons = 0;
        };
        this.dom.onmouseover = function (e) {
            self.containsMouse = true;
            self.entered();
        };
        this.dom.onmouseout = function (e) {
            self.containsMouse = false;
            self.exited();
        };
        this.dom.onmousemove = function (e) {
            if (self.enabled && (self.hoverEnabled || self.pressed)) {
                var mouse = eventToMouse(e);
                self.positionChanged(mouse);
                self.mouseX = mouse.x;
                self.mouseY = mouse.y;
            }
        };

        function cursorShapeToCSS() {
            switch (self.cursorShape) {
                case Qt.ArrowCursor:
                    return 'default';
                case Qt.UpArrowCursor:
                    return 'n-resize';
                case Qt.CrossCursor:
                    return 'crosshair';
                case Qt.WaitCursor:
                    return 'wait';
                case Qt.IBeamCursor:
                    return 'text';
                case Qt.SizeVerCursor:
                    return 'ew-resize';
                case Qt.SizeHorCursor:
                    return 'ns-resize';
                case Qt.SizeBDiagCursor:
                    return 'nesw-resize';
                case Qt.SizeFDiagCursor:
                    return 'nwse-resize';
                case Qt.SizeAllCursor:
                    return 'all-scroll';
                case Qt.BlankCursor:
                    return 'none';
                case Qt.SplitVCursor:
                    return 'row-resize';
                case Qt.SplitHCursor:
                    return 'col-resize';
                case Qt.PointingHandCursor:
                    return 'pointer';
                case Qt.ForbiddenCursor:
                    return 'not-allowed';
                case Qt.WhatsThisCursor:
                    return 'help';
                case Qt.BusyCursor:
                    return 'progress';
                case Qt.OpenHandCursor:
                    return 'grab';
                case Qt.ClosedHandCursor:
                    return 'grabbing';
                case Qt.DragCopyCursor:
                    return 'copy';
                case Qt.DragMoveCursor:
                    return 'move';
                case Qt.DragLinkCursor:
                    return 'alias';
                //case Qt.BitmapCursor: return 'auto';
                //case Qt.CustomCursor: return 'auto';
            }
            return 'auto';
        }

        this.cursorShapeChanged.connect(function () {
            self.dom.style.cursor = cursorShapeToCSS();
        });
    }
});

registerQmlType({
    module: 'QtQuick',
    name: 'NumberAnimation',
    versions: /.*/,
    baseClass: 'PropertyAnimation',
    constructor: function QMLNumberAnimation(meta) {
        callSuper(this, meta);
        var at = 0,
            loop = 0,
            self = this;

        engine.$addTicker(ticker);

        function ticker(now, elapsed) {
            if ((self.running || loop === -1) && !self.paused) {
                // loop === -1 is a marker to just finish this run
                if (at == 0 && loop == 0 && !self.$actions.length) self.$redoActions();
                at += elapsed / self.duration;
                if (at >= 1) self.complete();else for (var i in self.$actions) {
                    var action = self.$actions[i],
                        value = self.easing.$valueForProgress(at) * (action.to - action.from) + action.from;
                    action.target.$properties[action.property].set(value, QMLProperty.ReasonAnimation);
                }
            }
        }

        function startLoop() {
            for (var i in this.$actions) {
                var action = this.$actions[i];
                action.from = action.from !== undefined ? action.from : action.target[action.property];
            }
            at = 0;
        }

        this.runningChanged.connect(this, function (newVal) {
            if (newVal) {
                startLoop.call(this);
                this.paused = false;
            } else if (this.alwaysRunToEnd && at < 1) {
                loop = -1; // -1 is used as a marker to stop
            } else {
                    loop = 0;
                    this.$actions = [];
                }
        });

        this.complete = function () {
            for (var i in this.$actions) {
                var action = this.$actions[i];
                action.target.$properties[action.property].set(action.to, QMLProperty.ReasonAnimation);
            }

            if (++loop == this.loops) this.running = false;else if (!this.running) this.$actions = [];else startLoop.call(this);
        };
    }
});

registerQmlType({
    module: 'QtQuick',
    name: 'ParallelAnimation',
    versions: /.*/,
    baseClass: 'Animation',
    constructor: function QMLParallelAnimation(meta) {
        callSuper(this, meta);
        var curIndex, passedLoops, i;

        this.Animation = { Infinite: Math.Infinite };
        createProperty("list", this, "animations");
        this.$defaultProperty = "animations";
        this.$runningAnimations = 0;

        this.animationsChanged.connect(this, function () {
            for (i = 0; i < this.animations.length; i++) {
                if (!this.animations[i].runningChanged.isConnected(this, animationFinished)) this.animations[i].runningChanged.connect(this, animationFinished);
            }
        });

        function animationFinished(newVal) {
            this.$runningAnimations += newVal ? 1 : -1;
            if (this.$runningAnimations === 0) this.running = false;
        }

        this.start = function () {
            if (!this.running) {
                this.running = true;
                for (i = 0; i < this.animations.length; i++) {
                    this.animations[i].start();
                }
            }
        };
        this.stop = function () {
            if (this.running) {
                for (i = 0; i < this.animations.length; i++) {
                    this.animations[i].stop();
                }this.running = false;
            }
        };
        this.complete = this.stop;

        engine.$registerStart(function () {
            if (self.running) {
                self.running = false; // toggled back by start();
                self.start();
            }
        });
        engine.$registerStop(function () {
            self.stop();
        });
    }
});

function QMLPositioner(meta) {
    callSuper(this, meta);

    createProperty("int", this, "spacing");
    this.spacingChanged.connect(this, this.layoutChildren);
    this.childrenChanged.connect(this, this.layoutChildren);
    this.childrenChanged.connect(this, QMLPositioner.slotChildrenChanged);

    this.layoutChildren();
}

QMLPositioner.slotChildrenChanged = function () {
    for (var i = 0; i < this.children.length; i++) {
        var child = this.children[i];
        if (!child.widthChanged.isConnected(this, this.layoutChildren)) child.widthChanged.connect(this, this.layoutChildren);
        if (!child.heightChanged.isConnected(this, this.layoutChildren)) child.heightChanged.connect(this, this.layoutChildren);
        if (!child.visibleChanged.isConnected(this, this.layoutChildren)) child.visibleChanged.connect(this, this.layoutChildren);
    }
};

registerQmlType({
    module: 'QtQuick',
    name: 'Positioner',
    versions: /.*/,
    baseClass: 'Item',
    constructor: QMLPositioner
});

registerQmlType({
    module: 'QtQuick',
    name: 'PropertyAnimation',
    versions: /.*/,
    baseClass: 'Animation',
    constructor: function QMLPropertyAnimation(meta) {
        callSuper(this, meta);

        createProperty("int", this, "duration", { initialValue: 250 });
        createProperty("real", this, "from");
        createProperty("string", this, "properties");
        createProperty("string", this, "property");
        createProperty("QtObject", this, "target");
        createProperty("list", this, "targets");
        createProperty("real", this, "to");

        this.easing = new QObject(this);
        createProperty("enum", this.easing, "type", { initialValue: Easing.Linear });
        createProperty("real", this.easing, "amplitude", { initialValue: 1 });
        createProperty("real", this.easing, "overshoot", { initialValue: 0.3 });
        createProperty("real", this.easing, "period", { initialValue: 1.70158 });

        this.easing.$valueForProgress = function (t) {
            switch (this.type) {
                // Quad
                case Easing.InQuad:
                    return Math.pow(t, 2);
                case Easing.OutQuad:
                    return -Math.pow(t - 1, 2) + 1;
                case Easing.InOutQuad:
                    if (t < 0.5) return 2 * Math.pow(t, 2);
                    return -2 * Math.pow(t - 1, 2) + 1;
                case Easing.OutInQuad:
                    if (t < 0.5) return -2 * Math.pow(t - 0.5, 2) + 0.5;
                    return 2 * Math.pow(t - 0.5, 2) + 0.5;
                // Cubic
                case Easing.InCubic:
                    return Math.pow(t, 3);
                case Easing.OutCubic:
                    return Math.pow(t - 1, 3) + 1;
                case Easing.InOutCubic:
                    if (t < 0.5) return 4 * Math.pow(t, 3);
                    return 4 * Math.pow(t - 1, 3) + 1;
                case Easing.OutInCubic:
                    return 4 * Math.pow(t - 0.5, 3) + 0.5;
                // Quart
                case Easing.InQuart:
                    return Math.pow(t, 4);
                case Easing.OutQuart:
                    return -Math.pow(t - 1, 4) + 1;
                case Easing.InOutQuart:
                    if (t < 0.5) return 8 * Math.pow(t, 4);
                    return -8 * Math.pow(t - 1, 4) + 1;
                case Easing.OutInQuart:
                    if (t < 0.5) return -8 * Math.pow(t - 0.5, 4) + 0.5;
                    return 8 * Math.pow(t - 0.5, 4) + 0.5;
                // Quint
                case Easing.InQuint:
                    return Math.pow(t, 5);
                case Easing.OutQuint:
                    return Math.pow(t - 1, 5) + 1;
                case Easing.InOutQuint:
                    if (t < 0.5) return 16 * Math.pow(t, 5);
                    return 16 * Math.pow(t - 1, 5) + 1;
                case Easing.OutInQuint:
                    if (t < 0.5) return 16 * Math.pow(t - 0.5, 5) + 0.5;
                    return 16 * Math.pow(t - 0.5, 5) + 0.5;
                // Sine
                case Easing.InSine:
                    return -Math.cos(0.5 * Math.PI * t) + 1;
                case Easing.OutSine:
                    return Math.sin(0.5 * Math.PI * t);
                case Easing.InOutSine:
                    return -0.5 * Math.cos(Math.PI * t) + 0.5;
                case Easing.OutInSine:
                    if (t < 0.5) return 0.5 * Math.sin(Math.PI * t);
                    return -0.5 * Math.sin(Math.PI * t) + 1;
                // Expo
                case Easing.InExpo:
                    return 1 / 1023 * (Math.pow(2, 10 * t) - 1);
                case Easing.OutExpo:
                    return -(1024 / 1023) * (Math.pow(2, -10 * t) - 1);
                case Easing.InOutExpo:
                    if (t < 0.5) return 1 / 62 * (Math.pow(2, 10 * t) - 1);
                    return -(512 / 31) * Math.pow(2, -10 * t) + 63 / 62;
                case Easing.OutInExpo:
                    if (t < 0.5) return -(16 / 31) * (Math.pow(2, -10 * t) - 1);
                    return 1 / 1984 * Math.pow(2, 10 * t) + 15 / 31;
                // Circ
                case Easing.InCirc:
                    return 1 - Math.sqrt(1 - t * t);
                case Easing.OutCirc:
                    return Math.sqrt(1 - Math.pow(t - 1, 2));
                case Easing.InOutCirc:
                    if (t < 0.5) return 0.5 * (1 - Math.sqrt(1 - 4 * t * t));
                    return 0.5 * (Math.sqrt(1 - 4 * Math.pow(t - 1, 2)) + 1);
                case Easing.OutInCirc:
                    if (t < 0.5) return 0.5 * Math.sqrt(1 - Math.pow(2 * t - 1, 2));
                    return 0.5 * (2 - Math.sqrt(1 - Math.pow(2 * t - 1, 2)));
                // Elastic
                case Easing.InElastic:
                    return -this.amplitude * Math.pow(2, 10 * t - 10) * Math.sin(2 * t * Math.PI / this.period - Math.asin(1 / this.amplitude));
                case Easing.OutElastic:
                    return this.amplitude * Math.pow(2, -10 * t) * Math.sin(2 * t * Math.PI / this.period - Math.asin(1 / this.amplitude)) + 1;
                case Easing.InOutElastic:
                    if (t < 0.5) return -0.5 * this.amplitude * Math.pow(2, 20 * t - 10) * Math.sin(4 * t * Math.PI / this.period - Math.asin(1 / this.amplitude));
                    return -0.5 * this.amplitude * Math.pow(2, -20 * t + 10) * Math.sin(4 * t * Math.PI / this.period + Math.asin(1 / this.amplitude)) + 1;
                case Easing.OutInElastic:
                    if (t < 0.5) return 0.5 * this.amplitude * Math.pow(2, -20 * t) * Math.sin(4 * t * Math.PI / this.period - Math.asin(1 / this.amplitude)) + 0.5;
                    return -0.5 * this.amplitude * Math.pow(2, 20 * t - 20) * Math.sin(4 * t * Math.PI / this.period - Math.asin(1 / this.amplitude)) + 0.5;
                // Back
                case Easing.InBack:
                    return (this.overshoot + 1) * Math.pow(t, 3) - this.overshoot * Math.pow(t, 2);
                case Easing.OutBack:
                    return (this.overshoot + 1) * Math.pow(t - 1, 3) + this.overshoot * Math.pow(t - 1, 2) + 1;
                case Easing.InOutBack:
                    if (t < 0.5) return 4 * (this.overshoot + 1) * Math.pow(t, 3) - 2 * this.overshoot * Math.pow(t, 2);
                    return 0.5 * (this.overshoot + 1) * Math.pow(2 * t - 2, 3) + this.overshoot / 2 * Math.pow(2 * t - 2, 2) + 1;
                case Easing.OutInBack:
                    if (t < 0.5) return 0.5 * ((this.overshoot + 1) * Math.pow(2 * t - 1, 3) + this.overshoot * Math.pow(2 * t - 1, 2) + 1);
                    return 4 * (this.overshoot + 1) * Math.pow(t - 0.5, 3) - 2 * this.overshoot * Math.pow(t - 0.5, 2) + 0.5;
                // Bounce
                case Easing.InBounce:
                    if (t < 1 / 11) return -this.amplitude * (121 / 16) * (t * t - 1 / 11 * t);
                    if (t < 3 / 11) return -this.amplitude * (121 / 16) * (t * t - 4 / 11 * t + 3 / 121);
                    if (t < 7 / 11) return -this.amplitude * (121 / 16) * (t * t - 10 / 11 * t + 21 / 121);
                    return -(121 / 16) * (t * t - 2 * t + 1) + 1;
                case Easing.OutBounce:
                    if (t < 4 / 11) return 121 / 16 * t * t;
                    if (t < 8 / 11) return this.amplitude * (121 / 16) * (t * t - 12 / 11 * t + 32 / 121) + 1;
                    if (t < 10 / 11) return this.amplitude * (121 / 16) * (t * t - 18 / 11 * t + 80 / 121) + 1;
                    return this.amplitude * (121 / 16) * (t * t - 21 / 11 * t + 10 / 11) + 1;
                case Easing.InOutBounce:
                    if (t < 1 / 22) return -this.amplitude * (121 / 8) * (t * t - 1 / 22 * t);
                    if (t < 3 / 22) return -this.amplitude * (121 / 8) * (t * t - 2 / 11 * t + 3 / 484);
                    if (t < 7 / 22) return -this.amplitude * (121 / 8) * (t * t - 5 / 11 * t + 21 / 484);
                    if (t < 11 / 22) return -(121 / 8) * (t * t - t + 0.25) + 0.5;
                    if (t < 15 / 22) return 121 / 8 * (t * t - t) + 137 / 32;
                    if (t < 19 / 22) return this.amplitude * (121 / 8) * (t * t - 17 / 11 * t + 285 / 484) + 1;
                    if (t < 21 / 22) return this.amplitude * (121 / 8) * (t * t - 20 / 11 * t + 399 / 484) + 1;
                    return this.amplitude * (121 / 8) * (t * t - 43 / 22 * t + 21 / 22) + 1;
                case Easing.OutInBounce:
                    if (t < 4 / 22) return 121 / 8 * t * t;
                    if (t < 8 / 22) return -this.amplitude * (121 / 8) * (t * t - 6 / 11 * t + 8 / 121) + 0.5;
                    if (t < 10 / 22) return -this.amplitude * (121 / 8) * (t * t - 9 / 11 * t + 20 / 121) + 0.5;
                    if (t < 11 / 22) return -this.amplitude * (121 / 8) * (t * t - 21 / 22 * t + 5 / 22) + 0.5;
                    if (t < 12 / 22) return this.amplitude * (121 / 8) * (t * t - 23 / 22 * t + 3 / 11) + 0.5;
                    if (t < 14 / 22) return this.amplitude * (121 / 8) * (t * t - 13 / 11 * t + 42 / 121) + 0.5;
                    if (t < 18 / 22) return this.amplitude * (121 / 8) * (t * t - 16 / 11 * t + 63 / 121) + 0.5;
                    return -(121 / 8) * (t * t - 2 * t + 117 / 121) + 0.5;
                // Default
                default:
                    console.log("Unsupported animation type: ", this.type);
                // Linear
                case Easing.Linear:
                    return t;
            }
        };

        this.$redoActions = function () {
            this.$actions = [];
            for (var i = 0; i < this.$targets.length; i++) {
                for (var j in this.$props) {
                    this.$actions.push({
                        target: this.$targets[i],
                        property: this.$props[j],
                        from: this.from,
                        to: this.to
                    });
                }
            }
        };
        function redoProperties() {
            this.$props = this.properties.split(",");

            // Remove whitespaces
            for (var i = 0; i < this.$props.length; i++) {
                var matches = this.$props[i].match(/\w+/);
                if (matches) {
                    this.$props[i] = matches[0];
                } else {
                    this.$props.splice(i, 1);
                    i--;
                }
            }
            // Merge properties and property
            if (this.property && this.$props.indexOf(this.property) === -1) this.$props.push(this.property);
        }
        function redoTargets() {
            this.$targets = this.targets.slice();

            if (this.target && this.$targets.indexOf(this.target) === -1) this.$targets.push(this.target);
        }

        this.duration = 250;
        this.easing.type = Easing.Linear;
        this.easing.amplitude = 1;
        this.easing.period = 0.3;
        this.easing.overshoot = 1.70158;
        this.$props = [];
        this.$targets = [];
        this.$actions = [];
        this.properties = "";
        this.targets = [];

        this.targetChanged.connect(this, redoTargets);
        this.targetsChanged.connect(this, redoTargets);
        this.propertyChanged.connect(this, redoProperties);
        this.propertiesChanged.connect(this, redoProperties);

        if (meta.object.$on !== undefined) {
            this.property = meta.object.$on;
            this.target = this.$parent;
        }
    }
});

function QMLPropertyChanges(meta) {
    callSuper(this, meta);

    createProperty("QtObject", this, "target");
    createProperty("bool", this, "explicit");
    createProperty("bool", this, "restoreEntryValues", { initialValue: true });

    this.$actions = [];

    this.$setCustomData = function (propName, value) {
        this.$actions.push({
            property: propName,
            value: value
        });
    };
}

registerQmlType({
    module: 'QtQuick',
    name: 'PropertyChanges',
    versions: /.*/,
    baseClass: 'QtQml.QtObject',
    constructor: QMLPropertyChanges
});

registerQmlType({
    module: 'QtQuick',
    name: 'Rectangle',
    versions: /.*/,
    baseClass: 'Item',
    constructor: QMLRectangle
});

function QMLRectangle(meta) {
    callSuper(this, meta);

    createProperty("color", this, "color", { initialValue: 'white' });
    createProperty("real", this, "radius");

    this.border = new QObject(this);
    createProperty("color", this.border, "color", { initialValue: 'black' });
    createProperty("int", this.border, "width", { initialValue: 1 });

    var bg = this.impl = document.createElement('div');
    bg.style.pointerEvents = 'none';
    bg.style.position = 'absolute';
    bg.style.left = bg.style.right = bg.style.top = bg.style.bottom = '0px';
    bg.style.borderWidth = '0px';
    bg.style.borderStyle = 'solid';
    bg.style.borderColor = 'black';
    bg.style.backgroundColor = 'white';
    this.dom.appendChild(bg);

    this.colorChanged.connect(this, function (newVal) {
        bg.style.backgroundColor = QMLColor(newVal);
    });
    this.radiusChanged.connect(this, function (newVal) {
        bg.style.borderRadius = newVal + 'px';
    });
    this.border.colorChanged.connect(this, function (newVal) {
        bg.style.borderColor = QMLColor(newVal);
        if (bg.style.borderWidth == '0px') {
            bg.style.borderWidth = this.border.width + 'px';
        }
        this.$updateBorder(this.border.width);
    });
    this.border.widthChanged.connect(this, function (newVal) {
        // ignore negative border width
        if (newVal >= 0) {
            this.$updateBorder(newVal);
        } else {
            bg.style.borderWidth = "0px";
        }
    });
    this.widthChanged.connect(this, function (newVal) {
        this.$updateBorder(this.border.width);
    });
    this.heightChanged.connect(this, function (newVal) {
        this.$updateBorder(this.border.width);
    });
}

QMLRectangle.prototype.$updateBorder = function (newBorderWidth) {
    var bg = this.dom.firstChild;

    // ignore negative and 0px border width
    if (newBorderWidth == "0px" || newBorderWidth < 0) {
        return;
    }
    // no Rectangle border width was set yet
    if (newBorderWidth == "1" && bg.style.borderWidth == "0px" || typeof newBorderWidth === "undefined" && bg.style.borderWidth == "0px") {
        return;
    }

    var topBottom = typeof newBorderWidth === "undefined" ? bg.style.borderWidth : newBorderWidth + 'px';
    var leftRight = topBottom;

    bg.style.borderTopWidth = topBottom;
    bg.style.borderBottomWidth = topBottom;
    bg.style.borderLeftWidth = leftRight;
    bg.style.borderRightWidth = leftRight;

    // hide border if any of dimensions is less then one
    if (this.width <= 0 || this.height <= 0 || typeof this.width === "undefined" || typeof this.height === "undefined") {
        bg.style.borderWidth = '0px';
    } else {
        // check if border is not greater than Rectangle size
        // react by change of width or height of div (in css)

        if (2 * this.border.width > this.height) {
            topBottom = this.height / 2 + 'px';
            bg.style.height = '0px';
        } else {
            if (this.height - 2 * this.border.width < this.border.width) {
                if (this.height > 2) {
                    bg.style.height = (this.height % 2 ? -1 : -2 + this.height + (this.height - 2 * this.border.width)) + 'px';
                }
            }
        }

        if (2 * this.border.width > this.width) {
            leftRight = this.width / 2 + 'px';
            bg.style.width = '0px';
        } else {
            if (this.width - 2 * this.border.width < this.border.width) {
                if (this.width > 2) {
                    bg.style.width = (this.width % 2 ? -1 : -2 + this.width + (this.width - 2 * this.border.width)) + 'px';
                }
            }
        }

        bg.style.borderTopWidth = topBottom;
        bg.style.borderBottomWidth = topBottom;
        bg.style.borderLeftWidth = leftRight;
        bg.style.borderRightWidth = leftRight;
    }
};

registerQmlType({
    module: 'QtQuick',
    name: 'RegExpValidator',
    versions: /.*/,
    baseClass: 'Item',
    constructor: function QMLRegExpValidator(meta) {
        callSuper(this, meta);

        createProperty("var", this, "regExp");

        this.validate = function (string) {
            if (typeof this.regExp == 'undefined' || this.regExp == null) return true;
            return this.regExp.test(string);
        }.bind(this);
    }
});

function QMLRepeater(meta) {
    callSuper(this, meta);
    var self = this;
    var QMLListModel = getConstructor('QtQuick', '2.0', 'ListModel');

    this.parent = meta.parent; // TODO: some (all ?) of the components including Repeater needs to know own parent at creation time. Please consider this major change.

    createProperty("Component", this, "delegate");
    this.container = function () {
        return this.parent;
    };
    this.$defaultProperty = "delegate";
    createProperty("variant", this, "model", { initialValue: 0 });
    createProperty("int", this, "count");
    this.$completed = false;
    this.$items = []; // List of created items
    this._childrenInserted = Signal();

    this.modelChanged.connect(applyModel);
    this.delegateChanged.connect(applyModel);
    this.parentChanged.connect(applyModel);

    this.itemAt = function (index) {
        return this.$items[index];
    };

    function callOnCompleted(child) {
        child.Component.completed();
        for (var i = 0; i < child.$tidyupList.length; i++) {
            if (child.$tidyupList[i] instanceof QMLBaseObject) callOnCompleted(child.$tidyupList[i]);
        }
    }
    function insertChildren(startIndex, endIndex) {
        if (endIndex <= 0) return;

        var model = self.model instanceof QMLListModel ? self.model.$model : self.model;

        for (var index = startIndex; index < endIndex; index++) {
            var newItem = self.delegate.createObject();
            createProperty('int', newItem, 'index', { initialValue: index });
            newItem.parent = self.parent;
            self.delegate.finalizeImports(); // To properly import JavaScript in the context of a component

            if (typeof model == "number" || model instanceof Array) {
                if (typeof newItem.$properties["modelData"] == 'undefined') {
                    createProperty("variant", newItem, "modelData");
                }
                var value = model instanceof Array ? model[index] : typeof model == "number" ? index : "undefined";
                newItem.$properties["modelData"].set(value, true, newItem, model.$context);
            } else {
                for (var i = 0; i < model.roleNames.length; i++) {
                    var roleName = model.roleNames[i];
                    if (typeof newItem.$properties[roleName] == 'undefined') createProperty("variant", newItem, roleName);
                    newItem.$properties[roleName].set(model.data(index, roleName), true, newItem, self.model.$context);
                }
            }

            self.$items.splice(index, 0, newItem);

            // TODO debug this. Without check to Init, Completed sometimes called twice.. But is this check correct?
            if (engine.operationState !== QMLOperationState.Init && engine.operationState !== QMLOperationState.Idle) {
                // We don't call those on first creation, as they will be called
                // by the regular creation-procedures at the right time.
                callOnCompleted(newItem);
            }
        }
        if (engine.operationState !== QMLOperationState.Init) {
            // We don't call those on first creation, as they will be called
            // by the regular creation-procedures at the right time.
            engine.$initializePropertyBindings();
        }

        if (index > 0) {
            self.container().childrenChanged();
        }

        for (var i = endIndex; i < self.$items.length; i++) {
            self.$items[i].index = i;
        }self.count = self.$items.length;
    }

    function onModelDataChanged(startIndex, endIndex, roles) {
        var model = self.model instanceof QMLListModel ? self.model.$model : self.model;

        if (!roles) roles = model.roleNames;
        for (var index = startIndex; index <= endIndex; index++) {
            for (var i in roles) {
                self.$items[index].$properties[roles[i]].set(model.data(index, roles[i]), QMLProperty.ReasonInit, self.$items[index], self.model.$context);
            }
        }
    }
    function onRowsMoved(sourceStartIndex, sourceEndIndex, destinationIndex) {
        var vals = self.$items.splice(sourceStartIndex, sourceEndIndex - sourceStartIndex);
        for (var i = 0; i < vals.length; i++) {
            self.$items.splice(destinationIndex + i, 0, vals[i]);
        }
        var smallestChangedIndex = sourceStartIndex < destinationIndex ? sourceStartIndex : destinationIndex;
        for (var i = smallestChangedIndex; i < self.$items.length; i++) {
            self.$items[i].index = i;
        }
    }
    function onRowsRemoved(startIndex, endIndex) {
        removeChildren(startIndex, endIndex);
        for (var i = startIndex; i < self.$items.length; i++) {
            self.$items[i].index = i;
        }
        self.count = self.$items.length;
    }
    function onModelReset() {
        var model = self.model instanceof QMLListModel ? self.model.$model : self.model;
        removeChildren(0, self.$items.length);
    }
    function applyModel() {
        if (!self.delegate || !self.parent) return;
        var model = self.model instanceof QMLListModel ? self.model.$model : self.model;
        if (model instanceof JSItemModel) {
            if (model.dataChanged.isConnected(onModelDataChanged) == false) model.dataChanged.connect(onModelDataChanged);
            if (model.rowsInserted.isConnected(insertChildren) == false) model.rowsInserted.connect(insertChildren);
            if (model.rowsMoved.isConnected(onRowsMoved) == false) model.rowsMoved.connect(onRowsMoved);
            if (model.rowsRemoved.isConnected(onRowsRemoved) == false) model.rowsRemoved.connect(onRowsRemoved);
            if (model.modelReset.isConnected(onModelReset) == false) model.modelReset.connect(onModelReset);

            removeChildren(0, self.$items.length);
            insertChildren(0, model.rowCount());
        } else if (typeof model == "number") {
            // must be more elegant here.. do not delete already created models..
            //removeChildren(0, self.$items.length);
            //insertChildren(0, model);

            if (self.$items.length > model) {
                // have more than we need
                removeChildren(model, self.$items.length);
            } else {
                // need more
                insertChildren(self.$items.length, model);
            }
        } else if (model instanceof Array) {
            removeChildren(0, self.$items.length);
            insertChildren(0, model.length);
        }
    }

    function removeChildren(startIndex, endIndex) {
        var removed = self.$items.splice(startIndex, endIndex - startIndex);
        for (var index in removed) {
            removed[index].$delete();
            removeChildProperties(removed[index]);
        }
    }
    function removeChildProperties(child) {
        engine.completedSignals.splice(engine.completedSignals.indexOf(child.Component.completed), 1);
        for (var i = 0; i < child.children.length; i++) {
            removeChildProperties(child.children[i]);
        }
    }
}

registerQmlType({
    module: 'QtQuick',
    name: 'Repeater',
    versions: /.*/,
    baseClass: 'Item',
    constructor: QMLRepeater
});

registerQmlType({
    module: 'QtQuick',
    name: 'Rotation',
    versions: /.*/,
    baseClass: 'QtQml.QtObject',
    constructor: function QMLRotation(meta) {
        callSuper(this, meta);

        createProperty("real", this, "angle");

        this.axis = new QObject(this);
        createProperty("real", this.axis, "x");
        createProperty("real", this.axis, "y");
        createProperty("real", this.axis, "z", { initialValue: 1 });

        this.origin = new QObject(this);
        createProperty("real", this.origin, "x");
        createProperty("real", this.origin, "y");

        function updateOrigin() {
            this.$parent.dom.style.transformOrigin = this.origin.x + "px " + this.origin.y + "px";
            this.$parent.dom.style.MozTransformOrigin = this.origin.x + "px " + this.origin.y + "px"; // Firefox
            this.$parent.dom.style.webkitTransformOrigin = this.origin.x + "px " + this.origin.y + "px"; // Chrome, Safari and Opera
        }
        this.angleChanged.connect(this.$parent, this.$parent.$updateTransform);
        this.axis.xChanged.connect(this.$parent, this.$parent.$updateTransform);
        this.axis.yChanged.connect(this.$parent, this.$parent.$updateTransform);
        this.axis.zChanged.connect(this.$parent, this.$parent.$updateTransform);
        this.origin.xChanged.connect(this, updateOrigin);
        this.origin.yChanged.connect(this, updateOrigin);
        this.$parent.$updateTransform();
    }
});

registerQmlType({
    module: 'QtQuick',
    name: 'Row',
    versions: /.*/,
    baseClass: 'Positioner',
    constructor: QMLRow
});

function QMLRow(meta) {
    callSuper(this, meta);

    createProperty("enum", this, "layoutDirection", { initialValue: 0 });
    this.layoutDirectionChanged.connect(this, this.layoutChildren);
    this.layoutChildren();
}

QMLRow.prototype.layoutChildren = function () {
    var curPos = 0,
        maxHeight = 0,

    // When layoutDirection is RightToLeft we need oposite order
    i = this.layoutDirection == 1 ? this.children.length - 1 : 0,
        endPoint = this.layoutDirection == 1 ? -1 : this.children.length,
        step = this.layoutDirection == 1 ? -1 : 1;
    for (; i !== endPoint; i += step) {
        var child = this.children[i];
        if (!(child.visible && child.width && child.height)) continue;
        maxHeight = child.height > maxHeight ? child.height : maxHeight;

        child.x = curPos;
        curPos += child.width + this.spacing;
    }
    this.implicitHeight = maxHeight;
    this.implicitWidth = curPos - this.spacing; // We want no spacing at the right side
};

registerQmlType({
    module: 'QtQuick',
    name: 'Scale',
    versions: /.*/,
    baseClass: 'QtQml.QtObject',
    constructor: function QMLScale(meta) {
        var _this4 = this;

        callSuper(this, meta);

        createProperty("real", this, "xScale");
        createProperty("real", this, "yScale");

        this.origin = new QObject(this);
        createProperty("real", this.origin, "x");
        createProperty("real", this.origin, "y");

        var updateOrigin = function updateOrigin() {
            _this4.$parent.dom.style.transformOrigin = _this4.origin.x + "px " + _this4.origin.y + "px";
            _this4.$parent.dom.style.MozTransformOrigin = _this4.origin.x + "px " + _this4.origin.y + "px"; // Firefox
            _this4.$parent.dom.style.webkitTransformOrigin = _this4.origin.x + "px " + _this4.origin.y + "px"; // Chrome, Safari and Opera
        };
        this.xScaleChanged.connect(this.$parent, this.$parent.$updateTransform);
        this.yScaleChanged.connect(this.$parent, this.$parent.$updateTransform);
        this.origin.xChanged.connect(this, updateOrigin);
        this.origin.yChanged.connect(this, updateOrigin);

        this.xScale = 0;
        this.yScale = 0;
        this.origin.x = 0;
        this.origin.y = 0;

        /* QML default origin is top-left, while CSS default origin is centre, so
         * updateOrigin must be called to set the initial transformOrigin. */
        updateOrigin();
    }
});

registerQmlType({
    module: 'QtQuick',
    name: 'SequentialAnimation',
    versions: /.*/,
    baseClass: 'Animation',
    constructor: function QMLSequentialAnimation(meta) {
        callSuper(this, meta);
        var curIndex,
            passedLoops,
            i,
            self = this;

        createProperty("list", this, "animations");
        this.$defaultProperty = "animations";

        function nextAnimation(proceed) {
            var anim;
            if (self.running && !proceed) {
                curIndex++;
                if (curIndex < self.animations.length) {
                    anim = self.animations[curIndex];
                    console.log("nextAnimation", self, curIndex, anim);
                    anim.start();
                } else {
                    passedLoops++;
                    if (passedLoops >= self.loops) {
                        self.complete();
                    } else {
                        curIndex = -1;
                        nextAnimation();
                    }
                }
            }
        }

        this.animationsChanged.connect(this, function () {
            for (i = 0; i < this.animations.length; i++) {
                if (!this.animations[i].runningChanged.isConnected(nextAnimation)) this.animations[i].runningChanged.connect(nextAnimation);
            }
        });

        this.start = function () {
            if (!this.running) {
                this.running = true;
                curIndex = -1;
                passedLoops = 0;
                nextAnimation();
            }
        };
        this.stop = function () {
            if (this.running) {
                this.running = false;
                if (curIndex < this.animations.length) {
                    this.animations[curIndex].stop();
                }
            }
        };

        this.complete = function () {
            if (this.running) {
                if (curIndex < this.animations.length) {
                    // Stop current animation
                    this.animations[curIndex].stop();
                }
                this.running = false;
            }
        };

        engine.$registerStart(function () {
            if (self.running) {
                self.running = false; // toggled back by start();
                self.start();
            }
        });
        engine.$registerStop(function () {
            self.stop();
        });
    }
});

registerQmlType({
    module: 'QtQuick',
    name: 'State',
    versions: /.*/,
    baseClass: 'QtQml.QtObject',
    constructor: function QMLState(meta) {
        callSuper(this, meta);

        createProperty("string", this, "name");
        createProperty("list", this, "changes");
        this.$defaultProperty = "changes";
        createProperty("string", this, "extend");
        createProperty("bool", this, "when");
        this.$item = this.$parent;

        this.whenChanged.connect(this, function (newVal) {
            if (newVal) this.$item.state = this.name;else if (this.$item.state == this.name) this.$item.state = "";
        });

        this.$getAllChanges = function () {
            if (this.extend) {
                for (var i = 0; i < this.$item.states.length; i++) {
                    if (this.$item.states[i].name == this.extend) return this.$item.states[i].$getAllChanges().concat(this.changes);
                }
            } else return this.changes;
        };
    }
});

window.SystemPalette = {
    Active: "active",
    Inactive: "inactive",
    Disabled: "disabled"
};

window.platformsDetectors = [
//{ name: 'W8',      regexp: /Windows NT 6\.2/ },
//{ name: 'W7',      regexp: /Windows NT 6\.1/ },
//{ name: 'Windows', regexp: /Windows NT/ },
{ name: 'OSX', regexp: /Macintosh/ }];

window.systemPalettes = {};

registerQmlType({
    module: 'QtQuick',
    name: 'SystemPalette',
    versions: /.*/,
    baseClass: 'QtQml.QtObject',
    constructor: function QMLSystemPalette(meta) {
        callSuper(this, meta);

        createProperty("enum", this, "colorGroup");

        var attrs = ['alternateBase', 'base', 'button', 'buttonText', 'dark', 'highlight', 'highlightedText', 'light', 'mid', 'midlight', 'shadow', 'text', 'window', 'windowText'];
        var platform = 'OSX';

        for (var i = 0; i < attrs.length; ++i) {
            createProperty("color", this, attrs[i], { readOnly: true });
        }createProperty("enum", this, "colorGroup");

        this.colorGroupChanged.connect(this, function (newVal) {
            this.$canEditReadOnlyProperties = true;
            for (var i = 0; i < attrs.length; ++i) {
                this[attrs[i]] = systemPalettes[platform][newVal][attrs[i]];
            }
            delete this.$canEditReadOnlyProperties;
        }.bind(this));

        // Detect OS
        for (var i = 0; i < platformsDetectors.length; ++i) {
            if (platformsDetectors[i].regexp.test(navigator.userAgent)) {
                platforms = platformsDetectors[i].name;
                break;
            }
        }
    }
});

window.systemPalettes['OSX'] = {
    'active': {
        'alternateBase': '#f6f6f6',
        'base': '#ffffff',
        'button': '#ededed',
        'buttonText': '#000000',
        'dark': '#bfbfbf',
        'highlight': '#fbed73',
        'highlightText': '#000000',
        'light': '#ffffff',
        'mid': '#a9a9a9',
        'midlight': '#f6f6f6',
        'shadow': '#8b8b8b',
        'text': '#000000',
        'window': '#ededed',
        'windowText': '#000000'
    },
    'inactive': {
        'alternateBase': '#f6f6f6',
        'base': '#ffffff',
        'button': '#ededed',
        'buttonText': '#000000',
        'dark': '#bfbfbf',
        'highlight': '#d0d0d0',
        'highlightText': '#000000',
        'light': '#ffffff',
        'mid': '#a9a9a9',
        'midlight': '#f6f6f6',
        'shadow': '#8b8b8b',
        'text': '#000000',
        'window': '#ededed',
        'windowText': '#000000'
    },
    'disabled': {
        'alternateBase': '#f6f6f6',
        'base': '#ededed',
        'button': '#ededed',
        'buttonText': '#949494',
        'dark': '#bfbfbf',
        'highlight': '#d0d0d0',
        'highlightText': '#7f7f7f',
        'light': '#ffffff',
        'mid': '#a9a9a9',
        'midlight': '#f6f6f6',
        'shadow': '#8b8b8b',
        'text': '#7f7f7f',
        'window': '#ededed',
        'windowText': '#7f7f7f'
    }
};

registerQmlType({
    module: 'QtQuick',
    name: 'Text',
    versions: /.*/,
    baseClass: 'Item',
    constructor: function QMLText(meta) {
        callSuper(this, meta);

        var fc = this.impl = document.createElement('span');
        fc.style.pointerEvents = 'none';
        fc.style.width = '100%';
        fc.style.height = '100%';
        this.dom.appendChild(fc);

        this.Text = {
            // Wrap Mode
            NoWrap: 0,
            WordWrap: 1,
            WrapAnywhere: 2,
            Wrap: 3,
            WrapAtWordBoundaryOrAnywhere: 3, // COMPAT
            // Horizontal-Alignment
            AlignLeft: "left",
            AlignRight: "right",
            AlignHCenter: "center",
            AlignJustify: "justify",
            // Style
            Normal: 0,
            Outline: 1,
            Raised: 2,
            Sunken: 3
        };

        var QMLFont = new getConstructor('QtQuick', '2.0', 'Font');
        this.font = new QMLFont(this);

        createProperty("color", this, "color");
        createProperty("string", this, "text");
        createProperty("real", this, "lineHeight");
        createProperty("enum", this, "wrapMode");
        createProperty("enum", this, "horizontalAlignment");
        createProperty("enum", this, "style");
        createProperty("color", this, "styleColor");

        this.colorChanged.connect(this, function (newVal) {
            fc.style.color = QMLColor(newVal);
        });
        this.textChanged.connect(this, function (newVal) {
            fc.innerHTML = newVal;
        });
        this.lineHeightChanged.connect(this, function (newVal) {
            fc.style.lineHeight = newVal + "px";
        });
        this.wrapModeChanged.connect(this, function (newVal) {
            switch (newVal) {
                case 0:
                    fc.style.whiteSpace = "pre";
                    break;
                case 1:
                    fc.style.whiteSpace = "pre-wrap";
                    fc.style.wordWrap = "normal";
                    break;
                case 2:
                    fc.style.whiteSpace = "pre-wrap";
                    fc.style.wordBreak = "break-all";
                    break;
                case 3:
                    fc.style.whiteSpace = "pre-wrap";
                    fc.style.wordWrap = "break-word";
            };
            // AlignJustify doesn't work with pre/pre-wrap, so we decide the
            // lesser of the two evils to be ignoring "\n"s inside the text.
            if (this.horizontalAlignment == "justify") fc.style.whiteSpace = "normal";
        });
        this.horizontalAlignmentChanged.connect(this, function (newVal) {
            this.dom.style.textAlign = newVal;
            // AlignJustify doesn't work with pre/pre-wrap, so we decide the
            // lesser of the two evils to be ignoring "\n"s inside the text.
            if (newVal == "justify") fc.style.whiteSpace = "normal";
        });
        this.styleChanged.connect(this, function (newVal) {
            switch (newVal) {
                case 0:
                    fc.style.textShadow = "none";
                    break;
                case 1:
                    var color = this.styleColor;
                    fc.style.textShadow = "1px 0 0 " + color + ", -1px 0 0 " + color + ", 0 1px 0 " + color + ", 0 -1px 0 " + color;
                    break;
                case 2:
                    fc.style.textShadow = "1px 1px 0 " + this.styleColor;
                    break;
                case 3:
                    fc.style.textShadow = "-1px -1px 0 " + this.styleColor;
            };
        });
        this.styleColorChanged.connect(this, function (newVal) {
            newVal = QMLColor(newVal);
            switch (this.style) {
                case 0:
                    fc.style.textShadow = "none";
                    break;
                case 1:
                    fc.style.textShadow = "1px 0 0 " + newVal + ", -1px 0 0 " + newVal + ", 0 1px 0 " + newVal + ", 0 -1px 0 " + newVal;
                    break;
                case 2:
                    fc.style.textShadow = "1px 1px 0 " + newVal;
                    break;
                case 3:
                    fc.style.textShadow = "-1px -1px 0 " + newVal;
            };
        });

        this.font.family = "sans-serif";
        this.font.pointSize = 10;
        this.wrapMode = this.Text.NoWrap;
        this.color = "black";
        this.text = "";

        this.textChanged.connect(this, updateImplicit);
        this.font.boldChanged.connect(this, updateImplicit);
        this.font.pixelSizeChanged.connect(this, updateImplicit);
        this.font.pointSizeChanged.connect(this, updateImplicit);
        this.font.familyChanged.connect(this, updateImplicit);
        this.font.letterSpacingChanged.connect(this, updateImplicit);
        this.font.wordSpacingChanged.connect(this, updateImplicit);

        this.Component.completed.connect(this, updateImplicit);

        function updateImplicit() {
            if (_typeof(this.text) == undefined || this.text === "" || !this.dom) {
                this.implicitHeigh = this.implicitWidth = 0;
            } else {
                this.implicitHeight = fc.offsetHeight;
                this.implicitWidth = fc.offsetWidth;
            }
        }
    }
});

function QMLTextEdit(meta) {
    callSuper(this, meta);

    var self = this;

    // Properties
    createProperty('bool', this, 'activeFocusOnPress');
    createProperty('url', this, 'baseUrl');
    createProperty('bool', this, 'canPaste');
    createProperty('bool', this, 'canRedo');
    createProperty('bool', this, 'canUndo');
    createProperty('color', this, 'color');
    createProperty('real', this, 'contentHeight');
    createProperty('real', this, 'contentWidth');
    createProperty('Component', this, 'cursorDelegate');
    createProperty('int', this, 'cursorPosition');
    createProperty('rectangle', this, 'cursorRectangle');
    createProperty('bool', this, 'cursorVisible');
    createProperty('enum', this, 'effectiveHorizontalAlignment');
    createProperty('enum', this, 'horizontalAlignment');
    createProperty('string', this, 'hoveredLink');
    createProperty('bool', this, 'inputMethodComposing');
    createProperty('enum', this, 'inputMethodHints');
    createProperty('int', this, 'length');
    createProperty('int', this, 'lineCount');
    createProperty('enum', this, 'mouseSelectionMode');
    createProperty('bool', this, 'persistentSelection');
    createProperty('bool', this, 'readOnly');
    createProperty('enum', this, 'renderType');
    createProperty('bool', this, 'selectByKeyboard');
    createProperty('bool', this, 'selectByMouse');
    createProperty('string', this, 'selectedText');
    createProperty('color', this, 'selectedTextColor');
    createProperty('color', this, 'selectionColor');
    createProperty('int', this, 'selectionEnd');
    createProperty('int', this, 'selectionStart');
    createProperty('string', this, 'text');
    createProperty('TextDocument', this, 'textDocument');
    createProperty('enum', this, 'textFormat');
    createProperty('real', this, 'textMargin');
    createProperty('enum', this, 'verticalAlignment');
    createProperty('enum', this, 'wrapMode');

    var QMLFont = new getConstructor('QtQuick', '2.0', 'Font');
    this.font = new QMLFont(this);

    this.activeFocusOnPress = true;
    this.baseUrl = undefined;
    this.canPaste = false;
    this.canRedo = false;
    this.canUndo = false;
    this.color = 'white';
    this.contentHeight = 0;
    this.contentWidth = 0;
    this.cursorDelegate = undefined;
    this.cursorPosition = 0;
    this.cursorRectangle = undefined;
    this.cursorVisible = true;
    this.effectiveHorizontalAlignment = undefined;
    this.horizontalAlignment = undefined;
    this.hoveredLink = undefined;
    this.inputMethodComposing = undefined;
    this.inputMethodHints = undefined;
    this.length = 0;
    this.lineCount = 0;
    this.mouseSelectionMode = undefined;
    this.persistentSelection = false;
    this.readOnly = false;
    this.renderType = undefined;
    this.selectByKeyboard = true;
    this.selectByMouse = false;
    this.selectedText = undefined;
    this.selectedTextColor = 'yellow';
    this.selectionColor = 'pink';
    this.selectionEnd = 0;
    this.selectionStart = 0;
    this.text = '';
    this.textDocument = undefined;
    this.textFormat = undefined;
    this.textMargin = 0;
    this.verticalAlignment = undefined;
    this.wrapMode = undefined;

    // Undo / Redo stacks;
    this.undoStack = [];
    this.undoStackPosition = -1;
    this.redoStack = [];
    this.redoStackPosition = -1;

    var textarea = this.impl = document.createElement('textarea');
    textarea.style.pointerEvents = "auto";
    textarea.style.width = "100%";
    textarea.style.height = "100%";
    textarea.style.boxSizing = 'border-box';
    textarea.style.borderWidth = '0';
    textarea.style.background = 'none';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.padding = '0'; // TODO: padding/*Padding props from Qt 5.6
    // In some browsers text-areas have a margin by default, which distorts
    // the positioning, so we need to manually set it to 0.
    textarea.style.margin = "0";
    textarea.disabled = false;
    this.dom.appendChild(textarea);

    this.Component.completed.connect(this, function () {
        this.implicitWidth = textarea.offsetWidth;
        this.implicitHeight = textarea.offsetHeight;
    });

    this.textChanged.connect(this, function (newVal) {
        textarea.value = newVal;
    });

    // Signals
    this.linkActivated = Signal([{
        type: 'string',
        name: 'link'
    }]);
    this.linkHovered = Signal([{
        type: 'string',
        name: 'link'
    }]);

    // Methods
    this.append = function append(text) {
        this.text += text;
    };

    this.copy = function copy() {
        // TODO
    };

    this.cut = function cut() {
        this.text = this.text(0, this.selectionStart) + this.text(this.selectionEnd, this.text.length);
        // TODO
    };

    this.deselect = function deselect() {
        //this.selectionStart = -1;
        //this.selectionEnd = -1;
        //this.selectedText = null;
    };

    this.getFormattedText = function getFormattedText(start, end) {
        this.text = this.text.slice(start, end);
        // TODO
        // process text
        return text;
    };

    this.getText = function getText(start, end) {
        return this.text.slice(start, end);
    };

    this.insert = function getText(position, text) {
        // TODO
    };

    this.isRightToLeft = function isRightToLeft(start, end) {
        // TODO
    };

    this.linkAt = function linkAt(x, y) {
        // TODO
    };

    this.moveCursorSelection = function moveCursorSelection(x, y) {
        // TODO
    };

    this.paste = function paste() {
        // TODO
    };

    this.positionAt = function positionAt(x, y) {
        // TODO
    };

    this.positionToRectangle = function positionToRectangle(position) {
        // TODO
    };

    this.redo = function redo() {
        // TODO
    };

    this.remove = function remove(start, end) {
        // TODO
    };

    this.select = function select(start, end) {
        // TODO
    };

    this.selectAll = function selectAll() {
        // TODO
    };

    this.selectWord = function selectWord() {
        // TODO
    };

    this.undo = function undo() {
        // TODO
    };

    var getLineCount = function getLineCount(self) {
        return self.text.split(/\n/).length;
    };

    this.Component.completed.connect(this, function () {
        this.selectByKeyboard = !this.readOnly;
        updateValue();
    });

    // Transfer dom style to firstChild,
    // then clear corresponding dom style
    function updateCss(self) {
        var supported = ['border', 'borderRadius', 'borderWidth', 'borderColor', 'backgroundColor'];

        var child_style = self.dom.firstChild.style;
        for (n = 0; n < supported.length; n++) {
            var o = supported[n];
            var v = self.css[o];
            if (v) {
                child_style[o] = v;
                self.css[o] = null;
            }
        }
    }

    function updateValue(e) {
        if (self.text != self.dom.firstChild.value) {
            self.text = self.dom.firstChild.value;
        }
        self.length = self.text.length;
        self.lineCount = getLineCount(self);
        updateCss(self);
    }

    textarea.oninput = updateValue;
    textarea.onpropertychanged = updateValue;

    this.colorChanged.connect(this, function (newVal) {
        textarea.style.color = newVal;
    });
}

registerQmlType({
    module: 'QtQuick',
    name: 'TextEdit',
    versions: /.*/,
    baseClass: 'Item',
    constructor: QMLTextEdit
});

global.TextInput = {
    Normal: 0, Password: 1, NoEcho: 2, PasswordEchoOnEdit: 3
};

registerQmlType({
    module: 'QtQuick',
    name: 'TextInput',
    versions: /.*/,
    baseClass: 'Item',
    constructor: function QMLTextInput(meta) {
        callSuper(this, meta);

        var self = this;

        this.font = new getConstructor('QtQuick', '2.0', 'Font')(this);

        var input = this.impl = document.createElement('input');
        input.type = 'text';
        input.disabled = true;
        input.style.pointerEvents = "auto";
        // In some browsers text-inputs have a margin by default, which distorts
        // the positioning, so we need to manually set it to 0.
        input.style.margin = "0";
        input.style.padding = "0";
        input.style.width = "100%";
        input.style.height = "100%";
        this.dom.appendChild(input);

        this.setupFocusOnDom(input);

        createProperty("string", this, "text");
        createProperty("int", this, "maximumLength", { initialValue: -1 });
        createProperty("bool", this, "readOnly");
        createProperty("var", this, "validator");
        createProperty("enum", this, "echoMode");
        this.accepted = Signal();
        input.disabled = false;

        this.Component.completed.connect(this, function () {
            this.implicitWidth = input.offsetWidth;
            this.implicitHeight = input.offsetHeight;
        });

        this.textChanged.connect(this, function (newVal) {
            // We have to check if value actually changes.
            // If we do not have this check, then after user updates text input following occurs:
            // user update gui text -> updateValue called -> textChanged called -> gui value updates again -> caret position moves to the right!
            if (input.value != newVal) input.value = newVal;
        });

        this.echoModeChanged.connect(this, function (newVal) {
            switch (newVal) {
                case TextInput.Normal:
                    input.type = "text";
                    break;
                case TextInput.Password:
                    input.type = "password";
                    break;
                case TextInput.NoEcho:
                    // Not supported, use password, that's nearest
                    input.type = "password";
                    break;
                case TextInput.PasswordEchoOnEdit:
                    // Not supported, use password, that's nearest
                    input.type = "password";
                    break;
            }
        }.bind(this));

        this.maximumLengthChanged.connect(this, function (newVal) {
            if (newVal < 0) newVal = null;
            input.maxLength = newVal;
        });

        this.readOnlyChanged.connect(this, function (newVal) {
            input.disabled = newVal;
        });

        this.Keys.pressed.connect(this, function (e) {
            if ((e.key == Qt.Key_Return || e.key == Qt.Key_Enter) && testValidator()) {
                self.accepted();
                e.accepted = true;
            }
        }.bind(this));

        function testValidator() {
            if (typeof self.validator != 'undefined' && self.validator != null) return self.validator.validate(self.text);
            return true;
        }

        function updateValue(e) {
            if (self.text != self.dom.firstChild.value) {
                self.$canEditReadOnlyProperties = true;
                self.text = self.dom.firstChild.value;
                self.$canEditReadOnlyProperties = false;
            }
        }

        input.oninput = updateValue;
        input.onpropertychanged = updateValue;
    }
});

registerQmlType({
    module: 'QtQuick',
    name: 'Transition',
    versions: /.*/,
    baseClass: 'QtQml.QtObject',
    constructor: function QMLTransition(meta) {
        callSuper(this, meta);

        createProperty("list", this, "animations");
        this.$defaultProperty = "animations";
        createProperty("string", this, "from", { initialValue: '*' });
        createProperty("string", this, "to", { initialValue: '*' });
        createProperty("bool", this, "reversible");
        this.$item = this.$parent;

        this.$start = function (actions) {
            for (var i = 0; i < this.animations.length; i++) {
                var animation = this.animations[i];
                animation.$actions = [];
                for (var j in actions) {
                    var action = actions[j];
                    if ((animation.$targets.length === 0 || animation.$targets.indexOf(action.target) !== -1) && (animation.$props.length === 0 || animation.$props.indexOf(action.property) !== -1)) animation.$actions.push(action);
                }
                animation.start();
            }
        };
        this.$stop = function () {
            for (var i = 0; i < this.animations.length; i++) {
                this.animations[i].stop();
            }
        };
    }
});

registerQmlType({
    module: 'QtQuick',
    name: 'Translate',
    versions: /.*/,
    baseClass: 'QtQml.QtObject',
    constructor: function QMLTranslate(meta) {
        callSuper(this, meta);

        createProperty("real", this, "x");
        createProperty("real", this, "y");

        this.xChanged.connect(this.$parent, this.$parent.$updateTransform);
        this.yChanged.connect(this.$parent, this.$parent.$updateTransform);

        this.x = 0;
        this.y = 0;
    }
});

// WARNING: Can have wrong behavior if url is changed while the socket is in Connecting state.
// TODO: Recheck everything.

registerQmlType({
    module: 'QtWebSockets',
    name: 'WebSocket',
    versions: /.*/,
    baseClass: 'QtQml.QtObject',
    constructor: function QMLWebSocket(meta) {
        callSuper(this, meta);

        // Exports.
        this.WebSocket = {
            // status
            Connecting: 0,
            Open: 1,
            Closing: 2,
            Closed: 3,
            Error: 4
        };

        createProperty("bool", this, "active");
        createProperty("enum", this, "status");
        createProperty("string", this, "errorString");
        createProperty("url", this, "url");

        this.textMessageReceived = Signal([{ type: "string", name: "message" }]);

        this.status = this.WebSocket.Closed;

        var self = this,
            socket,
            reconnect = false;

        this.sendTextMessage = function (message) {
            if (this.status == this.WebSocket.Open) socket.send(message);
        };

        function connectSocket() {
            reconnect = false;

            if (!self.url || !self.active) return;

            self.status = self.WebSocket.Connecting;
            socket = new WebSocket(self.url);
            socket.onopen = function () {
                self.status = self.WebSocket.Open;
            };
            socket.onclose = function () {
                self.status = self.WebSocket.Closed;
                if (reconnect) connectSocket();
            };
            socket.onerror = function (error) {
                self.errorString = error.message;
                self.status = self.WebSocket.Error;
            };
            socket.onmessage = function (message) {
                self.textMessageReceived(message.data);
            };
        };

        function reconnectSocket() {
            reconnect = true;
            if (self.status == self.WebSocket.Open) {
                self.status = self.WebSocket.Closing;
                socket.close();
            } else if (self.status != self.WebSocket.Closing) {
                connectSocket();
            }
        };

        this.statusChanged.connect(this, function (status) {
            if (status != self.WebSocket.Error) self.errorString = "";
        });
        this.activeChanged.connect(this, reconnectSocket);
        this.urlChanged.connect(this, reconnectSocket);
    }
});
}(typeof global != 'undefined' ? global : window));

//# sourceMappingURL=qt.js.map
