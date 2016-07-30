// There can only be one running QMLEngine.
// This variable points to the currently running engine.
QmlWeb.engine = null;

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
    this.running = false;
    this.rootElement = element;

    // List of available Components
    this.components = {};

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

    // TODO: Move to module initialization
    const QMLBaseObject = getConstructor("QtQml", "2.0", "QtObject");
    for (const i in constructors) {
      if (constructors[i].getAttachedObject) {
        setupGetter(QMLBaseObject.prototype, i,
                    constructors[i].getAttachedObject);
      }
    }
  }

  //---------- Public Methods ----------

  // Start the engine
  start() {
    QmlWeb.engine = this;
    if (this.operationState !== QMLOperationState.Running) {
      this.operationState = QMLOperationState.Running;
      this._tickerId = setInterval(this._tick.bind(this), this.$interval);
      this._whenStart.forEach(callback => callback());
    }
  }

  // Stop the engine
  stop() {
    if (this.operationState === QMLOperationState.Running) {
      clearInterval(this._tickerId);
      this.operationState = QMLOperationState.Idle;
      this._whenStop.forEach(callback => callback());
    }
  }

  ensureFileIsLoadedInQrc(file) {
    if (qrc.hasOwnProperty(file)) {
      return;
    }

    const src = getUrlContents(file);
    if (!src) {
      console.log("Can not load file [", file, "]");
      return;
    }

    loadParser();
    console.log("Loading file [", file, "]");
    qrc[file] = QmlWeb.parse(src, QmlWeb.parse.QMLDocument);
  }

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
    const basePath = file.split(/[\/\\]/);
    basePath[basePath.length - 1] = "";
    return basePath.join("/");
  }

  // Load file, parse and construct (.qml or .qml.js)
  loadFile(file, parentComponent = null) {
    this.$basePath = this.extractBasePath(file);
    this.ensureFileIsLoadedInQrc(file);
    const tree = convertToEngine(qrc[file]);
    return this.loadQMLTree(tree, parentComponent, file);
  }

  // parse and construct qml
  // file is not required; only for debug purposes
  loadQML(src, parentComponent = null, file = undefined) {
    return this.loadQMLTree(parseQML(src, file), parentComponent, file);
  }

  loadQMLTree(tree, parentComponent = null, file = undefined) {
    QmlWeb.engine = this;

    // Create and initialize objects
    const QMLComponent = getConstructor("QtQml", "2.0", "Component");
    const component = new QMLComponent({
      object: tree,
      parent: parentComponent
    });

    this.loadImports(tree.$imports);
    component.$basePath = this.$basePath;
    component.$imports = tree.$imports; // for later use
    component.$file = file; // just for debugging

    this.rootObject = component.createObject(parentComponent);
    component.finalizeImports(this.rootContext());
    this.$initializePropertyBindings();

    this.start();

    this.callCompletedSignals();

    return component;
  }

  rootContext() {
    return this.rootObject.$context;
  }

  // next 3 methods used in Qt.createComponent for qml files lookup
  // http://doc.qt.io/qt-5/qqmlengine.html#addImportPath

  addImportPath(dirpath) {
    if (!this.userAddedImportPaths) {
      this.userAddedImportPaths = [];
    }
    this.userAddedImportPaths.push(dirpath);
  }

  setImportPathList(arrayOfDirs) {
    this.userAddedImportPaths = arrayOfDirs;
  }

  importPathList() {
    return this.userAddedImportPaths || [];
  }

  // `addModulePath` defines conrete path for module lookup
  // e.g. addModulePath("QtQuick.Controls", "http://example.com/controls")
  // will force system to `import QtQuick.Controls` module from
  // `http://example.com/controls/qmldir`

  addModulePath(moduleName, dirPath) {
    let resolvedPath;
    if (dirPath[dirPath.length - 1] === "/") {
      // remove trailing slash as it required for `readQmlDir`
      resolvedPath = dirPath.substr(0, dirPath.length - 1);
    } else {
      resolvedPath = dirPath;
    }

    // keep the mapping. It will be used in loadImports() function .
    if (!this.userAddedModulePaths) {
      this.userAddedModulePaths = {};
    }
    this.userAddedModulePaths[moduleName] = resolvedPath;
  }

  registerProperty(obj, propName) {
    const dependantProperties = [];
    let value = obj[propName];

    const getter = () => {
      if (evaluatingProperty && dependantProperties.indexOf(evaluatingProperty) === -1) {
        dependantProperties.push(evaluatingProperty);
      }
      return value;
    };

    const setter = newVal => {
      value = newVal;
      for (const i in dependantProperties) {
        dependantProperties[i].update();
      }
    };

    setupGetterSetter(obj, propName, getter, setter);
  }

  loadImports(importsArray, currentFileDir = this.$basePath) {
    if (!this.qmldirsContents) {
      this.qmldirsContents = {}; // cache

      // putting initial keys in qmldirsContents - is a hack. We should find a
      // way to explain to qmlweb, is this built-in module or qmldir-style
      // module.
      for (const module in modules) {
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
      const entry = importsArray[i];
      let name = entry[1];

      // is it url to remote resource
      const nameIsUrl = name.indexOf("//") === 0 || name.indexOf("://") >= 0;
      // is it a module name, e.g. QtQuick, QtQuick.Controls, etc
      const nameIsQualifiedModuleName = entry[4];
      // local [relative] dir
      const nameIsDir = !nameIsQualifiedModuleName && !nameIsUrl;

      if (nameIsDir) {
        // resolve name from relative to full dir path
        // we hope all dirs are relative
        if (currentFileDir && currentFileDir.length > 0) {
          name = this.removeDotSegments(currentFileDir + name);
        }
        if (name[name.length - 1] === "/") {
          // remove trailing slash as it required for `readQmlDir`
          name = name.substr(0, name.length - 1);
        }
      }
      // TODO if nameIsDir, we have also to add `name` to importPathList() for
      // current component...

      // check if we have already loaded that qmldir file
      if (this.qmldirsContents[name]) {
        continue;
      }

      let content = false;
      if (nameIsQualifiedModuleName && this.userAddedModulePaths &&
          this.userAddedModulePaths[name]
      ) {
        // 1. we have qualified module and user had configured path for that
        // module with this.addModulePath
        content = readQmlDir(this.userAddedModulePaths[name]);
      } else if (nameIsUrl || nameIsDir) {
        // 2. direct load
        // nameIsUrl => url do not need dirs
        // nameIsDir => already computed full path above
        content = readQmlDir(name);
      } else {
        // 3. qt-style lookup for qualified module
        const probableDirs = [currentFileDir].concat(this.importPathList());
        const diredName = name.replace(/\./g, "/");

        for (let k = 0; k < probableDirs.length; k++) {
          const file = probableDirs[k] + diredName;
          content = readQmlDir(file);
          if (content) {
            break;
          }
        }
      }

      if (!content) {
        console.log(
          "qmlengine::loadImports: cannot load qmldir file for import name=",
          name
        );
        // save blank info, meaning that we failed to load import
        // this prevents repeated lookups
        this.qmldirsContents[ name ] = {};

        // NEW
        // add that dir to import path list
        // that means, lookup qml files in that failed dir by trying to load
        // them directly
        // this is not the same behavior as in Qt for "url" schemes,
        // but it is same as for ordirnal disk files.
        // So, we do it for experimental purposes.
        if (nameIsDir) {
          this.addImportPath(`${name}/`);
        }

        continue;
      }

      // copy founded externals to global var
      // TODO actually we have to copy it to current component
      for (const attrname in content.externals) {
        this.qmldirs[attrname] = content.externals[attrname];
      }

      // keep already loaded qmldir files
      this.qmldirsContents[ name ] = content;
    }
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
    document.onkeypress = e => {
      let focusedElement = this.focusedElement();
      const event = QmlWeb.eventToKeyboard(e || window.event);
      const eventName = QmlWeb.keyboardSignals[event.key];

      while (focusedElement && !event.accepted) {
        const backup = focusedElement.$context.event;
        focusedElement.$context.event = event;
        focusedElement.Keys.pressed(event);
        if (eventName) {
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

  // Load file, parse and construct as Component (.qml)
  loadComponent(name) {
    if (name in this.components) {
      return this.components[name];
    }

    const file = `${this.$basePath}${name}.qml`;
    this.ensureFileIsLoadedInQrc(file);
    const tree = convertToEngine(qrc[file]);
    this.components[name] = tree;
    return tree;
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

  // Return a path to load the file
  $resolvePath(file) {
    // probably, replace :// with :/ ?
    if (file === "" || file.indexOf("://") !== -1 || file.indexOf("/") === 0 ||
        file.indexOf("data:") === 0 || file.indexOf("blob:") === 0) {
      return file;
    }
    return this.$basePath + file;
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
