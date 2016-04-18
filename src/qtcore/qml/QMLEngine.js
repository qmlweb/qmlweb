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
QMLEngine = function (element, options) {
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

    // Root object of the engine
    this.rootObject = null;

    // Base path of qml engine (used for resource loading)
    this.$basePath = "";


//----------Public Methods----------
    // Start the engine
    this.start = function()
    {
        engine = this;
        var i;
        if (this.operationState !== QMLOperationState.Running) {
            this.operationState = QMLOperationState.Running;
            tickerId = setInterval(tick, this.$interval);
            for (i = 0; i < whenStart.length; i++) {
                whenStart[i]();
            }
        }
    }

    // Stop the engine
    this.stop = function()
    {
        var i;
        if (this.operationState == QMLOperationState.Running) {
            clearInterval(tickerId);
            this.operationState = QMLOperationState.Idle;
            for (i = 0; i < whenStop.length; i++) {
                whenStop[i]();
            }
        }
    }


    this.ensureFileIsLoadedInQrc = function(file) {
      if (!qrc.includesFile(file)) {
        var src = getUrlContents(file);

        if (src) {
            console.log('Loading file [', file, ']');
            qrc[file] = qmlweb_parse(src, qmlweb_parse.QMLDocument);
        } else {
            console.log('Can not load file [', file, ']');
        }
      }
    }

    this.extractBasePath = function( file ) {
       var basePath = file.split(/[\/\\]/); // work both in url ("/") and windows ("\", from file://d:\test\) notation
       basePath[basePath.length - 1] = "";
       basePath = basePath.join("/");
       return basePath;
    }
    // Load file, parse and construct (.qml or .qml.js)
    this.loadFile = function(file) {
        var tree;

        this.$basePath = this.extractBasePath(file);
        this.ensureFileIsLoadedInQrc(file);
        tree = convertToEngine(qrc[file]);
        this.loadQMLTree(tree);
    }

    // parse and construct qml
    this.loadQML = function(src) {
        this.loadQMLTree(parseQML(src));
    }

    this.loadQMLTree = function(tree, file) {
        engine = this;
        if (options.debugTree) {
            options.debugTree(tree);
        }

        // Create and initialize objects
        var component = new QMLComponent({ object: tree, parent: null });

        this.loadImports( tree.$imports );
        component.$basePath = engine.$basePath;
        component.$imports = tree.$imports; // for later use
        component.$file = file; // just for debugging

        this.rootObject = component.createObject(null);
        component.finalizeImports(this.rootContext());
        this.$initializePropertyBindings();

        this.start();

        this.callCompletedSignals();
    }

    /** from http://docs.closure-library.googlecode.com/git/local_closure_goog_uri_uri.js.source.html
     *
     * Removes dot segments in given path component, as described in
     * RFC 3986, section 5.2.4.
     *
     * @param {string} path A non-empty path component.
     * @return {string} Path component with removed dot segments.
     */
    this.removeDotSegments = function(path) {
        var leadingSlash = (path && path[0] == "/");   // path.startsWith('/'); -- startsWith seems to be undefined in some browsers
        var segments = path.split('/');
        var out = [];

        for (var pos = 0; pos < segments.length; ) {
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

    this.loadImports = function(importsArray, currentFileDir) {
        if (!this.qmldirsContents) this.qmldirsContents = { "QtQuick":{}, "QtQuick.Controls":{} }; // cache
        // putting initial keys in qmldirsContents - is a hack. We should find a way to explain to qmlweb, is this built-in module or qmldir-style module.

        if (!this.qmldirs) this.qmldirs = {};                 // resulting components lookup table

        if (!importsArray || importsArray.length == 0) return;
        if (!currentFileDir) currentFileDir = this.$basePath;     // use this.$basePath by default

        for (var i=0; i<importsArray.length; i++) {
            var entry = importsArray[i];

            var name = entry[1];

            var nameIsUrl = name.indexOf("//") == 0 || name.indexOf("://") >= 0;  // is it url to remote resource
            var nameIsQualifiedModuleName = entry[4]; // e.g. QtQuick, QtQuick.Controls, etc
            var nameIsDir = !nameIsQualifiedModuleName && !nameIsUrl; // local [relative] dir

            if (nameIsDir) {
                // resolve name from relative to full dir path
                // we hope all dirs are relative
                name = this.removeDotSegments( currentFileDir + name );
                if (name[ name.length-1 ] == "/")
                    name = name.substr( 0, name.length-1 ); // remove trailing slash as it required for `readQmlDir`
            }
            // TODO if nameIsDir, we have also to add `name` to importPathList() for current component...

            // check if we have already loaded that qmldir file
            if (this.qmldirsContents[ name ]) continue;

            var content = false;
            if (nameIsQualifiedModuleName && this.userAddedModulePaths && this.userAddedModulePaths[ name ]) {
                // 1. we have qualified module and user had configured path for that module with this.addModulePath
                content = readQmlDir( this.userAddedModulePaths[ name ] );
            }
            else if (nameIsUrl || nameIsDir)
            {
                // 2. direct load
                // nameIsUrl => url do not need dirs
                // nameIsDir => already computed full path above
                content = readQmlDir( name );
            }
            else
            {
                // 3. qt-style lookup for qualified module
                var probableDirs = [currentFileDir].concat( this.importPathList() )
                var diredName = name.replace( /\./g,"/" );

                for (var k=0; k<probableDirs.length; k++) {
                    var file = probableDirs[k] + diredName;
                    content = readQmlDir( file );
                    if (content) break;
                }
            }

            if (!content) {
                console.log("qmlengine::loadImports: cannot load qmldir file for import name=",name );
                // save blank info, meaning that we failed to load import
                // this prevents repeated lookups
                this.qmldirsContents[ name ] = {};

               // NEW
               // add that dir to import path list
               // that means, lookup qml files in that failed dir by trying to load them directly
               // this is not the same behavior as in Qt for "url" schemes,
               // but it is same as for ordirnal disk files. 
               // So, we do it for experimental purposes.
               if (nameIsDir) 
                 this.addImportPath( name + "/" );

               continue;
            }

            // copy founded externals to global var
            // TODO actually we have to copy it to current component
            for (var attrname in content.externals) { this.qmldirs[attrname] = content.externals[attrname]; }

            // keep already loaded qmldir files
            this.qmldirsContents[ name ] = content;
        }

    }

    this.rootContext = function() {
      return this.rootObject.$context;
    }

    this.focusedElement = (function() {
      return this.rootContext().activeFocus;
    }).bind(this);

    // KEYBOARD MANAGEMENT
    var keyboardSignals = {};
    keyboardSignals[Qt.Key_Asterisk]   = 'asteriskPressed';
    keyboardSignals[Qt.Key_Back]       = 'backPressed';
    keyboardSignals[Qt.Key_Backtab]    = 'backtabPressed';
    keyboardSignals[Qt.Key_Call]       = 'callPressed';
    keyboardSignals[Qt.Key_Cancel]     = 'cancelPressed';
    keyboardSignals[Qt.Key_Delete]     = 'deletePressed';
    keyboardSignals[Qt.Key_0]          = 'digit0Pressed';
    keyboardSignals[Qt.Key_1]          = 'digit1Pressed';
    keyboardSignals[Qt.Key_2]          = 'digit2Pressed';
    keyboardSignals[Qt.Key_3]          = 'digit3Pressed';
    keyboardSignals[Qt.Key_4]          = 'digit4Pressed';
    keyboardSignals[Qt.Key_5]          = 'digit5Pressed';
    keyboardSignals[Qt.Key_6]          = 'digit6Pressed';
    keyboardSignals[Qt.Key_7]          = 'digit7Pressed';
    keyboardSignals[Qt.Key_8]          = 'digit8Pressed';
    keyboardSignals[Qt.Key_9]          = 'digit9Pressed';
    keyboardSignals[Qt.Key_Escape]     = 'escapePressed';
    keyboardSignals[Qt.Key_Flip]       = 'flipPressed';
    keyboardSignals[Qt.Key_Hangup]     = 'hangupPressed';
    keyboardSignals[Qt.Key_Menu]       = 'menuPressed';
    keyboardSignals[Qt.Key_No]         = 'noPressed';
    keyboardSignals[Qt.Key_Return]     = 'returnPressed';
    keyboardSignals[Qt.Key_Select]     = 'selectPressed';
    keyboardSignals[Qt.Key_Space]      = 'spacePressed';
    keyboardSignals[Qt.Key_Tab]        = 'tabPressed';
    keyboardSignals[Qt.Key_VolumeDown] = 'volumeDownPressed';
    keyboardSignals[Qt.Key_VolumeUp]   = 'volumeUpPressed';
    keyboardSignals[Qt.Key_Yes]        = 'yesPressed';
    keyboardSignals[Qt.Key_Up]         = 'upPressed';
    keyboardSignals[Qt.Key_Right]      = 'rightPressed';
    keyboardSignals[Qt.Key_Down]       = 'downPressed';
    keyboardSignals[Qt.Key_Left]       = 'leftPressed';

    function keyCodeToQt(e) {
      e.keypad = e.keyCode >= 96 && e.keyCode <= 111;
      if (e.keyCode == Qt.Key_Tab && e.shiftKey == true)
        return Qt.Key_Backtab;
      else if (e.keyCode >= 97 && e.keyCode <= 122)
        return e.keyCode - (97 - Qt.Key_A);
      return e.keyCode;
    }

    function eventToKeyboard(e) {
        return {
            accepted: false,
            count: 1,
            isAutoRepeat: false,
            key: keyCodeToQt(e),
            modifiers: (e.ctrlKey * Qt.CtrlModifier)
                    | (e.altKey   * Qt.AltModifier)
                    | (e.shiftKey * Qt.ShiftModifier)
                    | (e.metaKey  * Qt.MetaModifier)
                    | (e.keypad   * Qt.KeypadModifier),
            text: String.fromCharCode(e.charCode)
        };
    }

    document.onkeypress = (function(e) {
      var focusedElement = this.focusedElement();
      var event          = eventToKeyboard(e || window.event);
      var eventName      = keyboardSignals[event.key];

      while (event.accepted != true && focusedElement != null) {
        var backup       = focusedElement.$context.event;

        focusedElement.$context.event = event;
        focusedElement.Keys.pressed(event);
        if (eventName != null)
          focusedElement.Keys[eventName](event);
        focusedElement.$context.event = backup;
        if (event.accepted == true)
          e.preventDefault();
        else
          focusedElement = focusedElement.$parent;
      }
    }).bind(this);

    document.onkeyup = (function(e) {
      var focusedElement = this.focusedElement();
      var event          = eventToKeyboard(e || window.event);

      while (event.accepted != true && focusedElement != null) {
        var backup       = focusedElement.$context.event;

        focusedElement.$context.event = event;
        focusedElement.Keys.released(event);
        focusedElement.$context.event = backup;
        if (event.accepted == true)
          e.preventDefault();
        else
          focusedElement = focusedElement.$parent;
      }
    }).bind(this);
    // END KEYBOARD MANAGEMENT

    this.registerProperty = function(obj, propName)
    {
        var dependantProperties = [];
        var value = obj[propName];

        function getter() {
            if (evaluatingProperty && dependantProperties.indexOf(evaluatingProperty) == -1)
                dependantProperties.push(evaluatingProperty);

            return value;
        }

        function setter(newVal) {
            value = newVal;

            for (i in dependantProperties)
                dependantProperties[i].update();
        }

        setupGetterSetter(obj, propName, getter, setter);
    }

    // next 3 methods used in Qt.createComponent for qml files lookup
    // please open qt site for documentation
    // http://doc.qt.io/qt-5/qqmlengine.html#addImportPath

    this.addImportPath = function( dirpath ) {
        if (!this.userAddedImportPaths) this.userAddedImportPaths = [];
        this.userAddedImportPaths.push( dirpath );
    }

    this.setImportPathList = function( arrayOfDirs )
    {
        this.userAddedImportPaths = arrayOfDirs;
    }

    this.importPathList = function() {
        return (this.userAddedImportPaths || []);
    }

    // `addModulePath` defines conrete path for module lookup
    // e.g. addModulePath( "QtQuick.Controls","http://someserver.com/controls" )
    // will force system to `import QtQuick.Controls` module from `http://someserver.com/controls/qmldir`

    this.addModulePath = function( moduleName, dirPath ) {

        // remove trailing slash as it required for `readQmlDir`
        if (dirPath[ dirPath.length-1 ] == "/")
            dirPath = dirPath.substr( 0, dirPath.length-1 );

        // keep the mapping. It will be used in loadImports() function .
        if (!this.userAddedModulePaths) this.userAddedModulePaths = {};
        this.userAddedModulePaths[ moduleName ] = dirPath;
    }

//Intern

    // Load file, parse and construct as Component (.qml)
    this.loadComponent = function(name)
    {
        if (name in this.components)
            return this.components[name];

        var file = qmlEngine.$basePath + name + ".qml";

        this.ensureFileIsLoadedInQrc(file);
        tree = convertToEngine(qrc[file]);
        this.components[name] = tree;
        return tree;
    }

    this.$initializePropertyBindings = function() {
        // Initialize property bindings
        for (var i = 0; i < this.bindedProperties.length; i++) {
            var property = this.bindedProperties[i];
            if (!property.binding)
              continue; // Probably, the binding was overwritten by an explicit value. Ignore.
            property.binding.compile();
            property.update();
        }
        this.bindedProperties = [];
    }

    // Return a path to load the file
    this.$resolvePath = function(file)
    {
        // probably, replace :// with :/ ?
        if (file == "" || file.indexOf("://") != -1 || file.indexOf("/") == 0 || file.indexOf("data:") == 0 || file.indexOf("blob:") == 0) {
            return file;
        }
        return this.$basePath + file;
    }

    this.$registerStart = function(f)
    {
        whenStart.push(f);
    }

    this.$registerStop = function(f)
    {
        whenStop.push(f);
    }

    this.$addTicker = function(t)
    {
        tickers.push(t);
    }

    this.$removeTicker = function(t)
    {
        var index = tickers.indexOf(t);
        if (index != -1) {
            tickers.splice(index, 1);
        }
    }

    this.size = function()
    {
        return { width: this.rootObject.getWidth(), height: this.rootObject.getHeight() };
    }

//----------Private Methods----------

    function tick()
    {
        var i,
            now = (new Date).getTime(),
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
        console.log = function() {
            var args = Array.prototype.slice.call(arguments);
            options.debugConsole.apply(undefined, args);
        };
    }

    // TODO: Move to module initialization
    for (i in constructors) {
        if (constructors[i].getAttachedObject)
            setupGetter(QMLBaseObject.prototype, i, constructors[i].getAttachedObject);
    }
}

QMLEngine.prototype.callCompletedSignals = function() {
  // the while loop is better than for..in loop, because completedSignals array might change dynamically when
  // some completed signal handlers will create objects dynamically via createQmlObject or Loader
  while (this.completedSignals.length > 0) {
     var handler = this.completedSignals.shift();
     handler();
  }
};
