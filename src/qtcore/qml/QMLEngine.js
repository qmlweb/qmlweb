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
    this.renderMode = (element && element.nodeName == "CANVAS") ? QMLRenderMode.Canvas : QMLRenderMode.DOM;

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
            if (this.renderMode == QMLRenderMode.Canvas) {
                element.addEventListener("touchstart", touchHandler);
                element.addEventListener("mousemove", mousemoveHandler);
            }
            this.operationState = QMLOperationState.Running;
            tickerId = setInterval(tick, this.$interval);
            for (i = 0; i < whenStart.length; i++) {
                whenStart[i]();
            }
            this.$draw();
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

    // Load file, parse and construct (.qml or .qml.js)
    this.loadFile = function(file) {
        basePath = file.split("/");
        basePath[basePath.length - 1] = "";
        basePath = basePath.join("/");
        var src = getUrlContents(file);
        if (options.debugSrc) {
            options.debugSrc(src);
        }
        this.loadQML(src);
    }
    // parse and construct qml
    this.loadQML = function(src) {
        engine = this;
        var tree = parseQML(src);
        if (options.debugTree) {
            options.debugTree(tree);
        }

        // Create and initialize objects
        var component = new QMLComponent({ object: tree, parent: null });
        doc = component.createObject(null);
        this.$initializePropertyBindings();

        this.start();

        // Call completed signals
        for (var i in this.completedSignals) {
            this.completedSignals[i]();
        }
    }

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

        var src = getUrlContents(file);
        if (src=="")
            return undefined;
        var tree = parseQML(src);
        this.components[name] = tree;
        return tree;
    }

    this.$initializePropertyBindings = function() {
        // Initialize property bindings
        for (var i = 0; i < this.bindedProperties.length; i++) {
            var property = this.bindedProperties[i];
            property.binding.compile();
            property.update();
        }
        this.bindedProperties = [];
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

    // Requests draw in case something has probably changed.
    this.$requestDraw = function()
    {
        isDirty = true;
    }

    // Performance measurements
    this.$perfDraw = function(canvas)
    {
        doc.$draw(canvas);
    }

    this.$draw = function()
    {
        if (this.renderMode == QMLRenderMode.DOM)
            return;
        var time = new Date();

        element.height = doc.height;
        element.width = doc.width;

        // Pixel-perfect size
//         canvasEl.style.height = canvasEl.height + "px";
//         canvasEl.style.width = canvasEl.width + "px";

        doc.$draw(canvas);

        if (options.drawStat) {
            options.drawStat((new Date()).getTime() - time.getTime());
        }
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
        if (isDirty) {
            isDirty = false;
            self.$draw();
        }
    }


//----------Private Members----------
    // Target canvas
    if (this.renderMode == QMLRenderMode.Canvas)
        var canvas = element.getContext('2d');

    var // Root document of the engine
        doc,
        // Callbacks for stopping or starting the engine
        whenStop = [],
        whenStart = [],
        // Ticker resource id and ticker callbacks
        tickerId,
        tickers = [],
        lastTick = new Date().getTime(),
        // isDirty tells if we should do redraw
        isDirty = true,
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

    if (this.renderMode == QMLRenderMode.Canvas) {
        // Register mousehandler for element
        element.onclick = function(e) {
            if (self.running) {
                var i;
                for (i in self.mouseAreas) {
                    var l = self.mouseAreas[i];
                    var mouse = {
                        accepted: true,
                        button: e.button == 0 ? Qt.LeftButton :
                                e.button == 1 ? Qt.RightButton :
                                e.button == 2 ? Qt.MiddleButton :
                                0,
                        modifiers: (e.ctrlKey * Qt.CtrlModifier)
                                | (e.altKey * Qt.AltModifier)
                                | (e.shiftKey * Qt.ShiftModifier)
                                | (e.metaKey * Qt.MetaModifier),
                        x: (e.offsetX || e.layerX) - l.left,
                        y: (e.offsetY || e.layerY) - l.top
                    };

                    if (l.enabled
                    && mouse.x >= 0 // equals: e.offsetX >= l.left
                    && (e.offsetX || e.layerX) <= l.right
                    && mouse.y >= 0 // equals: e.offsetY >= l.top
                    && (e.offsetY || e.layerY) <= l.bottom) {
                        l.clicked(mouse);
                        self.$requestDraw();
                        break;
                    }
                }
            }
        }
    }
}

