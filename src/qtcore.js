/* @license

  Copyright (c) 2011 Lauri Paimen <lauri@paimen.info>
 
  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions
  are met:

      * Redistributions of source code must retain the above
        copyright notice, this list of conditions and the following
        disclaimer.

      * Redistributions in binary form must reproduce the above
        copyright notice, this list of conditions and the following
        disclaimer in the documentation and/or other materials
        provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDER “AS IS” AND ANY
  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
  PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE
  LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
  OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
  PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
  THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
  TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
  THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
  SUCH DAMAGE.
*/


/*
 * QML engine and elements.
 * 
 * This is the main component of the project. It defines qml engine, elements
 * and helpers for each.
 *
 * Exports:
 *
 * - QMLEngine(element, options) -- Returns new qml engine object, for which:
 *   - loadFile(file) -- Load file to the engine (.qml or .qml.js atm)
 *   - start() -- start the engine/application
 *   - stop() -- stop the engine/application. Restarting is experimental.
 *   element is HTMLCanvasElement and options are for debugging.
 *   For further reference, see testpad and qml viewer applications.
 */

(function() {

var QMLGlobalObject = {
    Qt: {
        rgba: function(r,g,b,a) {
            var rgba = "rgba("
                + Math.round(r * 255) + ","
                + Math.round(g * 255) + ","
                + Math.round(b * 255) + ","
                + Math.round(a * 255) + ")"
            return rgba },
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
        KeypadModifier: 16 // Note: Not available in web

        }
    },
    // Simple shortcuts to getter & setter functions, coolness with minifier
    GETTER = "__defineGetter__",
    SETTER = "__defineSetter__",
    Undefined = undefined;

//Object.prototype[GETTER] = function(){};    

/**
 * Inheritance helper
 */
Object.create = function (o) {
    function F() {}
    F.prototype = o;
    return new F();
};

// Helper. Ought to do absolutely nothing.
function noop(){};

// Helper to prevent some minimization cases. Ought to do "nothing".
function tilt() {arguments.length = 0};

// Helper to clone meta-objects for dynamic element creation
function cloneObject(obj) {
    if (null == obj || typeof obj != "object")
        return obj;
    var copy = new obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) {
            if (typeof obj[attr] == "object")
                copy[attr] = cloneObject(obj[attr]);
            else
                copy[attr] = obj[attr];
        }
    }
    return copy;
}

/**
 * Helper function.
 * Prints msg and values of object. Workaround when using getter functions as
 * Chrome (at least) won't show property values for them.
 * @param {String} msg Message
 * @param {Object} obj Object to use (will be "printed", too)
 * @param {Array} vals Values to list from the object.
 */
function descr(msg, obj, vals) {
    var str = msg + ": [" + obj.id + "] ",
        i;
    for (i = 0; i < vals.length; i++) {
        str += vals[i] + "=" + obj[vals[i]] + " ";
    }
    console.log(str, obj);
}

/**
 * QMLTransientValue.
 * Value for setter can be given with this function.
 * The difference is that no change signal is fired for setting the value.
 * @param {any} val Value to be passed.
 * @return {QMLTransientValue} special value for 
 */
function QMLTransientValue(val) {
    this.$val = val;
}

/**
 * Evaluate binding.
 * @param {Object} thisObj Object to be this
 * @param {String} src Source code
 * @param {Object} objectScope Scope for evaluation
 * @param {Object} [globalScope] A second Scope for evaluation (both scopes properties will be directly accessible)
 * @return {any} Resulting object.
 */
function evalBinding(thisObj, src, objectScope, globalScope) {
    var val;
    // If "with" operator gets deprecated, you just have to create var of
    // every property in objectScope and globalScope, assign the values, and run. That'll be quite
    // slow :P
    // todo: use thisObj.
    //console.log("evalBinding objectScope, this, src: ", objectScope, thisObj, src);
    (function() {
        with(objectScope) {
            if (globalScope) {
                with (globalScope) {
                    val = eval(src);
                }
            } else {
                val = eval(src);
            }
        }
    })();
    //console.log("    ->", val);
    return val;
}

/**
 * QML Object constructor.
 * @param {Object} meta Meta information about the object
 * @param {Object} parent Parent object for new object
 * @return {Object} New qml object
 */
function construct(meta, parent, engine) {
    var constructors = {
            MouseArea: QMLMouseArea,
            Image: QMLImage,
            Item: QMLItemF,
            Column: QMLItem, // todo
            Row: QMLItem, // todo
            Display: QMLItem, // todo
            Text: QMLText,
            Rectangle: QMLRectangle,
            Repeater: QMLRepeater,
            ListModel: QMLListModel,
            ListElement: QMLListElement,
            QMLDocument: QMLDocument,
            Timer: QMLTimer,
            SequentialAnimation: QMLSequentialAnimation,
            NumberAnimation: QMLNumberAnimation
        },
        item;
        
    if (meta.$class in constructors) {
        item = new constructors[meta.$class](meta, parent, engine);
        item.$$type = meta.$class; // Some debug info, don't depend on existence
        item.$$meta = meta; // Some debug info, don't depend on existence
        return item;
    } else if (cTree = engine.loadComponent(meta.$class)) {
        var component = construct(cTree, {}, engine);
        item = component.$children[0];
        item.$internChildren = component.$children[0].$children;
        meta.$componentMeta = cTree.$children[0];
        if (cTree.$children[0].$defaultProperty) {
            var bindSrc = "function $Qbc(newVal) {" + cTree.$children[0].$defaultProperty.src
                            + " = newVal; };$Qbc";
            item.$applyChild = evalBinding(item, bindSrc, item, item.Component.$scope.getIdScope());
        }
        QMLBaseObject.call(item, meta, parent, engine);
        applyProperties(meta, item);
        item.$$type = meta.$class; // Some debug info, don't depend on existence
        item.$$meta = meta; // Some debug info, don't depend on existence
        return item;
    } else {
        console.log("No constructor found for " + meta.$class);
    }
}

function createFunction(obj, funcName) {
    var func;

    function getter() {
        return func;
    }

    function setter(newVal) {
        if (!(newVal instanceof QMLBinding))
            return;
        var src;
        if (newVal.src.search("function") == 0) {
            // The src begins already with "function", so no need to put "function" around it
            src = newVal.src + "; " + funcName;
        } else {
            // The src contains only the function body, so we need to put "function" around it
            src = "var func = function() {"
                    + newVal.src
                    + "}; func";
        }
        var componentScope = obj.Component.$scope.getIdScope();

        func = evalBinding(null, src, obj, componentScope);
    }

    setupGetterSetter(obj, funcName, getter, setter);
}

/**
 * Create property getters and setters for object.
 * @param {Object} obj Object for which gsetters will be set
 * @param {String} propName Property name
 * @param {any} defVal Value. If function, creates binding with defVal.code.
 * @param {Object} [altParent] Alternative parent. Defined function scope.
 */
function createSimpleProperty(obj, propName, defVal, altParent) {
    var changeFuncName = 'on'
                        + propName[0].toUpperCase()
                        + propName.substr(1)
                        + 'Changed',
        binding,
        objectScope = altParent || obj;

    // Extended changesignal capabilities
    obj["$" + changeFuncName] = [];

    // Define getter
    function getter() {
        if (binding) {
            return binding();
        }
        if (defVal instanceof QMLBinding) {
            // todo: enable thisobj
            return evalBinding(null, defVal.src, objectScope, objectScope.Component.$scope.getIdScope());
        } else {
            return defVal;
        }
    };
    
    // Define setter
    function setter(newVal) {
        var i;
        //console.log("set", obj.id || obj, propName, newVal);
        if (newVal instanceof QMLTransientValue) {
            // TransientValue, don't fire signal handlers
            defVal = newVal.$val;
            binding = false;
        } else if(newVal instanceof QMLBinding) {
            var bindSrc = "function $Qbc() { var $Qbv = " + newVal.src
                + "; return $Qbv;};$Qbc";
            binding = evalBinding(null, bindSrc, objectScope, objectScope.Component.$scope.getIdScope());

        } else {
            binding = false;

            defVal = newVal;

            if (obj[changeFuncName]) {
                // Launch onPropertyChanged signal handler
                // (reading it is enough)
                //TODO: The id scope for the signal-handler is now the one of the property,
                // which is not necessarily the right one for the signal handler
                evalBinding( null,
                            obj[changeFuncName].src,
                            objectScope, objectScope.Component.$scope.getIdScope() );
            }
            
            // Trigger extended changesignal capabilities
            for (i in obj["$" + changeFuncName]) {
                obj["$" + changeFuncName][i](obj[propName], obj, propName);
            }
        }
    };
    
    setupGetterSetter(obj, propName, getter, setter);
}

/**
 * Set up simple getter function for property
 */
var setupGetter,
    setupSetter,
    setupGetterSetter;
(function() {

// todo: What's wrong with Object.defineProperty on some browsers?
// Object.defineProperty is the standard way to setup getters and setters.
// However, the following way to use Object.defineProperty don't work on some
// webkit-based browsers, namely Safari, iPad, iPhone and Nokia N9 browser.
// Chrome, firefox and opera still digest them fine.

// So, if the deprecated __defineGetter__ is available, use those, and if not
// use the standard Object.defineProperty (IE for example).

    var useDefineProperty = !(Object[GETTER] && Object[SETTER]);

    if (useDefineProperty) {

        if (!Object.defineProperty) {
            console.log("No __defineGetter__ or defineProperty available!");
        }

        setupGetter = function(obj, propName, func) {
            Object.defineProperty(obj, propName,
                { get: func, configurable: true, enumerable: true } );
        }
        setupSetter = function(obj, propName, func) {
            Object.defineProperty(obj, propName,
                { set: func, configurable: true, enumerable: false });
        }
        setupGetterSetter = function(obj, propName, getter, setter) {
            Object.defineProperty(obj, propName,
                {get: getter, set: setter, configurable: true, enumerable: false });
        }
    } else {
        setupGetter = function(obj, propName, func) {
            obj[GETTER](propName, func);
        }
        setupSetter = function(obj, propName, func) {
            obj[SETTER](propName, func);
        }
        setupGetterSetter = function(obj, propName, getter, setter) {
            obj[GETTER](propName, getter);
            obj[SETTER](propName, setter);
        }
    }

})();
/**
 * Apply properties from meta to item. Skip values in skip.
 * @param {Object} meta Source of properties
 * @param {Object} item Target of property apply
 * @param {Array} [skip] Array of property names to skip
 */
function applyProperties(meta, item, skip) {
    var i;
    skip = skip || [];
    for (i in meta) {
        // skip if required
        if (skip.indexOf(i) != -1) {
            continue;
        }
        // skip global id's and internal values
        if (i == "id" || i == "anchors" || i[0] == "$") {
            continue;
        }
        // no property should begin with uppercase letter -- those indicate
        // classes
        if (i[0] == i[0].toUpperCase()) {
            console.log(meta, "has", i, "-- bug?");
            continue;
        }
        // Handle objects which are already defined in item differently
        if (Object.prototype.toString.call(meta[i]) == '[object Object]') {
            if (item[i] && !(meta[i] instanceof QMLBinding)) {
                // Apply properties one by one, otherwise apply at once
                // skip nothing
                applyProperties(meta[i], item[i]);
                continue;
            }
        }
        item[i] = meta[i];
    }
}

// ItemModel. EXPORTED.
JSItemModel = function() {
    this.dataChangedCallbacks = [];
    this.rowsInsertedCallbacks = [];
    this.rowsMovedCallbacks = [];
    this.rowsRemovedCallbacks = [];
    this.modelResetCallbacks = [];
    this.roleNames = [];

    this.setRoleNames = function(names) {
        this.roleNames = names;
    }

    this.emitDataChanged = function(startIndex, endIndex) {
        for (var i in this.dataChangedCallbacks) {
            this.dataChangedCallbacks[i](startIndex, endIndex);
        }
    }
    this.emitRowsInserted = function(startIndex, endIndex) {
        for (var i in this.rowsInsertedCallbacks) {
            this.rowsInsertedCallbacks[i](startIndex, endIndex);
        }
    };
    this.emitRowsMoved = function(sourceStartIndex, sourceEndIndex, destinationIndex) {
        for (var i in this.rowsMovedCallbacks) {
            this.rowsMovedCallbacks[i](sourceStartIndex, sourceEndIndex, destinationIndex);
        }
    };
    this.emitRowsRemoved = function(startIndex, endIndex) {
        for (var i in this.rowsRemovedCallbacks) {
            this.rowsRemovedCallbacks[i](startIndex, endIndex);
        }
    };
    this.emitModelReset = function() {
        for (var i in this.modelResetCallbacks) {
            this.modelResetCallbacks[i]();
        }
    };
}

// -----------------------------------------------------------------------------
// Stuff below defines QML things
// -----------------------------------------------------------------------------

// Helper
function unboundMethod() {
    console.log("Unbound method for", this.$$type, this);
}

// QML engine. EXPORTED.
QMLEngine = function (element, options) {
//----------Public Members----------
    this.fps = 25;
    this.$interval = Math.floor(1000 / this.fps); // Math.floor, causes bugs to timing?
    this.running = false;

    // Mouse Handling
    this.mouseAreas = [];
    this.oldMousePos = {x:0, y:0};

    // List of available Components
    this.components = {};

    // Stack of Components/Files in whose context elements are being created.
    // Used to distribute the Component to all it's children without needing
    // to pass it through all constructors.
    // The last element in the Stack is the currently relevant context.
    this.workingContext = [];



//----------Public Methods----------
    // Start the engine
    this.start = function()
    {
        var i;
        if (!this.running) {
            element.addEventListener("touchstart", touchHandler);
            element.addEventListener("mousemove", mousemoveHandler);
            this.running = true;
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
        if (this.running) {
            element.removeEventListener("touchstart", touchHandler);
            element.removeEventListener("mousemove", mousemoveHandler);
            this.running = false;
            clearInterval(tickerId);
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
        var tree = parseQML(src);
        if (options.debugTree) {
            options.debugTree(tree);
        }
        doc = construct(tree, {}, this);
    }

//Intern

    // Load file, parse and construct as Component (.qml or .qml.js)
    this.loadComponent = function(name)
    {
        if (name in this.components)
            return this.components[name];

        var file = name + ".qml";
        basePath = file.split("/");
        basePath[basePath.length - 1] = "";
        basePath = basePath.join("/");

        var src = getUrlContents(file);
        if (src=="")
            return undefined;
        var tree = parseQML(src);
        this.components[name] = tree;
        return tree;
    }

    this.$getGlobalObj = function()
    {
        return globalObj;
    }

    this.$getTextMetrics = function(text, fontCss)
    {
        canvas.save();
        canvas.font = fontCss;
        var metrics = canvas.measureText(text);
        canvas.restore();
        return metrics;
    }

    this.$setBasePath = function(path)
    {
        basePath = path;
    }

    // Return a path to load the file
    this.$resolvePath = function(file)
    {
        if (file.indexOf("://") != -1) {
            return file;
        } else if (file.indexOf("/") == 0) {
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
        for (i in self.mouseAreas) {
            var l = self.mouseAreas[i];
            if (l && l.onExited && l.hoverEnabled
                  && (self.oldMousePos.x >= l.left
                      && self.oldMousePos.x <= l.right
                      && self.oldMousePos.y >= l.top
                      && self.oldMousePos.y <= l.bottom)
                  && !(e.pageX - element.offsetLeft >= l.left
                       && e.pageX - element.offsetLeft <= l.right
                       && e.pageY - element.offsetTop >= l.top
                       && e.pageY - element.offsetTop <= l.bottom) )
                l.onExited();
        }
        for (i in self.mouseAreas) {
            var l = self.mouseAreas[i];
            if (l && l.onEntered && l.hoverEnabled
                  && (e.pageX - element.offsetLeft >= l.left
                      && e.pageX - element.offsetLeft <= l.right
                      && e.pageY - element.offsetTop >= l.top
                      && e.pageY - element.offsetTop <= l.bottom)
                  && !(self.oldMousePos.x >= l.left
                       && self.oldMousePos.x <= l.right
                       && self.oldMousePos.y >= l.top
                       && self.oldMousePos.y <= l.bottom))
                l.onEntered();
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
    var // Target canvas
        canvas = element.getContext('2d'),
        // Global Qt object
        globalObj = Object.create(QMLGlobalObject),
        // Root document of the engine
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
        globalObj.console = {};
        globalObj.console.log = function() {
            var args = Array.prototype.slice.call(arguments);
            options.debugConsole.apply(Undefined, args);
        };
    }

    // Register mousehandler for element
    element.onclick = function(e) {
        if (self.running) {
            var i;
            for (i in self.mouseAreas) {
                var l = self.mouseAreas[i];
                var mouse = {
                    accepted: true,
                    button: e.button == 0 ? QMLGlobalObject.Qt.LeftButton :
                            e.button == 1 ? QMLGlobalObject.Qt.RightButton :
                            e.button == 2 ? QMLGlobalObject.Qt.MiddleButton :
                            0,
                    modifiers: (e.ctrlKey * QMLGlobalObject.Qt.CtrlModifier)
                            | (e.altKey * QMLGlobalObject.Qt.AltModifier)
                            | (e.shiftKey * QMLGlobalObject.Qt.ShiftModifier)
                            | (e.metaKey * QMLGlobalObject.Qt.MetaModifier),
                    x: (e.offsetX || e.layerX) - l.left,
                    y: (e.offsetY || e.layerY) - l.top
                };

                if (l.enabled
                && mouse.x >= 0 // equals: e.offsetX >= l.left
                && (e.offsetX || e.layerX) <= l.right
                && mouse.y >= 0 // equals: e.offsetY >= l.top
                && (e.offsetY || e.layerY) <= l.bottom) {
                    // Dispatch mouse event
                    l.mouse = mouse;
                    l.onClicked();
                    l.mouse = Undefined;
                    self.$requestDraw();
                    break;
                }
            }
        }
    }
}

// Base object for all qml thingies
function QMLBaseObject(meta, parent, engine) {
    var i,
        prop,
        self = this;

    if (!this.$draw)
        this.$draw = noop;
    this.Component = engine.workingContext[engine.workingContext.length-1];

    // parent
    this.parent = parent;

    // id
    if (meta.id) {
        this.id = meta.id;
        this.Component.$scope.defId(meta.id, this);
    }

    // children
    this.$children = [];
    function setChildren(childMeta) {
        child = construct(childMeta, this, engine);
        this.$children.push( child );
    }
    function getChildren() {
        return this.$children;
    }
    setupGetterSetter(this, "children", getChildren, setChildren);

    //defaultProperty
    if (!this.$applyChild) {
        this.$applyChild = function(newVal) {
            this.children = newVal;
        };
    }

    // properties
    if (meta.$properties) {
        for (i in meta.$properties) {
            prop = meta.$properties[i];
            if (prop.type == "alias") {
                // alias is reverse property, reverse getters and setters needed
                if (!(prop.value instanceof QMLBinding)) {
                    console.log("Assumption failed: alias was not binding");
                }
                console.log("Aliases not yet supported");
                /* Aliases are not yet supported.
                Following code has never been executed.
                Left here for reference.

                this[GETTER](i, function() {
                    return evalBinding(null, prop.value.src, this);
                });
                this[SETTER](i, function(val) {
                    // val needs to be assigned to property/object/thingie
                    // pointed by value.
                    // todo: not sure how to do this by-the-book.

                    // Way 1:
                    // Inject value-to-be-assigned to scope and alter the
                    // binding to assign the value. Then evaluate. Dirty hack?
                    var scope = this,
                        assignment = "(" + prop.value.src  + ") = $$$val";
                    scope.$$$val = val;
                    evalBinding(null, assignment, scope);

                    // Way 2:
                    // Evaluate binding to get the target object, then simply
                    // assign. Didn't choose this as I'm afraid it wont work for
                    // primitives.
                    // var a = evalBinding(null,
                    //                      prop.value.src, scope);
                    // a = val;
                    //

                    });
                }
                */
            } else {
                createSimpleProperty(this, i, prop.value);
            }
        }
    }

    // todo: handle alias property assignments here?

    // methods
    function createMethod(item, name, method) {
        // Trick: evaluate method with bindings to get pointer to
        // function that can then be applied with arguments
        // given to this function to do the job (and get the return
        // values).
        var func = evalBinding(null,
                               method + ";" + name,
                               item,
                               item.Component.$scope.getIdScope());
        return function() {
            return func.apply(null, arguments);
        };
    }
    if (meta.$functions) {
        for (i in meta.$functions) {
            this[i] = createMethod(this, i, meta.$functions[i]);
        }
    }

    // signals
    if (meta.$signals) {
        for (i in meta.$signals) {
        
        }
    }

    // Construct from meta, not from this!
    if (meta.$children) {
        for (i = 0; i < meta.$children.length; i++) {
            // This will call the setter of the defaultProperty
            // In case of the default property being children
            // (normal case) it will add a new child
            this.$applyChild(meta.$children[i]);
        }
    }
}

// Item qml object
function QMLItem(meta, parent, engine) {
    QMLBaseObject.call(this, meta, parent, engine);
    var child,
        o, i;
    
    // Anchors. Gah!
    // Create anchors object
    this.anchors = {};

    function marginsSetter(val) {
        this.topMargin = val;
        this.bottomMargin = val;
        this.leftMargin = val;
        this.rightMargin = val;
    }
    setupSetter(this, 'margins', marginsSetter);

    // Assign values from meta
    if (meta.anchors) {
        for (i in meta.anchors) {
            createSimpleProperty(this.anchors, i, meta.anchors[i], this);
        }
    }

    // Define anchor getters, returning absolute position
    // left, right, top, bottom, horizontalCenter, verticalCenter, baseline
    // todo: margins
    function leftGetter() {
        var t;
        if ((t = this.anchors.left) !== Undefined) {
            return t;
        }
        if ((t = this.anchors.right) !== Undefined) {
            return t - this.$width;
        }
        if ((t = this.anchors.horizontalCenter) !== Undefined) {
            return t - this.$width / 2;
        }
        if ((t = this.anchors.fill) !== Undefined) {
            return t.left;
        }
        if ((t = this.anchors.centerIn) !== Undefined) {
            return t.horizontalCenter - this.$width / 2;
        }
        return this.x + this.parent.left;
    }
    //this[GETTER]("left", leftGetter);
    setupGetter(this, "left", leftGetter);
        
    function rightGetter() {
        return this.left + this.$width;
    }
    //this[GETTER]("right", rightGetter);
    setupGetter(this, "right", rightGetter);
    
    function topGetter() {
        var t;
        if ((t = this.anchors.top) !== Undefined) {
            return t;
        }
        if ((t = this.anchors.bottom) !== Undefined) {
            return t - this.$height;
        }
        if ((t = this.anchors.verticalCenter) !== Undefined) {
            return t - this.$height / 2;
        }
        if ((t = this.anchors.fill) !== Undefined) {
            return t.top;
        }
        if ((t = this.anchors.centerIn) !== Undefined) {
            return t.verticalCenter - this.$height / 2;
        }
        return this.y + this.parent.top;
    }
    //this[GETTER]("top", topGetter);
    setupGetter(this, "top", topGetter);
    
    function bottomGetter() {
        return this.top + this.$height;
    }
    //this[GETTER]("bottom", bottomGetter);
    setupGetter(this, "bottom", bottomGetter);
    
    function hzGetter() {
        return this.left + this.$width / 2;
    }
    //this[GETTER]("horizontalCenter", hzGetter);
    setupGetter(this, "horizontalCenter", hzGetter);
    
    function vzGetter() {
        return this.top + this.$height / 2;
    }
    //this[GETTER]("verticalCenter", vzGetter);
    setupGetter(this, "verticalCenter", vzGetter);
    
    function blGetter() {
        return this.top;
    }
    //this[GETTER]("baseline", blGetter);
    setupGetter(this, "baseline", blGetter);
    
    // Anchoring helpers; $width + $height => Object draw width + height
    function _widthGetter() {
        var t;
        if ((t = this.anchors.fill) !== Undefined) {
            return t.$width;
        };
        return this.implicitWidth || this.width;
    }
    //this[GETTER]("$width", _widthGetter);
    setupGetter(this, "$width", _widthGetter);
    function _heightGetter() {
            var t;
            if ((t = this.anchors.fill) !== Undefined) {
                return t.$height;
            };
            return this.implicitHeight || this.height;
    }
    //this[GETTER]("$height", _heightGetter);
    setupGetter(this, "$height", _heightGetter);
    
    createSimpleProperty(this, "height", 0);
    createSimpleProperty(this, "implicitWidth", 0);
    createSimpleProperty(this, "implicitHeight", 0);
    createSimpleProperty(this, "rotation", 0);
    createSimpleProperty(this, "spacing", 0);
    createSimpleProperty(this, "visible", true);
    createSimpleProperty(this, "width", 0);
    createSimpleProperty(this, "x", 0);
    createSimpleProperty(this, "y", 0);
    createSimpleProperty(this, "z", 0);
        
    this.$draw = function(c) {
        var i;
        if (this.visible) {
            if (this.$drawItem ) {
                var rotRad = (this.rotation || 0) / 180 * Math.PI,
                    rotOffsetX = Math.sin(rotRad) * this.$width,
                    rotOffsetY = Math.sin(rotRad) * this.$height;
                c.save();

                // Handle rotation
                // todo: implement transformOrigin
                c.translate(this.left + rotOffsetX, this.top + rotOffsetY);
                c.rotate(rotRad);
                c.translate(-this.left, -this.top);
                // Leave offset for drawing...
                this.$drawItem(c);
                c.translate(-rotOffsetX, -rotOffsetY);
                c.restore();
            }
            if (this.$internChildren != undefined) {
                for (i = 0; i < this.$internChildren.length; i++) {
                    if (this.$internChildren[i]
                        && this.$internChildren[i].$draw) {
                        this.$internChildren[i].$draw(c);
                    }
                }
            } else {
                for (i = 0; i < this.$children.length; i++) {
                    if (this.$children[i]
                        && this.$children[i].$draw) {
                        this.$children[i].$draw(c);
                    }
                }
            }
        }
    }
}

// Quick hack; final instance of qml item
// Remove hack by applying properties in constructor itself rather than in
// builder classes
function QMLItemF(meta, parent, engine) {
    QMLItem.call(this, meta, parent, engine);
    applyProperties(meta, this);
}

function QMLText(meta, parent, engine) {
    QMLItem.call(this, meta, parent, engine);

    // Creates font css description
    function fontCss(font) {
        var css = "";
        font = font || {};
        css += (font.pointSize || 10) + "pt ";
        css += (font.family || "sans-serif") + " ";
        return css;
    }

    createSimpleProperty(this, "color", "black");

    createSimpleProperty(this, "text", "");

    // Define implicitHeight & implicitWidth

    // Optimization: Remember last text
    // todo: Check for font size, family also
    var lastHText,
        lastH;
    function ihGetter(){
        // There is no height available in canvas element, figure out
        // other way
        if (lastHText == this.text) {
            return lastH;
        }
        var el = document.createElement("span"),
            height;
        el.style.font = fontCss(this.font);
        el.innerText = this.text;
        document.body.appendChild(el);
        height = el.offsetHeight;
        document.body.removeChild(el);
        if (!height) {
            // Firefox doesn't support getting the height this way,
            // approximate from point size (full of win) :P
            if (this.font && this.font.pointSize) {
                height = this.font.pointSize * 96 / 72;
            } else {
                height = 10 * 96 / 72;
            }
        
        }
        lastHText = this.text;
        lastH = height;
        return height;
    }
    //this[GETTER]("implicitHeight", ihGetter);
    setupGetter(this, "implicitHeight", ihGetter);
    
    // Optimization: Remember last text
    // todo: Check for font size, family also
    var lastWText,
        lastW;
    function iwGetter() {
        if (lastWText == this.text) {
            return lastW;
        }
        
        var width;
        width = engine.$getTextMetrics(this.text, fontCss(this.font)).width;
        lastWText = this.text;
        lastW = width;
        return width;
    }
    //this[GETTER]("implicitWidth", iwGetter);
    setupGetter(this, "implicitWidth", iwGetter);
    
    function widthGetter() {
        return this.implicitWidth;
    }
    //this[GETTER]("width", widthGetter);
    setupGetter(this, "width", widthGetter);
    
    function heightGetter() {
        return this.implicitHeight;
    }
    //this[GETTER]("height", heightGetter);
    setupGetter(this, "height", heightGetter);

    applyProperties(meta, this);

    this.$drawItem = function(c) {
        //descr("draw text", this, ["x", "y", "text",
        //                          "implicitWidth", "implicitHeight"]);
        c.save();
        c.font = fontCss(this.font);
        c.fillStyle = this.color;
        c.textAlign = "left";
        c.textBaseline = "top";
        c.fillText(this.text, this.left, this.top);
        c.restore();
    }
}

function QMLRectangle(meta, parent, engine) {
    QMLItem.call(this, meta, parent, engine);
    
    createSimpleProperty(this, "color", "white");
    this.border = {};
    createSimpleProperty(this.border, "color", "rgba(0,0,0,0)", this);
    createSimpleProperty(this.border, "width", 0, this);

    applyProperties(meta, this);

    this.$drawItem = function(c) {
        //descr("draw rect", this, ["x", "y", "width", "height", "color"]);
        //descr("draw rect.border", this.border, ["color", "width"]);
        
        c.save();
        c.fillStyle = this.color;
        c.fillRect(this.left, this.top, this.$width, this.$height);
        c.strokeStyle = this.border.color;
        c.lineWidth = this.border.width;
        c.strokeRect(this.left, this.top, this.$width, this.$height);
        c.restore();
    }
}

function QMLRepeater(meta, parent, engine) {
    this.$applyChild = function(newVal) {
        this.delegate = newVal;
    }

    QMLItem.call(this, meta, parent, engine);
    var self = this;

    createSimpleProperty(this, "model", 0);
    createSimpleProperty(this, "count", 0);
    
//     if (!this.$children)
//         this.$children = [];
//     if (meta.$children)
//         var delegateMeta = meta.$children[0];
//     else
//         console.log("Can't create Repeater without delegate. \
//                     Delegate property is not supported yet, use children.");

    applyProperties(meta, this);
    
    var model = this.model instanceof QMLListModel ? this.model.$model : this.model;

    function applyChildProperties(child, index) {
        var indexGetter = function() {
            return child.parent.index === undefined ? self.$children.indexOf(child) : child.parent.index;
        }
        setupGetter(child, "index", indexGetter);
        for (var i in model.roleNames) {
            var func = eval("var func = function() {\
                return model.data(child.index, \"" + model.roleNames[i] + "\");\
            }; func"); // eval needed in order to evaluate model.roleNames[i] now and not on function call
            setupGetter(child, model.roleNames[i], func);
        }
        for (var i in child.$internChildren)
            applyChildProperties(child.$internChildren[i], index);
        for (var i in child.$children)
            applyChildProperties(child.$children[i], index);
    }
    function insertChildren(startIndex, endIndex) {
        engine.workingContext.push(self.Component);
        for (var index = startIndex; index < endIndex; index++) {
            var newMeta = cloneObject(self.delegate);
            newMeta.id = newMeta.id + index;
            var newItem = construct(newMeta, self, engine);
            applyChildProperties(newItem, index);
            self.$children.splice(index, 0, newItem);
        }
        engine.workingContext.pop();
        self.count = self.$children.length;
    }

    if (model instanceof JSItemModel) {

        model.dataChangedCallbacks.push(engine.$requestDraw);
        model.rowsInsertedCallbacks.push(insertChildren);
        model.rowsMovedCallbacks.push(function(sourceStartIndex, sourceEndIndex, destinationIndex) {
            var vals = self.$children.splice(sourceStartIndex, sourceEndIndex-sourceStartIndex);
            for (var i = 0; i < vals.length; i++) {
                self.$children.splice(destinationIndex + i, 0, vals[i]);
            }
            engine.$requestDraw();
        });
        model.rowsRemovedCallbacks.push(function(startIndex, endIndex) {
            self.$children.splice(startIndex, endIndex - startIndex);
            self.count = self.$children.length;
            engine.$requestDraw();
        });
        model.modelResetCallbacks.push(function() {
            self.$children.splice(0, self.$children.length);
            insertChildren(0, model.rowCount());
            engine.$requestDraw();
        });

        insertChildren(0, model.rowCount());
    } else if (typeof model == "number") {
        insertChildren(0, model);
    }

    this.$drawItem = function(c) {
        model = this.model instanceof QMLListModel ? this.model.$model : this.model;
        if (typeof model == "number") {
            this.$children.splice(0, this.$children.length);
            insertChildren(0, model);
        }
    }
}

function QMLListModel(meta, parent, engine) {
    QMLBaseObject.call(this, meta, parent, engine);
    var self = this;

    this.$model = new JSItemModel();

    this.$model.data = function(index, role) {
        return self.$children[index][role];
    }
    this.$model.rowCount = function() {
        return self.$children.length;
    }
    var roleNames = [];
    for (i in meta.$children[0]) {
        if (i != "id" && i != "index" && i[0] != "$")
            roleNames.push(i);
    }
    this.$model.setRoleNames(roleNames);
    
    this.append = function(dict) {
        this.$children.push(dict);
        this.$model.emitRowsInserted(this.$children.length-1, this.$children.length);
    }
    this.clear = function() {
        this.$children = [];
        this.$model.emitModelReset();
    }
    this.get = function(index) {
        return this.$children[index];
    }
    this.insert = function(index, dict) {
        this.$children.splice(index, 0, dict);
        this.$model.emitRowsInserted(index, index+1);
    }
    this.move = function(from, to, n) {
        var vals = this.$children.splice(from, n);
        for (var i = 0; i < vals.length; i++) {
            this.$children.splice(to + i, 0, vals[i]);
        }
        this.$model.emitRowsMoved(from, from+n, to);
    }
    this.remove = function(index) {
        this.$children.splice(index, 1);
        this.$model.emitRowsRemoved(index, index+1);
    }
    this.set = function(index, dict) {
        this.$children[index] = dict;
        engine.$requestDraw();
    }
    this.setProperty = function(index, property, value) {
        this.$children[index][property] = value;
        engine.$requestDraw();
    }
    
    applyProperties(meta, this);
}

function QMLListElement(meta, parent, engine) {
    // QMLListElement can't have children and needs special handling of properties
    // thus we don't use QMLBaseObject for it
    for (i in meta) {
        if (i[0] != "$")
            this[i] = meta[i];
    }
}

function QMLImage(meta, parent, engine) {
    QMLItem.call(this, meta, parent, engine);
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
    }

    // no-op properties
    createSimpleProperty(this, "asynchronous", true);
    createSimpleProperty(this, "cache", true);
    createSimpleProperty(this, "smooth", true);
    
    createSimpleProperty(this, "fillMode", this.Image.Stretch);
    createSimpleProperty(this, "mirror", false);
    createSimpleProperty(this, "progress", 0);
    createSimpleProperty(this, "source", "");
    createSimpleProperty(this, "status", this.Image.Null);
    
    // todo: should be bindable properties
    this.sourceSize = {height: 0, width: 0}

    // Actual size of image.
    // todo: bug; implicitWidth|height is not defined this way in docs
    function iwGetter() {
            return this.width || img.naturalWidth;
    }
    //this[GETTER]("implicitWidth", iwGetter);
    setupGetter(this, "implicitWidth", iwGetter);
    
    function ihGetter() {
        return this.height || img.naturalHeight;
    }
    //this[GETTER]("implicitHeight", ihGetter);
    setupGetter(this, "implicitHeight", ihGetter);

    // Bind status to img element
    img.onload = function() {
        self.progress = 1;
        self.status = self.Image.Ready;
        // todo: it is not right to set these
        self.sourceSize.width = img.naturalWidth;
        self.sourceSize.height = img.naturalHeight;
        engine.$requestDraw();
    }
    img.onerror = function() {
        self.status = self.Image.Error;
    }

    // Use extended changesignal capabilities to keep track of source
    this.$onSourceChanged.push(function(val) {
        self.progress = 0;
        self.status = self.Image.Loading;
        img.src = engine.$resolvePath(val);
    });


    applyProperties(meta, this);    
    
    this.$drawItem = function(c) {
        //descr("draw image", this, ["left", "top", "$width", "$height", "source"]);
        
        if (this.fillMode != this.Image.Stretch) {
            console.log("Images support only Image.Stretch fillMode currently");
        }
        if (this.status == this.Image.Ready) {
            c.save();
            c.drawImage(img, this.left, this.top, this.$width, this.$height);
            c.restore();
        } else {
            console.log("Waiting for image to load");
        }
    }
}

function QMLMouseArea(meta, parent, engine) {
    QMLItem.call(this, meta, parent, engine);

    createSimpleProperty(this, "acceptedButtons", QMLGlobalObject.Qt.LeftButton);
    createSimpleProperty(this, "enabled", true);
    createFunction(this, "onClicked");
    createFunction(this, "onEntered");
    createFunction(this, "onExited");
    createSimpleProperty(this, "hoverEnabled", false);

    applyProperties(meta, this);

    engine.mouseAreas.push(this);
}

function QMLDocument(meta, parent, engine) {

    var doc,
        // The only item in this document
        item,
        // id's in item scope
        ids = Object.create(engine.$getGlobalObj());

    // todo: imports
    
    if (meta.$children.length != 1) {
        console.log("QMLDocument: children.length != 1");
    }

    // Build parent
    parent = {};
    parent.left = 0;
    parent.top = 0;

    Component = {};
    Component.$scope = {
        // Get scope
        get: function() {
            return ids;
        },
        // Get base/id scope
        getIdScope: function() {
            return ids;
        },
        // Define id
        defId: function(name, obj) {
            if (ids[name]) {
                console.log("QMLDocument: overriding " + name
                            + " with object", obj);
            }
            ids[name] = obj;
        }
    };
    engine.workingContext.push(Component);

    doc = new QMLItem(meta, parent, engine);
    item = doc.$children[0];

    engine.workingContext.pop();

    function heightGetter() {
        return item.height; 
    }
    //doc[GETTER]("height", heightGetter);
    setupGetter(doc, "height", heightGetter);
    
    function widthGetter() {
        return item.width;
    }
    //doc[GETTER]("width", widthGetter);
    setupGetter(doc, "width", widthGetter);
    

    doc.$draw = function(c) {
        c.save();
        c.fillStyle = "pink";
        c.fillRect(0, 0, c.canvas.width, c.canvas.height);
        c.restore();
        item.$draw(c);
    }
    // todo: legacy. remove
    doc.draw = doc.$draw;
    doc.getHeight = function() { return doc.height };
    doc.getWidth = function() { return doc.width };
    
    return doc; // todo: return doc instead of item

}

function QMLTimer(meta, parent, engine) {
    QMLBaseObject.call(this, meta, parent, engine),
        prevTrigger,
        self = this;
    
    createSimpleProperty(this, "interval", 1000);
    createSimpleProperty(this, "repeat", false);
    createSimpleProperty(this, "running", false);
    createSimpleProperty(this, "triggeredOnStart", false);
                         
    // Create trigger as simple property. Reading the property triggers
    // the function!
    createFunction(this, "onTriggered");
                     
    applyProperties(meta, this);

    engine.$addTicker(ticker);
    function ticker(now, elapsed) {
        if (self.running) {
            if (now - prevTrigger >= this.interval) {
                prevTrigger = now;
                trigger();
            }
        }
    }

    this.start = function() {
        if (!this.running) {
            this.running = true;
            prevTrigger = (new Date).getTime();
            if (this.triggeredOnStart) {
                trigger();
            }
        }
    }
    this.stop = function() {
        if (this.running) {
            this.running = false;
        }
    }
    this.restart = function() {
        this.stop();
        this.start();
    }
    
    function trigger() {
        // Trigger this.
        self.onTriggered();

        engine.$requestDraw();
    }
    
    engine.$registerStart(function() {
        if (this.running) {
            this.running = false; // toggled back by this.start();
            this.start();
        }
    });

    engine.$registerStop(function() {
        this.stop();
    });
}

function QMLAnimation(meta, parent, engine) {
    QMLBaseObject.call(this, meta, parent, engine);
    
    // Exports
    this.Animation = {
        Infinite: -1
    };
    
    createSimpleProperty(this, "alwaysRunToEnd", false);
    createSimpleProperty(this, "loops", 1);
    createSimpleProperty(this, "paused", false);
    createSimpleProperty(this, "running", false);
    
    // Methods
    this.restart = function() {
        this.stop();
        this.start();
    };
    // To be overridden
    this.complete = unboundMethod;
    this.pause = unboundMethod;
    this.resume = unboundMethod;
    this.start = unboundMethod;
    this.stop = unboundMethod;
}

function QMLSequentialAnimation(meta, parent, engine) {
    QMLAnimation.call(this, meta, parent, engine),
        curIndex,
        passedLoops,
        i,
        self = this;
    
    function nextAnimation(proceed) {

        var anim;
        if (self.running && !proceed) {
            curIndex++;
            if (curIndex < self.$children.length) {
                anim = self.$children[curIndex];
                console.log("nextAnimation", self, curIndex, anim);
                descr("", anim, ["target"]);
                anim.from = anim.target[anim.property];
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

    for (i = 0; i < this.$children.length; i++) {
        this.$children[i].$onRunningChanged.push(nextAnimation);
    }
    // $children is already constructed,
    
    applyProperties(meta, this);
    
    
    this.start = function() {
        if (!this.running) {
            this.running = true;
            curIndex = -1;
            passedLoops = 0;
            nextAnimation();
        }
    }
    this.stop = function() {
        if (this.running) {
            this.running = false;
            if (curIndex < this.$children.length) {
                this.$children[curIndex].stop();
            }
        }
    }
    
    this.complete = function() {
        if (this.running) {
            if (curIndex < this.$children.length) {
                // Stop current animation
                this.$children[curIndex].stop();
            }
            this.running = false;
        }
    }
    
    engine.$registerStart(function() {
        if (this.running) {
            this.running = false; // toggled back by start();
            this.start();
        }
    });
    engine.$registerStop(function() {
        this.stop();
    });
};

function QMLPropertyAnimation(meta, parent, engine) {
    QMLAnimation.call(this, meta, parent, engine);
    
    // Exports
    this.Easing = {
        Linear: 1,
        InOutCubic: 2
        // TODO: rest and support for them.
    };
    
    createSimpleProperty(this, "duration", 250);
    this.easing = {};
    createSimpleProperty(this.easing, "type", this.Easing.Linear, this);
    createSimpleProperty(this.easing, "amplitude", Undefined, this);
    createSimpleProperty(this.easing, "overshoot", Undefined, this);
    createSimpleProperty(this.easing, "period", Undefined, this);
    createSimpleProperty(this, "from", 0);
    createSimpleProperty(this, "properties", []);
    createSimpleProperty(this, "property", Undefined);
    createSimpleProperty(this, "target", Undefined);
    createSimpleProperty(this, "targets", []);
    createSimpleProperty(this, "to", 0);
}

function QMLNumberAnimation(meta, parent, engine) {
    QMLPropertyAnimation.call(this, meta, parent, engine);
    var tickStart,
        self = this;
    
    
    applyProperties(meta, this);
    
    engine.$addTicker(ticker);

    function curve(place) {
        switch(self.easing.type) {
        
         case self.Easing.InOutCubic:
            // todo: better estimate
            return 0.5 + Math.sin(place*Math.PI - Math.PI / 2) / 2
         default:
            console.log("Unsupported animation type: ", self.easing.type);
         case self.Easing.Linear:
            return place;
        }
    }

    function ticker(now, elapsed) {
        if (self.running) {
            if (now > tickStart + self.duration) {
                self.complete();
            } else {
                var at = (now - tickStart) / self.duration,
                    value = curve(at) * (self.to - self.from) + self.from;
                self.target[self.property] = new QMLTransientValue(value);
                engine.$requestDraw();
            }

        }
    }
    
    // Methods
    this.start = function() {
        if (!this.running) {
            this.running = true;
            tickStart = (new Date).getTime();
        }
    }
    
    this.stop = function() {
        if (this.running) {
            this.running = false;
        }
    }

    this.complete = function() {
        if (this.running) {
            this.target[this.property] = this.to;
            this.stop();
            engine.$requestDraw();
        }
    }
}

})();



























