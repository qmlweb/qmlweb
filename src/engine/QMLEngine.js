// There can only be one running QMLEngine.
// This variable points to the currently running engine.
QmlWeb.engine = null;

QmlWeb.useShadowDom = true;

const geometryProperties = [
  "width", "height", "fill", "x", "y", "left", "right", "top", "bottom"
];

// QML engine. EXPORTED.
class QMLEngine {
  constructor(element) {
    //----------Public Members----------

    this.fps = 60;
    // Math.floor, causes bugs to timing?
    this.$interval = Math.floor(1000 / this.fps);
    this.dom = element || document.body;

    // Target for the DOM children
    this.domTarget = this.dom;
    if (QmlWeb.useShadowDom && this.dom.attachShadow) {
      this.domTarget = this.dom.attachShadow({ mode: "open" });
    }

    // Cached component trees (post-QmlWeb.convertToEngine)
    this.components = {};

    // Cached parsed JS files (post-QmlWeb.jsparse)
    this.js = {};

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

    // Module import paths overrides
    this.userAddedModulePaths = {};

    // Stores data for setImportPathList(), importPathList(), and addImportPath
    this.userAddedImportPaths = [];

    //----------Private Members---------

    // Ticker resource id and ticker callbacks
    this._tickers = [];
    this._lastTick = Date.now();

    // Callbacks for stopping or starting the engine
    this._whenStop = [];
    this._whenStart = [];

    // Keyboard management
    this.$initKeyboard();

    //----------Construct----------

    // No QML stuff should stand out the root element
    this.dom.style.overflow = "hidden";

    // Needed to make absolute positioning work
    if (!this.dom.style.position) {
      const style = window.getComputedStyle(this.dom);
      if (style.getPropertyValue("position") === "static") {
        this.dom.style.position = "relative";
        this.dom.style.top = "0";
        this.dom.style.left = "0";
      }
    }

    window.addEventListener("resize", () => this.updateGeometry());
  }

  //---------- Public Methods ----------

  updateGeometry() {
    // we have to call `this.implicitHeight =` and `this.implicitWidth =`
    // each time the root element changes it's geometry
    // to reposition child elements of qml scene
    let width;
    let height;
    if (this.dom === document.body) {
      width = window.innerWidth;
      height = window.innerHeight;
    } else {
      const style = window.getComputedStyle(this.dom);
      width = parseFloat(style.getPropertyValue("width"));
      height = parseFloat(style.getPropertyValue("height"));
    }
    if (width) {
      this.rootObject.width = width;
    }
    if (height) {
      this.rootObject.height = height;
    }
  }

  // Start the engine
  start() {
    QmlWeb.engine = this;
    const QMLOperationState = QmlWeb.QMLOperationState;
    if (this.operationState !== QMLOperationState.Running) {
      this.operationState = QMLOperationState.Running;
      this._tickerId = setInterval(this._tick.bind(this), this.$interval);
      this._whenStart.forEach(callback => callback());
    }
  }

  // Stop the engine
  stop() {
    const QMLOperationState = QmlWeb.QMLOperationState;
    if (this.operationState === QMLOperationState.Running) {
      clearInterval(this._tickerId);
      this.operationState = QMLOperationState.Idle;
      this._whenStop.forEach(callback => callback());
    }
  }

  // eslint-disable-next-line max-len
  /** from http://docs.closure-library.googlecode.com/git/local_closure_goog_uri_uri.js.source.html
   *
   * Removes dot segments in given path component, as described in
   * RFC 3986, section 5.2.4.
   *
   * @param {string} path A non-empty path component.
   * @return {string} Path component with removed dot segments.
   */
  removeDotSegments(path) {
    // path.startsWith("/") is not supported in some browsers
    let leadingSlash = path && path[0] === "/";
    const segments = path.split("/");
    const out = [];

    for (let pos = 0; pos < segments.length;) {
      const segment = segments[pos++];

      if (segment === ".") {
        if (leadingSlash && pos === segments.length) {
          out.push("");
        }
      } else if (segment === "..") {
        if (out.length > 1 || out.length === 1 && out[0] !== "") {
          out.pop();
        }
        if (leadingSlash && pos === segments.length) {
          out.push("");
        }
      } else {
        out.push(segment);
        leadingSlash = true;
      }
    }

    return out.join("/");
  }

  extractBasePath(file) {
    // work both in url ("/") and windows ("\", from file://d:\test\) notation
    const basePath = file.split(/[/\\]/);
    basePath[basePath.length - 1] = "";
    return basePath.join("/");
  }

  extractFileName(file) {
    return file.split(/[/\\]/).pop();
  }

  // Load file, parse and construct (.qml or .qml.js)
  loadFile(file, parentComponent = null) {
    // Create an anchor element to get the absolute path from the DOM
    if (!this.$basePathA) {
      this.$basePathA = document.createElement("a");
    }
    this.$basePathA.href = this.extractBasePath(file);
    this.$basePath = this.$basePathA.href;
    const fileName = this.extractFileName(file);
    const tree = this.loadComponent(this.$resolvePath(fileName));
    return this.loadQMLTree(tree, parentComponent, file);
  }

  // parse and construct qml
  // file is not required; only for debug purposes
  // This function is only used by the QmlWeb tests
  loadQML(src, parentComponent = null, file = undefined) {
    return this.loadQMLTree(QmlWeb.parseQML(src, file), parentComponent, file);
  }

  loadQMLTree(tree, parentComponent = null, file = undefined) {
    QmlWeb.engine = this;

    // Create and initialize objects
    const QMLComponent = QmlWeb.getConstructor("QtQml", "2.0", "Component");
    const component = new QMLComponent({
      object: tree,
      parent: parentComponent
    });

    this.loadImports(tree.$imports, undefined, component.importContextId);
    component.$basePath = this.$basePath;
    component.$imports = tree.$imports; // for later use
    component.$file = file; // just for debugging

    this.rootObject = component.$createObject(parentComponent);
    if (this.rootObject.dom) {
      this.domTarget.appendChild(this.rootObject.dom);
    }
    this.$initializePropertyBindings();

    this.start();

    this.updateGeometry();

    this.callCompletedSignals();

    return component;
  }

  rootContext() {
    return this.rootObject.$context;
  }

  // next 3 methods used in Qt.createComponent for qml files lookup
  // http://doc.qt.io/qt-5/qqmlengine.html#addImportPath

  addImportPath(dirpath) {
    this.userAddedImportPaths.push(dirpath);
  }

  /* Add this dirpath to be checked for components. This is the result of
   * something like:
   *
   * import "SomeDir/AnotherDirectory"
   *
   * The importContextId ensures it is only accessible from the file in which
   * it was imported. */
  addComponentImportPath(importContextId, dirpath, qualifier) {
    if (!this.componentImportPaths) {
      this.componentImportPaths = {};
    }
    if (!this.componentImportPaths[importContextId]) {
      this.componentImportPaths[importContextId] = {};
    }

    const paths = this.componentImportPaths[importContextId];

    if (qualifier) {
      if (!paths.qualified) {
        paths.qualified = {};
      }
      paths.qualified[qualifier] = dirpath;
    } else {
      if (!paths.unqualified) {
        paths.unqualified = [];
      }
      paths.unqualified.push(dirpath);
    }
  }

  importSearchPaths(importContextId) {
    if (!this.componentImportPaths) {
      return [];
    }
    const paths = this.componentImportPaths[importContextId];
    if (!paths) {
      return [];
    }
    return paths.unqualified || [];
  }

  qualifiedImportPath(importContextId, qualifier) {
    if (!this.componentImportPaths) {
      return "";
    }
    const paths = this.componentImportPaths[importContextId];
    if (!paths || !paths.qualified) {
      return "";
    }
    return paths.qualified[qualifier] || "";
  }

  setImportPathList(arrayOfDirs) {
    this.userAddedImportPaths = arrayOfDirs;
  }

  importPathList() {
    return this.userAddedImportPaths;
  }

  // `addModulePath` defines conrete path for module lookup
  // e.g. addModulePath("QtQuick.Controls", "http://example.com/controls")
  // will force system to `import QtQuick.Controls` module from
  // `http://example.com/controls/qmldir`

  addModulePath(moduleName, dirPath) {
    // Keep the mapping. It will be used in loadImports() function.
    // Remove trailing slash as it required for `readQmlDir`.
    this.userAddedModulePaths[moduleName] = dirPath.replace(/\/$/, "");
  }

  registerProperty(obj, propName) {
    const dependantProperties = [];
    let value = obj[propName];

    const getter = () => {
      const QMLProperty = QmlWeb.QMLProperty;
      if (QMLProperty.evaluatingProperty &&
          dependantProperties.indexOf(QMLProperty.evaluatingProperty) === -1) {
        dependantProperties.push(QMLProperty.evaluatingProperty);
      }
      return value;
    };

    const setter = newVal => {
      value = newVal;
      for (const i in dependantProperties) {
        dependantProperties[i].update();
      }
    };

    QmlWeb.setupGetterSetter(obj, propName, getter, setter);
  }

  loadImports(importsArray, currentFileDir = this.$basePath,
      importContextId = -1) {
    if (!this.qmldirsContents) {
      this.qmldirsContents = {}; // cache

      // putting initial keys in qmldirsContents - is a hack. We should find a
      // way to explain to qmlweb, is this built-in module or qmldir-style
      // module.
      for (const module in QmlWeb.modules) {
        if (module !== "Main") {
          this.qmldirsContents[module] = {};
        }
      }
    }

    if (!this.qmldirs) {
      this.qmldirs = {}; // resulting components lookup table
    }

    if (!importsArray || importsArray.length === 0) {
      return;
    }

    for (let i = 0; i < importsArray.length; i++) {
      this.loadImport(importsArray[i], currentFileDir, importContextId);
    }
  }

  loadImport(entry, currentFileDir, importContextId) {
    let name = entry[1];

    // is it url to remote resource
    const nameIsUrl = name.indexOf("//") === 0 || name.indexOf("://") >= 0;
    // is it a module name, e.g. QtQuick, QtQuick.Controls, etc
    const nameIsQualifiedModuleName = entry[4];
    // is it a js file
    const nameIsJs = name.slice(-3) === ".js";
    // local [relative] dir
    const nameIsDir = !nameIsQualifiedModuleName && !nameIsUrl && !nameIsJs;

    if (nameIsDir) {
      name = this.$resolvePath(name, currentFileDir);
      if (name[name.length - 1] === "/") {
        // remove trailing slash as it required for `readQmlDir`
        name = name.substr(0, name.length - 1);
      }
    }

    let content = this.qmldirsContents[name];
    // check if we have already loaded that qmldir file
    if (!content) {
      if (nameIsQualifiedModuleName && this.userAddedModulePaths[name]) {
        // 1. we have qualified module and user had configured path for that
        // module with this.addModulePath
        content = QmlWeb.readQmlDir(this.userAddedModulePaths[name]);
      } else if (nameIsUrl || nameIsDir) {
        // 2. direct load
        // nameIsUrl => url do not need dirs
        // nameIsDir => already computed full path above
        content = QmlWeb.readQmlDir(name);
      } else if (nameIsJs) {
        // 3. Js file, don't need qmldir
      } else {
        // 4. qt-style lookup for qualified module
        const probableDirs = [currentFileDir].concat(this.importPathList());
        const diredName = name.replace(/\./g, "/");

        for (let k = 0; k < probableDirs.length; k++) {
          const file = probableDirs[k] + diredName;
          content = QmlWeb.readQmlDir(file);
          if (content) {
            break;
          }
        }
      }
      this.qmldirsContents[name] = content;
    }

    /* If there is no qmldir, add these directories to the list of places to
      * search for components (within this import scope). "noqmldir" is
      * inserted into the qmldir cache to avoid future attempts at fetching
      * the qmldir file, but we always need to the call to
      * "addComponentImportPath" for these sorts of directories. */
    if (!content || content === "noqmldir") {
      if (nameIsDir) {
        if (entry[3]) {
          /* Use entry[1] directly, as we don't want to include the
            * basePath, otherwise it gets prepended twice in
            * createComponent. */
          this.addComponentImportPath(importContextId,
            `${entry[1]}/`, entry[3]);
        } else {
          this.addComponentImportPath(importContextId, `${name}/`);
        }
      }

      this.qmldirsContents[name] = "noqmldir";
      return;
    }

    // copy founded externals to global var
    // TODO actually we have to copy it to current component
    for (const attrname in content.externals) {
      this.qmldirs[attrname] = content.externals[attrname];
    }

    // keep already loaded qmldir files
    this.qmldirsContents[name] = content;
  }

  size() {
    return {
      width: this.rootObject.getWidth(),
      height: this.rootObject.getHeight()
    };
  }

  focusedElement() {
    return this.rootContext().activeFocus;
  }

  //---------- Private Methods ----------

  $initKeyboard() {
    document.onkeydown = e => {
      let focusedElement = this.focusedElement();
      const event = QmlWeb.eventToKeyboard(e || window.event);
      const eventName = QmlWeb.keyboardSignals[event.key];

      if (this.rootObject.$shortcuts) {
        for (const shortcut of this.rootObject.$shortcuts) {
          shortcut.Keys.$onPress(event);
          if (event.accepted) {
            break;
          }
        }
      }
      while (focusedElement && !event.accepted) {
        const backup = focusedElement.$context.event;
        focusedElement.$context.event = event;
        focusedElement.Keys.$onPress(event);
        if (eventName && focusedElement.Keys[eventName]) {
          focusedElement.Keys[eventName](event);
        }
        focusedElement.$context.event = backup;
        if (event.accepted) {
          e.preventDefault();
        } else {
          focusedElement = focusedElement.$parent;
        }
      }
    };

    document.onkeyup = e => {
      let focusedElement = this.focusedElement();
      const event = QmlWeb.eventToKeyboard(e || window.event);

      while (focusedElement && !event.accepted) {
        const backup = focusedElement.$context.event;
        focusedElement.$context.event = event;
        focusedElement.Keys.released(event);
        focusedElement.$context.event = backup;
        if (event.accepted) {
          e.preventDefault();
        } else {
          focusedElement = focusedElement.$parent;
        }
      }
    };
  }

  _tick() {
    const now = Date.now();
    const elapsed = now - this._lastTick;
    this._lastTick = now;
    this._tickers.forEach(ticker => ticker(now, elapsed));
  }

  // Load resolved file, parse and construct as Component (.qml)
  loadComponent(file) {
    if (file in this.components) {
      return this.components[file];
    }

    const uri = this.$parseURI(file);
    if (!uri) {
      return undefined;
    }

    let tree;
    if (uri.scheme === "qrc://") {
      tree = QmlWeb.qrc[uri.path];
      if (!tree) {
        return undefined;
      }
      // QmlWeb.qrc contains pre-parsed Component objects, but they still need
      // convertToEngine called on them.
      tree = QmlWeb.convertToEngine(tree);
    } else {
      const src = QmlWeb.getUrlContents(file, true);
      if (!src) {
        console.error("QMLEngine.loadComponent: Failed to load:", file);
        return undefined;
      }

      console.log("QMLEngine.loadComponent: Loading file:", file);
      tree = QmlWeb.parseQML(src, file);
    }

    if (!tree) {
      return undefined;
    }

    if (tree.$children.length !== 1) {
      console.error("QMLEngine.loadComponent: Failed to load:", file,
        ": A QML component must only contain one root element!");
      return undefined;
    }

    tree.$file = file;
    this.components[file] = tree;
    return tree;
  }

  // Load resolved file and parse as JavaScript
  loadJS(file) {
    if (file in this.js) {
      return this.js[file];
    }

    const uri = this.$parseURI(file);
    if (!uri) {
      return undefined;
    }

    let jsData;
    if (uri.scheme === "qrc://") {
      jsData = QmlWeb.qrc[uri.path];
    } else {
      QmlWeb.loadParser();
      jsData = QmlWeb.jsparse(QmlWeb.getUrlContents(file));
    }

    if (!jsData) {
      return undefined;
    }

    // Remove any ".pragma" statements, as they are not valid JavaScript
    jsData.source = jsData.source.replace(/\.pragma.*(?:\r\n|\r|\n)/, "\n");

    const contextSetter = new Function("$context", `
      with(QmlWeb) with ($context) {
        ${jsData.source}
      }
      ${jsData.exports.map(sym => `$context.${sym} = ${sym};`).join("")}
    `);

    this.js[file] = contextSetter;

    return contextSetter;
  }

  $registerStart(f) {
    this._whenStart.push(f);
  }

  $registerStop(f) {
    this._whenStop.push(f);
  }

  $addTicker(t) {
    this._tickers.push(t);
  }

  $removeTicker(t) {
    const index = this._tickers.indexOf(t);
    if (index !== -1) {
      this._tickers.splice(index, 1);
    }
  }

  $initializePropertyBindings() {
    // Initialize property bindings
    // we use `while`, because $initializePropertyBindings may be called
    // recursive (because of Loader and/or createQmlObject )
    while (this.bindedProperties.length > 0) {
      const property = this.bindedProperties.shift();

      if (!property.binding) {
        // Probably, the binding was overwritten by an explicit value. Ignore.
        continue;
      }

      if (property.needsUpdate) {
        property.update();
      } else if (geometryProperties.indexOf(property.name) >= 0) {
        // It is possible that bindings with these names was already evaluated
        // during eval of other bindings but in that case $updateHGeometry and
        // $updateVGeometry could be blocked during their eval.
        // So we call them explicitly, just in case.
        const { obj, changed } = property;
        if (obj.$updateHGeometry &&
            changed.isConnected(obj, obj.$updateHGeometry)) {
          obj.$updateHGeometry(property.val, property.val, property.name);
        }
        if (obj.$updateVGeometry &&
            changed.isConnected(obj, obj.$updateVGeometry)) {
          obj.$updateVGeometry(property.val, property.val, property.name);
        }
      }
    }

    this.$initializeAliasSignals();
  }

  // This parses the full URL into scheme, authority and path
  $parseURI(uri) {
    if (!uri.match(/^qrc:\//i)) {
      const match = uri.match(/^([^/]*?:\/\/)(.*?)(\/.*)$/);
      if (match) {
        return {
          scheme: match[1],
          authority: match[2],
          path: QmlWeb.helpers.reduceUri(match[3])
        };
      }
    } else {
      const match = uri.match(/^([^/]*?:\/\/?)(.*?)$/);
      if (match) {
        return {
          scheme: "qrc://",
          authority: "",
          path: QmlWeb.helpers.reduceUri(match[2])
        };
      }
    }
    return undefined;
  }

  // Return a path to load the file
  $resolvePath(file, basePath = this.$basePath) {
    if (!file || file.indexOf(":/") !== -1) {
      return file;
    }

    const schemes = ["data:", "blob:", "about:"];
    for (let i = 0; i < schemes.length; i++) {
      if (file.lastIndexOf(schemes[i], 0) === 0) {
        return file;
      }
    }

    const basePathURI = this.$parseURI(basePath);
    if (!basePathURI) {
      return file;
    }

    let path = basePathURI.path;
    if (file.indexOf("/") === 0) {
      path = file;
    } else {
      path = `${path}${file}`;
    }

    // Remove duplicate slashes and dot segments in the path
    path = this.removeDotSegments(path.replace(/([^:]\/)\/+/g, "$1"));

    return `${basePathURI.scheme}${basePathURI.authority}${path}`;
  }

  // Return a DOM-valid path to load the image (fileURL is an already-resolved
  // URL)
  $resolveImageURL(fileURL) {
    const uri = this.$parseURI(fileURL);
    // If we are within the resource system, look up a "real" path that can be
    // used by the DOM. If not found, return the path itself without the
    // "qrc://" scheme.
    if (uri && uri.scheme === "qrc://") {
      return QmlWeb.qrc[uri.path] || uri.path;
    }

    // Something we can't parse, just pass it through
    return fileURL;
  }

  $initializeAliasSignals() {
    // Perform pending operations. Now we use it only to init alias's "changed"
    // handlers, that's why we have such strange function name.
    while (this.pendingOperations.length > 0) {
      const op = this.pendingOperations.shift();
      op[0](op[1], op[2], op[3]);
    }
    this.pendingOperations = [];
  }

  callCompletedSignals() {
    // the while loop is better than for..in loop, because completedSignals
    // array might change dynamically when some completed signal handlers will
    // create objects dynamically via createQmlObject or Loader
    while (this.completedSignals.length > 0) {
      const handler = this.completedSignals.shift();
      handler();
    }
  }
}

QmlWeb.QMLEngine = QMLEngine;
