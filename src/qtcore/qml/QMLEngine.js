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

    // Mouse Handling
    this.mouseAreas = [];
    this.oldMousePos = {x:0, y:0};

    // List of available Components
    this.components = {};

    this.rootElement = element;

    // List of Component.completed signals
    this.completedSignals = [];

    // Current operation state of the engine (Idle, init, etc.)
    this.operationState = 1;

    // List of properties whose values are bindings. For internal use only.
    this.bindedProperties = [];


//----------Public Methods----------
    // Start the engine
    this.start = function()
    {
        engine = this;
        var i;
        if (this.operationState !== QMLOperationState.Running) {
            this.operationState = QMLOperationState.Running;
            tickerId = setInterval(tick, this.$interval);  // TODO: considering performance: shouldn't it we start only when we have active animation
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
            element.removeEventListener("touchstart", touchHandler);
            element.removeEventListener("mousemove", mousemoveHandler);
            clearInterval(tickerId);
            this.operationState = QMLOperationState.Idle;
            for (i = 0; i < whenStop.length; i++) {
                whenStop[i]();
            }
        }
    }

    this.pathFromFilepath = function(file) {
      var basePath = file.split("/");
      basePath[basePath.length - 1] = "";
      basePath = basePath.join("/");
      return basePath;
    }

    this.ensureFileIsLoadedInQrc = function(file) {
      if (!qrc.includesFile(file)) {
        var src = getUrlContents(file);

        if (src) {
            console.log('Loading file [', file,']');
            qrc[file] = qmlparse(src);
        }else {
            console.log('Can nor load file [', file,']');
        }
      }
    }
    
    // Load file, parse and construct (.qml or .qml.js)
    this.loadFile = function(file, parentComponent) {
        var tree;

        basePath = this.pathFromFilepath(file);
        this.basePath = basePath;
        this.ensureFileIsLoadedInQrc(file);
        tree = convertToEngine(qrc[file]);
        return this.loadQMLTree(tree, parentComponent);
    }

    // parse and construct qml
    this.loadQML = function(src) {
        this.loadQMLTree(parseQML(src), null);
    }

    this.loadQMLTree = function(tree, parentComponent) {
        engine = this;
        if (options.debugTree) {
            options.debugTree(tree);
        }

        // Create and initialize objects
        var component = new QMLComponent({ object: tree, parent: parentComponent });
        doc = component.createObject(parentComponent);
        component.finalizeImports();
        this.$initializePropertyBindings();

        this.start();

        // Call completed signals
        for (var i in this.completedSignals) {
            this.completedSignals[i]();
        }
        
        return component;
    }

    this.rootContext = function() {
        return global.qmlEngine.doc.$context;
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
      if (e.keyCode >= 96 && e.keyCode <= 111) {
        e.keypad = true;
      }
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

//Intern

    // Load file, parse and construct as Component (.qml)
    this.loadComponent = function(name)
    {
        if (name in this.components)
            return this.components[name];

        var file = basePath + name + ".qml";

        this.ensureFileIsLoadedInQrc(file);
        tree = convertToEngine(qrc[file]);
        this.components[name] = tree;
        return tree;
    }

    this.$initializePropertyBindings = function() {
        var property;
        
        // Initialize property bindings
        for (var i = 0; i < this.bindedProperties.length; i++) {
            property = this.bindedProperties[i];
            if (!property) continue;
 
            if (property.binding != null) {
               property.binding.compile();
            }
            property.update();
        }
        this.bindedProperties.length = 0;
    }

    this.$getTextMetrics = function(text, fontCss)
    {
        canvas.save();
        canvas.font = fontCss;
        var metrics = canvas.measureText(text);
        canvas.restore();
        return metrics;
    }

    // Return a path to load the file
    this.$resolvePath = function(file)
    {
        if (file == "" || file.indexOf("://") != -1 || file.indexOf("/") == 0) {
            return file;
        }
        return basePath + file;
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
        return { width: doc.getWidth(), height: doc.getHeight() };
    }

    // Performance measurements
    this.$perfDraw = function(canvas)
    {
        doc.$draw(canvas);
    }

//----------Private Methods----------
    // In JS we cannot easily access public members from
    // private members so self acts as a bridge
    var self = this;

    // Listen also to touchstart events on supporting devices
    // Makes clicks more responsive (do not wait for click event anymore)
    function touchHandler(e)
    {
        // preventDefault also disables pinching and scrolling while touching
        // on qml application
        e.preventDefault();
        var at = {
            layerX: e.touches[0].pageX - element.offsetLeft,
            layerY: e.touches[0].pageY - element.offsetTop,
            button: 1
        }
        element.onclick(at);

    }

    function mousemoveHandler(e)
    {
        var i;
        for (i in self.mouseAreas) {
            var l = self.mouseAreas[i];
            if (l && l.hoverEnabled
                  && (self.oldMousePos.x >= l.left
                      && self.oldMousePos.x <= l.right
                      && self.oldMousePos.y >= l.top
                      && self.oldMousePos.y <= l.bottom)
                  && !(e.pageX - element.offsetLeft >= l.left
                       && e.pageX - element.offsetLeft <= l.right
                       && e.pageY - element.offsetTop >= l.top
                       && e.pageY - element.offsetTop <= l.bottom) )
                l.exited();
        }
        for (i in self.mouseAreas) {
            var l = self.mouseAreas[i];
            if (l && l.hoverEnabled
                  && (e.pageX - element.offsetLeft >= l.left
                      && e.pageX - element.offsetLeft <= l.right
                      && e.pageY - element.offsetTop >= l.top
                      && e.pageY - element.offsetTop <= l.bottom)
                  && !(self.oldMousePos.x >= l.left
                       && self.oldMousePos.x <= l.right
                       && self.oldMousePos.y >= l.top
                       && self.oldMousePos.y <= l.bottom))
                l.entered();
        }
        self.oldMousePos = { x: e.pageX - element.offsetLeft,
                            y: e.pageY - element.offsetTop };
    }

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
    var // Root document of the engine
        doc,
        // Callbacks for stopping or starting the engine
        whenStop = [],
        whenStart = [],
        // Ticker resource id and ticker callbacks
        tickerId,
        tickers = [],
        lastTick = new Date().getTime(),
        // Base path of qml engine (used for resource loading)
        basePath,
        i;


//----------Construct----------

    options = options || {};

    if (options.debugConsole) {
        // Replace QML-side console.log
        console = {};
        console.log = function() {
            var args = Array.prototype.slice.call(arguments);
            options.debugConsole.apply(Undefined, args);
        };
    }
}

