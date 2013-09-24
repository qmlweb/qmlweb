/* @license

  Copyright (c) 2011 Lauri Paimen <lauri@paimen.info>
  Copyright (c) 2013 Anton Kreuzkamp <akreuzkamp@web.de>

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

    var Qt = {
        rgba: function(r,g,b,a) {
            var rgba = "rgba("
                + Math.round(r * 255) + ","
                + Math.round(g * 255) + ","
                + Math.round(b * 255) + ","
                + a + ")";
            return rgba;
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
        RightToLeft: 1
    }
    var Font = {
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
        Black: "bolder",
    }
    qmlBasicTypes = {
        int: Number,
        real: Number,
        double: Number,
        string: String,
        bool: Boolean
    }
    // Simple shortcuts to getter & setter functions, coolness with minifier
    GETTER = "__defineGetter__",
    SETTER = "__defineSetter__",
    Undefined = undefined,
    // Stack of Components/Files in whose context variable names are used
    // Used to distribute the Component to all it's children without needing
    // to pass it through all constructors.
    // The last element in the Stack is the currently relevant context.
    workingContext = [],
    // Property that is currently beeing evaluated. Used to get the information
    // which property called the getter of a certain other property for
    // evaluation and is thus dependant on it.
    evaluatingProperty = undefined;

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
 * Evaluate binding.
 * @param {Object} thisObj Object to be this
 * @param {String} src Source code
 * @param {Object} objectScope Scope for evaluation
 * @param {Object} [componentScope] A second Scope for evaluation (all scopes' properties will be directly accessible)
 * @param {Object} [globalScope] A third Scope for evaluation (all scopes' properties will be directly accessible)
 * @return {any} Resulting object.
 */
function evalBinding(thisObj, src, objectScope, componentScope, globalScope) {
    var val;
    // If "with" operator gets deprecated, you just have to create var of
    // every property in objectScope and globalScope, assign the values, and run. That'll be quite
    // slow :P
    // todo: use thisObj.
    //console.log("evalBinding objectScope, this, src: ", objectScope, thisObj, src);
    (function() {
        with(globalScope || {}) {
            with (componentScope || {}) {
                with (objectScope) {
                    val = eval(src);
                }
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
            BorderImage: QMLBorderImage,
            Item: QMLItem,
            Column: QMLColumn,
            Row: QMLRow,
            Grid: QMLGrid,
            Flow: QMLFlow,
            Rotation: QMLRotation,
            Scale: QMLScale,
            Translate: QMLTranslate,
            Text: QMLText,
            Rectangle: QMLRectangle,
            Repeater: QMLRepeater,
            ListModel: QMLListModel,
            ListElement: QMLListElement,
            QMLDocument: QMLDocument,
            State: QMLState,
            PropertyChanges: QMLPropertyChanges,
            Transition: QMLTransition,
            Timer: QMLTimer,
            SequentialAnimation: QMLSequentialAnimation,
            ParallelAnimation: QMLParallelAnimation,
            NumberAnimation: QMLNumberAnimation,
            Behavior: QMLBehavior,
            TextInput: QMLTextInput,
            Button: QMLButton,
            TextArea: QMLTextArea
        },
        item,
        cTree;

    if (meta.$class in constructors) {
        item = new constructors[meta.$class](meta, parent, engine);
    } else if (cTree = engine.loadComponent(meta.$class)) {
        var item = QMLComponent(cTree, engine);

        // Recall QMLBaseObject with the meta of the instance in order to get property
        // definitions, etc. from the instance
        QMLBaseObject.call(item, meta, parent, engine);
        if (engine.renderMode == QMLRenderMode.DOM)
            item.$domElement.className += " " + meta.$class + (meta.id ? " " + meta.id : "");
        var dProp; // Handle default properties
        if (dProp = cTree.$children[0].$defaultProperty) {
            //TODO: How does Qt really handle default properties + components?
            if (item[dProp] instanceof Array)
                for (var i = 0; i < meta.$children.length; i++)
                    item[dProp].push(construct(meta.$children[i], item, engine));
            else
                item[dProp] = meta.$children[0];
            return item;
        }
    } else {
        console.log("No constructor found for " + meta.$class);
        return;
    }

    // Construct children
    for (var i = 0; i < meta.$children.length; i++)
        item.$addChild(meta.$children[i]);

    return item;
}

/**
 * Creates and returns a signal with the parameters specified in @p params.
 *
 * @param params Array with the parameters of the signal. Each element has to be
 *               an object with the two properties "type" and "name" specifying
 *               the datatype of the parameter and its name. The type is
 *               currently ignored.
 * @param options Options that allow finetuning of the signal.
 */
function Signal(params, options) {
    options = options || {};
    var connectedSlots = [];
    var obj = options.obj

    var signal = function() {
        for (var i in connectedSlots)
            connectedSlots[i].slot.apply(connectedSlots[i].thisObj, arguments);
    };
    signal.parameters = params || [];
    signal.connect = function() {
        if (arguments.length == 1)
            connectedSlots.push({thisObj: window, slot: arguments[0]});
        else if (typeof arguments[1] == 'string' || arguments[1] instanceof String) {
            if (arguments[0].$tidyupList && arguments[0] !== obj)
                arguments[0].$tidyupList.push(this);
            connectedSlots.push({thisObj: arguments[0], slot: arguments[0][arguments[1]]});
        } else {
            if (arguments[0].$tidyupList && (!obj || (arguments[0] !== obj && arguments[0] !== obj.$parent)))
                arguments[0].$tidyupList.push(this);
            connectedSlots.push({thisObj: arguments[0], slot: arguments[1]});
        }
    }
    signal.disconnect = function() {
        var callType = arguments.length == 1 ? (arguments[0] instanceof Function ? 1 : 2)
                       : (typeof arguments[1] == 'string' || arguments[1] instanceof String) ? 3 : 4;
        for (var i = 0; i < connectedSlots.length; i++) {
            var item = connectedSlots[i];
            if ((callType == 1 && item.slot == arguments[0])
                || (callType == 2 && item.thisObj == arguments[0])
                || (callType == 3 && item.thisObj == arguments[0] && item.slot == arguments[0][arguments[1]])
                || (item.thisObj == arguments[0] && item.slot == arguments[1])
            ) {
                if (item.thisObj)
                    item.thisObj.$tidyupList.splice(item.thisObj.$tidyupList.indexOf(this), 1);
                connectedSlots.splice(i, 1);
                i--; // We have removed an item from the list so the indexes shifted one backwards
            }
        }
    }
    signal.isConnected = function() {
        var callType = arguments.length == 1 ? 1
                       : (typeof arguments[1] == 'string' || arguments[1] instanceof String) ? 2 : 3;
        for (var i in connectedSlots) {
            var item = connectedSlots[i];
            if ((callType == 1 && item.slot == arguments[0])
                || (callType == 2 && item.thisObj == arguments[0] && item.slot == arguments[0][arguments[1]])
                || (item.thisObj == arguments[0] && item.slot == arguments[1])
            )
                return true;
        }
        return false;
    }
    return signal;
}

/**
 * Create property getters and setters for object.
 * @param {Object} obj Object for which gsetters will be set
 * @param {String} propName Property name
 * @param {Object} [options] Options that allow finetuning of the property
 */
function createSimpleProperty(engine, obj, propName, options) {
    options = options || {};

    var prop = new QMLProperty(engine, obj, propName, options);

    obj[propName + "Changed"] = prop.changed;
    obj.$properties[propName] = prop;
    (function(obj, propName) {
        var getter = function() {
            return obj.$properties[propName].get();
        };
        var setter = function(newVal) {
            return obj.$properties[propName].set(newVal);
        };
        setupGetterSetter(obj, propName, getter, setter);
    })(obj, propName);
}

function QMLProperty(engine, obj, name, options) {
    this.obj = obj;
    this.name = name;
    this.changed = Signal([], {obj:obj});
    this.binding = noop;
    this.objectScope = options.altParent || obj;
    this.value = undefined;
    this.type = options.type;
    this.animation = null;
    this.engine = engine;

    // This list contains all signals that hold references to this object.
    // It is needed when deleting, as we need to tidy up all references to this object.
    this.$tidyupList = [];
}

// Updater recalculates the value of a property if one of the
// dependencies changed
QMLProperty.prototype.update = function() {
    if (!this.binding)
        return;

    var oldVal = this.val;
    evaluatingProperty = this;
    try {
        this.val = this.binding();
    } catch(e) {
        console.log(e);
    }
    evaluatingProperty = undefined;

    if (this.animation) {
        this.animation.$actions = [{
            target: this.animation.target || this.obj,
            property: this.animation.property || this.name,
            from: this.animation.from || oldVal,
            to: this.animation.to || this.val
        }];
        this.animation.restart();
    }

    if (this.val !== oldVal)
        this.changed(this.val, oldVal, this.name);
}

// Define getter
QMLProperty.prototype.get = function() {
    // If this call to the getter is due to a property that is dependant on this
    // one, we need it to take track of changes
    if (evaluatingProperty && !this.changed.isConnected(evaluatingProperty, QMLProperty.prototype.update))
        this.changed.connect(evaluatingProperty, QMLProperty.prototype.update);

    return this.val;
}

// Define setter
QMLProperty.prototype.set = function(newVal, fromAnimation) {
    var i,
        oldVal = this.val;

    if (newVal instanceof QMLBinding) {
        evaluatingProperty = this;

        if (newVal.binding) {
            this.binding = newVal.binding;
        } else {
            var bindSrc = "(function() { return " + newVal.src + "})";
            this.binding = evalBinding(null, bindSrc, this.objectScope, workingContext[workingContext.length-1].get(), this.engine.rootScope);
        }
        try {
            this.val = this.binding();
        } catch(e) {
            if (!(this.engine.operationFlags & QMLOperationFlag.IgnoreReferenceErrors && e instanceof ReferenceError))
                throw e;
        }

        evaluatingProperty = undefined;
    } else if (newVal instanceof Array) {
        this.val = [];
        this.val.push = function() {
            Array.prototype.push.apply(this, arguments);
            this.$prop.changed(arguments[0]);
        };
        this.val.splice = function() {
            Array.prototype.splice.apply(this, arguments);
            this.$prop.changed(arguments[0]);
        };
        this.val.pop = function() {
            Array.prototype.pop.apply(this, arguments);
            this.$prop.changed(arguments[0]);
        };
        this.val.shift = function() {
            Array.prototype.shift.apply(this, arguments);
            this.$prop.changed(arguments[0]);
        };
        this.val.sort = function() {
            Array.prototype.sort.apply(this, arguments);
            this.$prop.changed(arguments[0]);
        };
        this.val.unshift = function() {
            Array.prototype.unshift.apply(this, arguments);
            this.$prop.changed(arguments[0]);
        };
        this.val.$prop = this;
        this.val.$properties = [];

        for (i in newVal) {
            createSimpleProperty(this.engine, this.val, i, { altParent: this.objectScope });
            this.val[i] = newVal[i];
        }
    } else {
        if (this.type && this.type in qmlBasicTypes)
            this.val = qmlBasicTypes[this.type](newVal);
        else
            this.val = newVal;
        if (!fromAnimation)
            this.binding = false;
    }

    if (this.val !== oldVal) {
        if (this.animation && !fromAnimation) {
            this.animation.$actions = [{
                target: this.animation.target || this.obj,
                property: this.animation.property || this.name,
                from: this.animation.from || oldVal,
                to: this.animation.to || this.val
            }];
            this.animation.restart();
        }
        this.changed(this.val, oldVal, this.name);
    }
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
 * Apply properties from meta to item.
 * @param {Object} meta Source of properties
 * @param {Object} item Target of property apply
 * @param {Object} objectScope Scope in which properties should be evaluated
 * @param {Object} componentScope Component scope in which properties should be evaluated
 * @param {Object} rootScope Root scope in which properties should be evaluated
 */
function applyProperties(meta, item, objectScope, componentScope, rootScope) {
    var i;
    objectScope = objectScope || item;
    for (i in meta) {
        if (i == "$properties") {
            applyProperties(meta[i], item, item, componentScope, rootScope);
            continue;
        }
        // skip global id's and internal values
        if (i == "id" || i[0] == "$") {
            continue;
        }
        // slots
        if (i.indexOf("on") == 0 && i[2].toUpperCase() == i[2]) {
            var signalName =  i[2].toLowerCase() + i.slice(3);
            var params = "";
            if (!item[signalName]) {
                console.log("No signal called " + signalName + " found!");
                continue;
            }
            for (var j in item[signalName].parameters) {
                params += j==0 ? "" : ", ";
                params += item[signalName].parameters[j].name;
            }
            src = "var func = function(" + params + ") {"
                    + meta[i].src
                    + "}; func";
            item[signalName].disconnect(item, i);
            item[i] = evalBinding(null, src, objectScope, componentScope.get(), rootScope);
            item[signalName].connect(item, i);
            continue;
        }

        if (meta[i] instanceof Object) {
            // property-aliases
            if (meta[i] && meta[i].type == "alias") {
                var val = meta[i].value;
                var propName = val.src.replace(/.*\.(\w*)\s*/, "$1");
                var obj = evalBinding(null, val.src.replace(/(.*)\.\w*\s*/, "$1"), objectScope, componentScope.get(), rootScope);
                (function(val, propName, obj) {
                    setupGetterSetter(item, i, function() {
                        return obj.$properties[propName].get();
                    }, function(val) {
                        obj.$properties[propName].set(val);
                    });
                })(val, propName, obj);
                continue;
            } else if (meta[i] instanceof QMLPropertyDefinition) {
                item[i] = meta[i].value;
                continue;
            } else if (item[i] && meta[i] instanceof QMLMetaPropertyGroup) {
                // Apply properties one by one, otherwise apply at once
                applyProperties(meta[i], item[i], item, componentScope, rootScope);
                continue;
            }
        }
        workingContext.push(componentScope);
        if (item.hasOwnProperty(i))
            item.$properties[i].set(meta[i], true);
        else if (item.$setCustomData)
            item.$setCustomData(i, meta[i]);
        else
            console.warn("Cannot assign to non-existent property \"" + i + "\". Ignoring assignment.");
        workingContext.pop();
    }
}

// ItemModel. EXPORTED.
JSItemModel = function() {
    this.roleNames = [];

    this.setRoleNames = function(names) {
        this.roleNames = names;
    }

    this.dataChanged = Signal([
        {type:"int", name:"startIndex"},
        {type:"int", name:"endIndex"}
    ]);
    this.rowsInserted = Signal([
        {type:"int", name:"startIndex"},
        {type:"int", name:"endIndex"}
    ]);
    this.rowsMoved = Signal([
        {type:"int", name:"sourceStartIndex"},
        {type:"int", name:"sourceEndIndex"},
        {type:"int", name:"destinationIndex"}
    ]);
    this.rowsRemoved = Signal([
        {type:"int", name:"startIndex"},
        {type:"int", name:"endIndex"}
    ]);
    this.modelReset = Signal();
}

// -----------------------------------------------------------------------------
// Stuff below defines QML things
// -----------------------------------------------------------------------------

// Helper
function unboundMethod() {
    console.log("Unbound method for", this);
}

QMLRenderMode = {
    Canvas: 0,
    DOM: 1
}
QMLOperationFlag = {
    IgnoreReferenceErrors: 1
}

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

    // Flags about current operation state. Used only internally.
    this.operationFlags = 0;


//----------Public Methods----------
    // Start the engine
    this.start = function()
    {
        var i;
        if (!this.running) {
            if (this.renderMode == QMLRenderMode.Canvas) {
                element.addEventListener("touchstart", touchHandler);
                element.addEventListener("mousemove", mousemoveHandler);
            }
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
        doc = QMLDocument(tree, this);
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

// Base object for all qml thingies
function QObject(parent) {
    this.$parent = parent;
    if (parent && parent.$tidyupList)
        parent.$tidyupList.push(this);
    // List of things to tidy up when deleting this object.
    if (!this.$tidyupList)
        this.$tidyupList = [];
    if (!this.$properties)
        this.$properties = {};

    this.$delete = function() {
        while (this.$tidyupList.length > 0) {
            var item = this.$tidyupList[0];
            if (item.$delete) // It's a QObject
                item.$delete();
            else // It must be a signal
                item.disconnect(this);
        }

        for (var i in this.$properties) {
            var prop = this.$properties[i];
            while (prop.$tidyupList.length > 0)
                prop.$tidyupList[0].disconnect(prop);
        }

        if (this.$parent && this.$parent.$tidyupList)
            this.$parent.$tidyupList.splice(this.$parent.$tidyupList.indexOf(this), 1);
    }
}

// Base object for all qml elements
function QMLBaseObject(meta, parent, engine) {
    QObject.call(this, parent);
    var i,
        prop;

    if (!this.$draw)
        this.$draw = noop;

    // scope
    if (!workingContext[workingContext.length-1]) {
        var ids = Object.create(this);
        workingContext[workingContext.length-1] = {
            // Get scope
            get: function() {
                return ids;
            },
            // Define id
            defId: function(name, obj) {
                if (ids[name]) {
                    console.error("QMLDocument: Id " + name
                                + "is not unique. Overriding with object", obj);
                }
                ids[name] = obj;
            },
            // Remove id
            remId: function(name) {
                ids[name] = undefined;
            }
        };
    }
    var componentScope = workingContext[workingContext.length-1];
    this.$scope = componentScope;

    // id
    if (meta.id) {
        this.id = meta.id;
        this.$scope.defId(meta.id, this);
    }

    // properties
    if (meta.$properties) {
        for (i in meta.$properties) {
            prop = meta.$properties[i];
            if (prop.type != "alias") {
                createSimpleProperty(engine, this, i, {type: prop.type});
                this[i] = meta.$properties[i].value;
            }
        }
    }

    // methods
    function createMethod(item, name, method) {
        return evalBinding(null,
                               method + ";" + name,
                               item,
                               workingContext[workingContext.length-1].get(), engine.rootScope);
    }
    if (meta.$functions) {
        for (i in meta.$functions) {
            this[i] = createMethod(this, i, meta.$functions[i]);
        }
    }

    // signals
    if (meta.$signals) {
        for (i in meta.$signals) {
            this[meta.$signals[i].name] = Signal(meta.$signals[i].params);
        }
    }

    // Component.onCompleted
    this.Component = new QObject(this);
    this.Component.completed = Signal([], { altParent: this });
    engine.completedSignals.push(this.Component.completed);

    if (!this.$init)
        this.$init = [];
    this.$init.push(function() {
        applyProperties(meta, this, this, componentScope, engine.rootScope);
    });
}

function updateHGeometry(newVal, oldVal, propName) {
    var anchors = this.anchors || this;
    if (this.$updatingGeometry)
        return;
    this.$updatingGeometry = true;

    var t, w, width, x, left, hC, right,
        lM = anchors.leftMargin || anchors.margins,
        rM = anchors.rightMargin || anchors.margins;

    // Width
    if (this.$isUsingImplicitWidth && propName == "implicitWidth")
        width = this.implicitWidth;
    else if (propName == "width")
        this.$isUsingImplicitWidth = false;

    // Position TODO: Layouts
    if ((t = anchors.fill) !== undefined) {
        if (!t.$properties.left.changed.isConnected(this, updateHGeometry))
            t.$properties.left.changed.connect(this, updateHGeometry);
        if (!t.$properties.width.changed.isConnected(this, updateHGeometry))
            t.$properties.width.changed.connect(this, updateHGeometry);

        this.$isUsingImplicitWidth = false;
        width = t.width - lM - rM;
        x = t.left - (this.parent ? this.parent.left : 0) + lM;
        left = t.left + lM;
        right = t.right - rM;
        hC = (left + right) / 2;
    } else if ((t = anchors.centerIn) !== undefined) {
        if (!t.$properties.horizontalCenter.changed.isConnected(this, updateHGeometry))
            t.$properties.horizontalCenter.changed.connect(this, updateHGeometry);

        w = width || this.width;
        hC = t.horizontalCenter;
        x = hC - w / 2 - (this.parent ? this.parent.left : 0);
        left = hC - w / 2;
        right = hC + w / 2;
    } else if ((t = anchors.left) !== undefined) {
        left = t + lM
        if ((u = anchors.right) !== undefined) {
            right = u - rM;
            this.$isUsingImplicitWidth = false;
            width = right - left - lM - rM;
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
        if (this.parent && !this.parent.$properties.x.changed.isConnected(this, updateHGeometry))
            this.parent.$properties.x.changed.connect(this, updateHGeometry);

        w = width || this.width;
        left = this.x + (this.parent ? this.parent.left : 0);
        right = left + w;
        hC = left + w / 2;
    }

    if (left !== undefined)
        this.left = left;
    if (hC !== undefined)
        this.horizontalCenter = hC;
    if (right !== undefined)
        this.right = right;
    if (x !== undefined)
        this.x = x;
    if (width !== undefined)
        this.width = width;

    this.$updatingGeometry = false;
}

function updateVGeometry(newVal, oldVal, propName) {
    var anchors = this.anchors || this;
    if (this.$updatingGeometry)
        return;
    this.$updatingGeometry = true;

    var t, w, height, y, top, vC, bottom,
        lM = anchors.topMargin || anchors.margins,
        rM = anchors.bottomMargin || anchors.margins;

    // Height
    if (this.$isUsingImplicitHeight && propName == "implicitHeight")
        height = this.implicitHeight;
    else if (propName == "height")
        this.$isUsingImplicitHeight = false;

    // Position TODO: Layouts
    if ((t = anchors.fill) !== undefined) {
        if (!t.$properties.top.changed.isConnected(this, updateVGeometry))
            t.$properties.top.changed.connect(this, updateVGeometry);
        if (!t.$properties.height.changed.isConnected(this, updateVGeometry))
            t.$properties.height.changed.connect(this, updateVGeometry);

        this.$isUsingImplicitHeight = false;
        height = t.height - lM - rM;
        y = t.top - (this.parent ? this.parent.top : 0) + lM;
        top = t.top + lM;
        bottom = t.bottom - rM;
        vC = (top + bottom) / 2;
    } else if ((t = anchors.centerIn) !== undefined) {
        if (!t.$properties.verticalCenter.changed.isConnected(this, updateVGeometry))
            t.$properties.verticalCenter.changed.connect(this, updateVGeometry);

        w = height || this.height;
        vC = t.verticalCenter;
        y = vC - w / 2 - (this.parent ? this.parent.top : 0);
        top = vC - w / 2;
        bottom = vC + w / 2;
    } else if ((t = anchors.top) !== undefined) {
        top = t + lM
        if ((u = anchors.bottom) !== undefined) {
            bottom = u - rM;
            this.$isUsingImplicitHeight = false;
            height = bottom - top - lM - rM;
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
        bottom = t - rM;
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
        if (this.parent && !this.parent.$properties.y.changed.isConnected(this, updateVGeometry))
            this.parent.$properties.y.changed.connect(this, updateVGeometry);

        w = height || this.height;
        top = this.y + (this.parent ? this.parent.top : 0);
        bottom = top + w;
        vC = top + w / 2;
    }

    if (top !== undefined)
        this.top = top;
    if (vC !== undefined)
        this.verticalCenter = vC;
    if (bottom !== undefined)
        this.bottom = bottom;
    if (y !== undefined)
        this.y = y;
    if (height !== undefined)
        this.height = height;

    this.$updatingGeometry = false;
}

// Item qml object
function QMLItem(meta, parent, engine) {
    QMLBaseObject.call(this, meta, parent, engine);
    var child,
        o, i;

    if (engine.renderMode == QMLRenderMode.DOM) {
        if (!this.$domElement)
            this.$domElement = document.createElement("div");
        this.$domElement.style.position = "absolute";
        this.$domElement.style.pointerEvents = "none";
        this.$domElement.className = meta.$class + (this.id ? " " + this.id : "");
    }
    createSimpleProperty(engine, this, "children");
    createSimpleProperty(engine, this, "resources");
    createSimpleProperty(engine, this, "parent");
    this.children = [];
    this.resources = [];
    this.parentChanged.connect(this, function(newParent, oldParent) {
        if (oldParent) {
            oldParent.children.splice(oldParent.children.indexOf(this), 1);
            if (engine.renderMode == QMLRenderMode.DOM)
                oldParent.$domElement.removeChild(this.$domElement);
        }
        if (newParent && newParent.children.indexOf(this) == -1)
            newParent.children.push(this);
        if (newParent && engine.renderMode == QMLRenderMode.DOM)
            newParent.$domElement.appendChild(this.$domElement);
    });
    this.parentChanged.connect(this, updateHGeometry);
    this.parentChanged.connect(this, updateVGeometry);
    this.childrenChanged.connect(this, function(newItem) {
        newItem.parent = this;
    });
    this.$addChild = function(childMeta) {
        var child = construct(childMeta, this, engine);
        if (child.hasOwnProperty("parent")) // Seems to be an Item. TODO: Use real inheritance and ask using instanceof.
            child.parent = this; // This will also add it to children.
        else
            this.resources.push(child);
    }

    createSimpleProperty(engine, this, "x");
    createSimpleProperty(engine, this, "y");
    createSimpleProperty(engine, this, "width");
    createSimpleProperty(engine, this, "height");
    createSimpleProperty(engine, this, "implicitWidth");
    createSimpleProperty(engine, this, "implicitHeight");
    createSimpleProperty(engine, this, "left");
    createSimpleProperty(engine, this, "right");
    createSimpleProperty(engine, this, "top");
    createSimpleProperty(engine, this, "bottom");
    createSimpleProperty(engine, this, "horizontalCenter");
    createSimpleProperty(engine, this, "verticalCenter");
    createSimpleProperty(engine, this, "rotation");
    createSimpleProperty(engine, this, "scale");
    createSimpleProperty(engine, this, "transform");
    createSimpleProperty(engine, this, "spacing");
    createSimpleProperty(engine, this, "visible");
    createSimpleProperty(engine, this, "opacity");
    createSimpleProperty(engine, this, "clip");
    createSimpleProperty(engine, this, "z");
    this.xChanged.connect(this, updateHGeometry);
    this.yChanged.connect(this, updateVGeometry);
    this.widthChanged.connect(this, updateHGeometry);
    this.heightChanged.connect(this, updateVGeometry);
    this.implicitWidthChanged.connect(this, updateHGeometry);
    this.implicitHeightChanged.connect(this, updateVGeometry);

    this.$isUsingImplicitWidth = true;
    this.$isUsingImplicitHeight = true;

    this.anchors = new QObject(this);
    createSimpleProperty(engine, this.anchors, "left", { altParent: this });
    createSimpleProperty(engine, this.anchors, "right", { altParent: this });
    createSimpleProperty(engine, this.anchors, "top", { altParent: this });
    createSimpleProperty(engine, this.anchors, "bottom", { altParent: this });
    createSimpleProperty(engine, this.anchors, "horizontalCenter", { altParent: this });
    createSimpleProperty(engine, this.anchors, "verticalCenter", { altParent: this });
    createSimpleProperty(engine, this.anchors, "fill", { altParent: this });
    createSimpleProperty(engine, this.anchors, "centerIn", { altParent: this });
    createSimpleProperty(engine, this.anchors, "margins", { altParent: this });
    createSimpleProperty(engine, this.anchors, "leftMargin", { altParent: this });
    createSimpleProperty(engine, this.anchors, "rightMargin", { altParent: this });
    createSimpleProperty(engine, this.anchors, "topMargin", { altParent: this });
    createSimpleProperty(engine, this.anchors, "bottomMargin", { altParent: this });
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

    createSimpleProperty(engine, this, "states");
    createSimpleProperty(engine, this, "state");
    createSimpleProperty(engine, this, "transitions");
    this.statesChanged.connect(this, function() {
        for (var i = 0; i < this.states.length; i++)
            if (this.states[i] instanceof QMLMetaElement)
                this.states[i] = construct(this.states[i], this, engine);
    });
    this.transitionsChanged.connect(this, function() {
        for (var i = 0; i < this.transitions.length; i++)
            if (this.transitions[i] instanceof QMLMetaElement)
                this.transitions[i] = construct(this.transitions[i], this, engine);
    });
    this.stateChanged.connect(this, function(newVal, oldVal) {
        var oldState, newState, i, j, k;
        for (i = 0; i < this.states.length; i++)
            if (this.states[i].name === newVal)
                newState = this.states[i];
            else if (this.states[i].name === oldVal)
                oldState = this.states[i];

        var actions = this.$revertActions.slice();

        // Get current values for revert actions
        for (i in actions) {
            var action  = actions[i];
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
                        origValue: change.target.$properties[item.property].binding
                                    ? new QMLBinding(change.target.$properties[item.property].binding)
                                    : change.target.$properties[item.property].val,
                        value: item.value,
                        from: change.target[item.property],
                        to: undefined,
                        explicit: change.explicit
                    };
                    var found = false;
                    for (k in actions)
                        if (actions[k].target == action.target
                            && actions[k].property == action.property) {
                            found = true;
                            actions[k] = action;
                            break;
                        }
                    if (!found)
                        actions.push(action);

                    // Look for existing revert action, else create it
                    var found = false;
                    for (k = 0; k < this.$revertActions.length; k++)
                        if (this.$revertActions[k].target == change.target
                            && this.$revertActions[k].property == item.property) {
                            if (!change.restoreEntryValues)
                                this.$revertActions.splice(k, 1); // We don't want to revert, so remove it
                            found = true;
                            break;
                        }
                    if (!found && change.restoreEntryValues)
                        this.$revertActions.push({
                            target: change.target,
                            property: item.property,
                            value: change.target.$properties[item.property].binding
                                        ? new QMLBinding(change.target.$properties[item.property].binding)
                                        : change.target.$properties[item.property].val,
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
            action.target[action.property] = action.value;
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
            if (curTransition.from == oldVal || curTransition.reversible && curTransition.from == newVal)
                curRating += 2;
            else if (curTransition.from == "*")
                curRating++;
            else
                continue;
            if (curTransition.to == newVal || curTransition.reversible && curTransition.to == oldVal)
                curRating += 2;
            else if (curTransition.to == "*")
                curRating++;
            else
                continue;
            if (curRating > rating) {
                rating = curRating;
                transition = curTransition;
            }
        }
        if (transition)
            transition.$start(actions);
    });

    this.transformChanged.connect(this, function() {
        for (var i = 0; i < this.transform.length; i++)
            if (this.transform[i] instanceof QMLMetaElement)
                this.transform[i] = construct(this.transform[i], this, engine);
    });

    if (engine.renderMode == QMLRenderMode.DOM) {
        this.$updateTransform = function() {
            var transform = "rotate(" + this.rotation + "deg) scale(" + this.scale + ")";
            for (var i = 0; i < this.transform.length; i++) {
                var t = this.transform[i];
                if (t instanceof QMLRotation)
                    transform += " rotate3d(" + t.axis.x + ", " + t.axis.y + ", " + t.axis.z + ", " + t.angle + "deg)";
                else if (t instanceof QMLScale)
                    transform += " scale(" + t.xScale + ", " + t.yScale + ")";
                else if (t instanceof QMLTranslate)
                    transform += " translate(" + t.x + "px, " + t.y + "px)";
            }
            this.$domElement.style.transform = transform;
            this.$domElement.style.MozTransform = transform;    // Firefox
            this.$domElement.style.webkitTransform = transform; // Chrome, Safari and Opera
            this.$domElement.style.OTransform = transform;      // Opera
            this.$domElement.style.msTransform = transform;     // IE
        }
        this.rotationChanged.connect(this, this.$updateTransform);
        this.scaleChanged.connect(this, this.$updateTransform);
        this.visibleChanged.connect(this, function(newVal) {
            this.$domElement.style.visibility = newVal ? "inherit" : "hidden";
        });
        this.opacityChanged.connect(this, function(newVal) {
            this.$domElement.style.opacity = newVal;
        });
        this.clipChanged.connect(this, function(newVal) {
            this.$domElement.style.overflow = newVal ? "hidden" : "visible";
        });
        this.zChanged.connect(this, function(newVal) {
            this.$domElement.style.zIndex = newVal;
        });
        this.xChanged.connect(this, function(newVal) {
            this.$domElement.style.left = newVal + "px";
        });
        this.yChanged.connect(this, function(newVal) {
            this.$domElement.style.top = newVal + "px";
        });
        this.widthChanged.connect(this, function(newVal) {
            this.$domElement.style.width = newVal ? newVal + "px" : "auto";
        });
        this.heightChanged.connect(this, function(newVal) {
            this.$domElement.style.height = newVal ? newVal + "px" : "auto";
        });
    } else {
        this.rotationChanged.connect(engine.$requestDraw);
        this.visibleChanged.connect(engine.$requestDraw);
        this.zChanged.connect(engine.$requestDraw);
        this.xChanged.connect(engine.$requestDraw);
        this.yChanged.connect(engine.$requestDraw);
        this.widthChanged.connect(engine.$requestDraw);
        this.heightChanged.connect(engine.$requestDraw);
    }

    this.implicitHeight = 0;
    this.implicitWidth = 0;
    this.spacing = 0;
    this.x = 0;
    this.y = 0;
    this.anchors.margins = 0;
    this.visible = true;
    this.opacity = 1;
    this.$revertActions = [];
    this.states = [];
    this.transitions = [];
    this.state = "";
    this.transform = [];
    this.rotation = 0;
    this.scale = 1;

    this.$init.push(function() {
        for (var i = 0; i < this.children.length; i++)
            for (var j = 0; j < this.children[i].$init.length; j++)
                this.children[i].$init[j].call(this.children[i]);
        for (var i = 0; i < this.resources.length; i++)
            for (var j = 0; j < this.resources[i].$init.length; j++)
                this.resources[i].$init[j].call(this.resources[i]);
        for (var i = 0; i < this.states.length; i++)
            for (var j = 0; j < this.states[i].$init.length; j++)
                this.states[i].$init[j].call(this.states[i]);
        for (var i = 0; i < this.transitions.length; i++)
            for (var j = 0; j < this.transitions[i].$init.length; j++)
                this.transitions[i].$init[j].call(this.transitions[i]);
        for (var i = 0; i < this.transform.length; i++)
            for (var j = 0; j < this.transform[i].$init.length; j++)
                this.transform[i].$init[j].call(this.transform[i]);
    });

    this.$draw = function(c) {
        var i;
        if (this.visible !== false) { // Undefined means inherit, means true
            if (this.$drawItem ) {
                var rotRad = (this.rotation || 0) / 180 * Math.PI,
                    rotOffsetX = Math.sin(rotRad) * this.width,
                    rotOffsetY = Math.sin(rotRad) * this.height;
                c.save();

                // Handle rotation
                // todo: implement transformOrigin
                c.globalAlpha = this.opacity;
                c.translate(this.left + rotOffsetX, this.top + rotOffsetY);
                c.rotate(rotRad);
                c.translate(-this.left, -this.top);
                // Leave offset for drawing...
                this.$drawItem(c);
                c.translate(-rotOffsetX, -rotOffsetY);
                c.restore();
            }
            for (i = 0; i < this.children.length; i++) {
                if (this.children[i]
                    && this.children[i].$draw) {
                    this.children[i].$draw(c);
                }
            }
        }
    }
}

function QMLPositioner(meta, parent, engine) {
    QMLItem.call(this, meta, parent, engine);

    createSimpleProperty(engine, this, "spacing");
    this.spacingChanged.connect(this, this.layoutChildren);
    this.childrenChanged.connect(this, this.layoutChildren);
    this.childrenChanged.connect(this, QMLPositioner.slotChildrenChanged);

    this.spacing = 0;
}
QMLPositioner.slotChildrenChanged = function() {
    for (var i = 0; i < this.children.length; i++) {
        var child = this.children[i];
        if (!child.widthChanged.isConnected(this, this.layoutChildren))
            child.widthChanged.connect(this, this.layoutChildren);
        if (!child.heightChanged.isConnected(this, this.layoutChildren))
            child.heightChanged.connect(this, this.layoutChildren);
        if (!child.visibleChanged.isConnected(this, this.layoutChildren))
            child.visibleChanged.connect(this, this.layoutChildren);
        if (!child.opacityChanged.isConnected(this, this.layoutChildren))
            child.opacityChanged.connect(this, this.layoutChildren);
    }
}

function QMLRow(meta, parent, engine) {
    QMLPositioner.call(this, meta, parent, engine);

    createSimpleProperty(engine, this, "layoutDirection");
    this.layoutDirectionChanged.connect(this, this.layoutChildren);
    this.layoutDirection = 0;
}
QMLRow.prototype.layoutChildren = function() {
    var curPos = 0,
        maxHeight = 0,
        // When layoutDirection is RightToLeft we need oposite order
        i = this.layoutDirection == 1 ? this.children.length - 1 : 0,
        endPoint = this.layoutDirection == 1 ? -1 : this.children.length,
        step = this.layoutDirection == 1 ? -1 : 1;
    for (; i !== endPoint; i += step) {
        var child = this.children[i];
        if (!(child.visible && child.opacity && child.width && child.height))
            continue;
        maxHeight = child.height > maxHeight ? child.height : maxHeight;

        child.x = curPos;
        curPos += child.width + this.spacing;
    }
    this.height = maxHeight;
    this.width = curPos - this.spacing; // We want no spacing at the right side
}

function QMLColumn(meta, parent, engine) {
    QMLPositioner.call(this, meta, parent, engine);
}
QMLColumn.prototype.layoutChildren = function() {
    var curPos = 0,
        maxWidth = 0;
    for (var i = 0; i < this.children.length; i++) {
        var child = this.children[i];
        if (!(child.visible && child.opacity && child.width && child.height))
            continue;
        maxWidth = child.width > maxWidth ? child.width : maxWidth;

        child.y = curPos;
        curPos += child.height + this.spacing;
    }
    this.width = maxWidth;
    this.height = curPos - this.spacing; // We want no spacing at the bottom side
}

function QMLGrid(meta, parent, engine) {
    QMLPositioner.call(this, meta, parent, engine);

    this.Grid = {
        LeftToRight: 0,
        TopToBottom: 1
    }

    createSimpleProperty(engine, this, "columns");
    createSimpleProperty(engine, this, "rows");
    createSimpleProperty(engine, this, "flow");
    createSimpleProperty(engine, this, "layoutDirection");
    this.columnsChanged.connect(this, this.layoutChildren);
    this.rowsChanged.connect(this, this.layoutChildren);
    this.flowChanged.connect(this, this.layoutChildren);
    this.layoutDirectionChanged.connect(this, this.layoutChildren);

    this.flow = 0;
    this.layoutDirection = 0;
}
QMLGrid.prototype.layoutChildren = function() {
    var visibleItems = [],
        r = 0, c = 0,
        colWidth = [],
        rowHeight = [],
        gridWidth = 0,
        gridHeight = 0,
        curHPos = 0,
        curVPos = 0;

    // How many items are actually visible?
    for (var i = 0; i < this.children.length; i++) {
        var child = this.children[i];
        if (child.visible && child.opacity && child.width && child.height)
            visibleItems.push(this.children[i]);
    }

    // How many rows and columns do we need?
    if (!this.columns && !this.rows) {
        c = 4;
        r = Math.ceil(visibleItems.length / 4);
    } else if (!this.rows) {
        c = this.columns;
        r = Math.ceil(visibleItems.length / c);
    } else if (!this.columns) {
        r = this.rows;
        c = Math.ceil(visibleItems.length / r);
    }

    // How big are the colums/rows?
    if (this.flow == 0)
        for (var i = 0; i < r; i++) {
            for (var j = 0; j < c; j++) {
                var item = visibleItems[i*c+j];
                if (!item)
                    break;
                if (!colWidth[j] || item.width > colWidth[j])
                    colWidth[j] = item.width;
                if (!rowHeight[i] || item.height > rowHeight[i])
                    rowHeight[i] = item.height;
            }
        }
    else
        for (var i = 0; i < c; i++) {
            for (var j = 0; j < r; j++) {
                var item = visibleItems[i*r+j];
                if (!item)
                    break;
                if (!rowHeight[j] || item.height > rowHeight[j])
                    rowHeight[j] = item.height;
                if (!colWidth[i] || item.width > colWidth[i])
                    colWidth[i] = item.width;
            }
        }

    // Do actual positioning
    // When layoutDirection is RightToLeft we need oposite order of coumns
    var step = this.layoutDirection == 1 ? -1 : 1,
        startingPoint = this.layoutDirection == 1 ? c - 1 : 0,
        endPoint = this.layoutDirection == 1 ? -1 : c;
    if (this.flow == 0)
        for (var i = 0; i < r; i++) {
            for (var j = startingPoint; j !== endPoint; j += step) {
                var item = visibleItems[i*c+j];
                if (!item)
                    break;
                item.x = curHPos;
                item.y = curVPos;

                curHPos += colWidth[j] + this.spacing;
            }
            curVPos += rowHeight[i] + this.spacing;
            curHPos = 0;
        }
    else
        for (var i = startingPoint; i !== endPoint; i += step) {
            for (var j = 0; j < r; j++) {
                var item = visibleItems[i*r+j];
                if (!item)
                    break;
                item.x = curHPos;
                item.y = curVPos;

                curVPos += rowHeight[j] + this.spacing;
            }
            curHPos += colWidth[i] + this.spacing;
            curVPos = 0;
        }
}

function QMLFlow(meta, parent, engine) {
    QMLPositioner.call(this, meta, parent, engine);

    this.Flow = {
        LeftToRight: 0,
        TopToBottom: 1
    }

    createSimpleProperty(engine, this, "flow");
    createSimpleProperty(engine, this, "layoutDirection");
    this.flowChanged.connect(this, this.layoutChildren);
    this.layoutDirectionChanged.connect(this, this.layoutChildren);

    this.flow = 0;
    this.layoutDirection = 0;
}
QMLFlow.prototype.layoutChildren = function() {
    var curHPos = 0,
        curVPos = 0,
        rowSize = 0;
    for (var i = 0; i < this.children.length; i++) {
        var child = this.children[i];
        if (!(child.visible && child.opacity && child.width && child.height))
            continue;

        if (this.flow == 0) {
            if (curHPos + child.width > this.width) {
                curHPos = 0;
                curVPos += rowSize + this.spacing;
                rowSize = 0;
            }
            rowSize = child.height > rowSize ? child.height : rowSize;

            child.x = this.layoutDirection == 1
                    ? this.width - curHPos - child.width : curHPos;
            child.y = curVPos;
            curHPos += child.width + this.spacing;
        } else {
            if (curVPos + child.height > this.height) {
                curVPos = 0;
                curHPos += rowSize + this.spacing;
                rowSize = 0;
            }
            rowSize = child.width > rowSize ? child.width : rowSize;

            child.x = this.layoutDirection == 1
                    ? this.width - curHPos - child.width : curHPos;
            child.y = curVPos;
            curVPos += child.height + this.spacing;
        }
    }
    if (this.flow == 0)
        this.height = curVPos + rowSize;
    else
        this.width = curHPos + rowSize;
}

function QMLRotation(meta, parent, engine) {
    QMLBaseObject.call(this, meta, parent, engine);

    createSimpleProperty(engine, this, "angle");

    this.axis = new QObject(this);
    createSimpleProperty(engine, this.axis, "x");
    createSimpleProperty(engine, this.axis, "y");
    createSimpleProperty(engine, this.axis, "z");

    this.origin = new QObject(this);
    createSimpleProperty(engine, this.origin, "x");
    createSimpleProperty(engine, this.origin, "y");

    if (engine.renderMode == QMLRenderMode.DOM) {
        function updateOrigin() {
            parent.$domElement.style.transformOrigin = this.origin.x + "px " + this.origin.y + "px";
            parent.$domElement.style.MozTransformOrigin = this.origin.x + "px " + this.origin.y + "px";    // Firefox
            parent.$domElement.style.webkitTransformOrigin = this.origin.x + "px " + this.origin.y + "px"; // Chrome, Safari and Opera
        }
        this.angleChanged.connect(parent, parent.$updateTransform);
        this.axis.xChanged.connect(parent, parent.$updateTransform);
        this.axis.yChanged.connect(parent, parent.$updateTransform);
        this.axis.zChanged.connect(parent, parent.$updateTransform);
        this.origin.xChanged.connect(this, updateOrigin);
        this.origin.yChanged.connect(this, updateOrigin);

        this.angle = 0;
        this.axis.x = 0;
        this.axis.y = 0;
        this.axis.z = 1;
        this.origin.x = 0;
        this.origin.y = 0;
    }
}

function QMLScale(meta, parent, engine) {
    QMLBaseObject.call(this, meta, parent, engine);

    createSimpleProperty(engine, this, "xScale");
    createSimpleProperty(engine, this, "yScale");

    this.origin = new QObject(this);
    createSimpleProperty(engine, this.origin, "x");
    createSimpleProperty(engine, this.origin, "y");

    if (engine.renderMode == QMLRenderMode.DOM) {
        function updateOrigin() {
            parent.$domElement.style.transformOrigin = this.origin.x + "px " + this.origin.y + "px";
            parent.$domElement.style.MozTransformOrigin = this.origin.x + "px " + this.origin.y + "px";    // Firefox
            parent.$domElement.style.webkitTransformOrigin = this.origin.x + "px " + this.origin.y + "px"; // Chrome, Safari and Opera
        }
        this.xScaleChanged.connect(parent, parent.$updateTransform);
        this.yScaleChanged.connect(parent, parent.$updateTransform);
        this.origin.xChanged.connect(this, updateOrigin);
        this.origin.yChanged.connect(this, updateOrigin);

        this.xScale = 0;
        this.yScale = 0;
        this.origin.x = 0;
        this.origin.y = 0;
    }

}

function QMLTranslate(meta, parent, engine) {
    QMLBaseObject.call(this, meta, parent, engine);

    createSimpleProperty(engine, this, "x");
    createSimpleProperty(engine, this, "y");

    if (engine.renderMode == QMLRenderMode.DOM) {
        this.xChanged.connect(parent, parent.$updateTransform);
        this.yChanged.connect(parent, parent.$updateTransform);

        this.x = 0;
        this.y = 0;
    }

}

function QMLFont(parent, engine) {
    QObject.call(this);
    createSimpleProperty(engine, this, "bold", { altParent: parent });
    createSimpleProperty(engine, this, "capitalization", { altParent: parent });
    createSimpleProperty(engine, this, "family", { altParent: parent });
    createSimpleProperty(engine, this, "italic", { altParent: parent });
    createSimpleProperty(engine, this, "letterSpacing", { altParent: parent });
    createSimpleProperty(engine, this, "pixelSize", { altParent: parent });
    createSimpleProperty(engine, this, "pointSize", { altParent: parent });
    createSimpleProperty(engine, this, "strikeout", { altParent: parent });
    createSimpleProperty(engine, this, "underline", { altParent: parent });
    createSimpleProperty(engine, this, "weight", { altParent: parent });
    createSimpleProperty(engine, this, "wordSpacing", { altParent: parent });

    if (engine.renderMode == QMLRenderMode.DOM) {
        this.pointSizeChanged.connect(function(newVal) {
            parent.$domElement.firstChild.style.fontSize = newVal + "pt";
        });
        this.boldChanged.connect(function(newVal) {
            parent.$domElement.firstChild.style.fontWeight =
                parent.font.weight !== Undefined ? parent.font.weight :
                newVal ? "bold" : "normal";
        });
        this.capitalizationChanged.connect(function(newVal) {
            parent.$domElement.firstChild.style.fontVariant =
                newVal == "smallcaps" ? "small-caps" : "normal";
            newVal = newVal == "smallcaps" ? "none" : newVal;
            parent.$domElement.firstChild.style.textTransform = newVal;
        });
        this.familyChanged.connect(function(newVal) {
            parent.$domElement.firstChild.style.fontFamily = newVal;
        });
        this.italicChanged.connect(function(newVal) {
            parent.$domElement.firstChild.style.fontStyle = newVal ? "italic" : "normal";
        });
        this.letterSpacingChanged.connect(function(newVal) {
            parent.$domElement.firstChild.style.letterSpacing = newVal !== Undefined ? newVal + "px" : "";
        });
        this.pixelSizeChanged.connect(function(newVal) {
            var val = newVal !== Undefined ? newVal + "px "
                : (parent.font.pointSize || 10) + "pt";
            parent.$domElement.style.fontSize = val;
            parent.$domElement.firstChild.style.fontSize = val;
        });
        this.pointSizeChanged.connect(function(newVal) {
            var val = parent.font.pixelSize !== Undefined ? parent.font.pixelSize + "px "
                : (newVal || 10) + "pt";
            parent.$domElement.style.fontSize = val;
            parent.$domElement.firstChild.style.fontSize = val;
        });
        this.strikeoutChanged.connect(function(newVal) {
            parent.$domElement.firstChild.style.textDecoration = newVal
                ? "line-through"
                : parent.font.underline
                ? "underline"
                : "none";
        });
        this.underlineChanged.connect(function(newVal) {
            parent.$domElement.firstChild.style.textDecoration = parent.font.strikeout
                ? "line-through"
                : newVal
                ? "underline"
                : "none";
        });
        this.weightChanged.connect(function(newVal) {
            parent.$domElement.firstChild.style.fontWeight =
                newVal !== Undefined ? newVal :
                parent.font.bold ? "bold" : "normal";
        });
        this.wordSpacingChanged.connect(function(newVal) {
            parent.$domElement.firstChild.style.wordSpacing = newVal !== Undefined ? newVal + "px" : "";
        });
    }
}

function QMLText(meta, parent, engine) {
    QMLItem.call(this, meta, parent, engine);

    if (engine.renderMode == QMLRenderMode.DOM) {
        // We create another span inside the text to distinguish the actual
        // (possibly html-formatted) text from child elements
        this.$domElement.innerHTML = "<span></span>";
        this.$domElement.style.pointerEvents = "auto";
        this.$domElement.firstChild.style.width = "100%";
        this.$domElement.firstChild.style.height = "100%";
    }

    // Creates font css description
    function fontCss(font) {
        var css = "";
        css += font.italic ? "italic " : "normal ";
        css += font.capitalization == "smallcaps" ? "small-caps " : "normal ";
        // Canvas seems to only support bold yes or no
        css += (font.weight == Font.Bold
            || font.weight == Font.DemiBold
            || font.weight == Font.Black
            || font.bold) ? "bold " : "normal ";
        css += font.pixelSize !== Undefined
            ? font.pixelSize + "px "
            : (font.pointSize || 10) + "pt ";
        css += this.lineHeight !== Undefined ? this.lineHeight + "px " : " ";
        css += (font.family || "sans-serif") + " ";
        return css;
    }

    this.Text = {
        // Wrap Mode
        NoWrap: 0,
        WordWrap: 1,
        WrapAnywhere: 2,
        Wrap: 3,
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
    }

    this.font = new QMLFont(this, engine);

    createSimpleProperty(engine, this, "color");
    createSimpleProperty(engine, this, "text");
    createSimpleProperty(engine, this, "lineHeight");
    createSimpleProperty(engine, this, "wrapMode");
    createSimpleProperty(engine, this, "horizontalAlignment");
    createSimpleProperty(engine, this, "style");
    createSimpleProperty(engine, this, "styleColor");

    if (engine.renderMode == QMLRenderMode.DOM) {
        this.colorChanged.connect(this, function(newVal) {
            this.$domElement.firstChild.style.color = newVal;
        });
        this.textChanged.connect(this, function(newVal) {
            this.$domElement.firstChild.innerHTML = newVal;
        });
        this.lineHeightChanged.connect(this, function(newVal) {
            this.$domElement.firstChild.style.lineHeight = newVal + "px";
        });
        this.wrapModeChanged.connect(this, function(newVal) {
            switch (newVal) {
                case 0:
                    this.$domElement.firstChild.style.whiteSpace = "pre";
                    break;
                case 1:
                    this.$domElement.firstChild.style.whiteSpace = "pre-wrap";
                    break;
                case 2:
                    this.$domElement.firstChild.style.whiteSpace = "pre-wrap";
                    this.$domElement.firstChild.style.wordBreak = "break-all";
                    break;
                case 3:
                    this.$domElement.firstChild.style.whiteSpace = "pre-wrap";
                    this.$domElement.firstChild.style.wordWrap = "break-word";
            };
            // AlignJustify doesn't work with pre/pre-wrap, so we decide the
            // lesser of the two evils to be ignoring "\n"s inside the text.
            if (this.horizontalAlignment == "justify")
                this.$domElement.firstChild.style.whiteSpace = "normal";
        });
        this.horizontalAlignmentChanged.connect(this, function(newVal) {
            this.$domElement.style.textAlign = newVal;
            // AlignJustify doesn't work with pre/pre-wrap, so we decide the
            // lesser of the two evils to be ignoring "\n"s inside the text.
            if (newVal == "justify")
                this.$domElement.firstChild.style.whiteSpace = "normal";
        });
        this.styleChanged.connect(this, function(newVal) {
            switch (newVal) {
                case 0:
                    this.$domElement.firstChild.style.textShadow = "none";
                    break;
                case 1:
                    var color = this.styleColor;
                    this.$domElement.firstChild.style.textShadow = "1px 0 0 " + color
                        + ", -1px 0 0 " + color
                        + ", 0 1px 0 " + color
                        + ", 0 -1px 0 " + color;
                    break;
                case 2:
                    this.$domElement.firstChild.style.textShadow = "1px 1px 0 " + this.styleColor;
                    break;
                case 3:
                    this.$domElement.firstChild.style.textShadow = "-1px -1px 0 " + this.styleColor;
            };
        });
        this.styleColorChanged.connect(this, function(newVal) {
            switch (this.style) {
                case 0:
                    this.$domElement.firstChild.style.textShadow = "none";
                    break;
                case 1:
                    this.$domElement.firstChild.style.textShadow = "1px 0 0 " + newVal
                        + ", -1px 0 0 " + newVal
                        + ", 0 1px 0 " + newVal
                        + ", 0 -1px 0 " + newVal;
                    break;
                case 2:
                    this.$domElement.firstChild.style.textShadow = "1px 1px 0 " + newVal;
                    break;
                case 3:
                    this.$domElement.firstChild.style.textShadow = "-1px -1px 0 " + newVal;
            };
        });
    }

    this.font.family = "sans-serif";
    this.font.pointSize = 10;
    this.wrapMode = this.Text.NoWrap;
    this.color = "black";
    this.text = "";

    this.textChanged.connect(this, updateImplicitHeight);
    this.textChanged.connect(this, updateImplicitWidth);
    this.font.boldChanged.connect(this, updateImplicitHeight);
    this.font.boldChanged.connect(this, updateImplicitWidth);
    this.font.pixelSizeChanged.connect(this, updateImplicitHeight);
    this.font.pixelSizeChanged.connect(this, updateImplicitWidth);
    this.font.pointSizeChanged.connect(this, updateImplicitHeight);
    this.font.pointSizeChanged.connect(this, updateImplicitWidth);
    this.font.familyChanged.connect(this, updateImplicitHeight);
    this.font.familyChanged.connect(this, updateImplicitWidth);
    this.font.letterSpacingChanged.connect(this, updateImplicitHeight);
    this.font.wordSpacingChanged.connect(this, updateImplicitWidth);

    this.$init.push(function() {
        updateImplicitWidth.call(this);
        updateImplicitHeight.call(this);
    });

    function updateImplicitHeight() {
        var height;

        if (this.text === Undefined || this.text === "") {
            height = 0;
        } else if (engine.renderMode == QMLRenderMode.DOM) {
            height = this.$domElement ? this.$domElement.firstChild.offsetHeight : 0;
        } else {
            var el = document.createElement("span");
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
        }

        this.implicitHeight = height;
    }

    function updateImplicitWidth() {
        var width;

        if (this.text === Undefined || this.text === "")
            width = 0;
        else if (engine.renderMode == QMLRenderMode.DOM)
            width = this.$domElement ? this.$domElement.firstChild.offsetWidth : 0;
        else
            width = engine.$getTextMetrics(this.text, fontCss(this.font)).width;

        this.implicitWidth = width;
    }

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

    createSimpleProperty(engine, this, "color");
    createSimpleProperty(engine, this, "radius");

    this.border = new QObject(this);
    createSimpleProperty(engine, this.border, "color", { altParent: this });
    createSimpleProperty(engine, this.border, "width", { altParent: this });

    if (engine.renderMode == QMLRenderMode.DOM) {
        this.colorChanged.connect(this, function(newVal) {
            this.$domElement.style.backgroundColor = newVal;
        });
        this.radiusChanged.connect(this, function(newVal) {
            this.$domElement.style.borderRadius = newVal + "px";
        });
        this.border.colorChanged.connect(this, function(newVal) {
            this.$domElement.style.borderColor = newVal;
            this.$domElement.style.borderStyle = this.border.width == 0 || newVal == "transparent"
                                                ? "none" : "solid";
        });
        this.border.widthChanged.connect(this, function(newVal) {
            this.$domElement.style.borderWidth = newVal + "px";
            this.$domElement.style.borderStyle = newVal == 0 || this.border.color == "transparent"
                                                ? "none" : "solid";
        });
    }

    this.color = "white";
    this.border.color = "transparent";
    this.border.width = 1;
    this.radius = 0;

    this.$drawItem = function(c) {
        //descr("draw rect", this, ["x", "y", "width", "height", "color"]);
        //descr("draw rect.border", this.border, ["color", "width"]);
        c.save();
        c.fillStyle = this.color;
        c.strokeStyle = this.border.color;
        c.lineWidth = this.border.width;

        if (!this.radius) {
            c.fillRect(this.left, this.top, this.width, this.height);
            c.strokeRect(this.left, this.top, this.width, this.height);
        } else {
            var r = this.left + this.width;
            var b = this.top + this.height;
            c.beginPath();
            c.moveTo(this.left + this.radius, this.top);
            c.lineTo(r - this.radius, this.top);
            c.quadraticCurveTo(r, this.top, r, this.top + this.radius);
            c.lineTo(r, this.top + this.height - this.radius);
            c.quadraticCurveTo(r, b, r - this.radius, b);
            c.lineTo(this.left + this.radius, b);
            c.quadraticCurveTo(this.left, b, this.left, b - this.radius);
            c.lineTo(this.left, this.top + this.radius);
            c.quadraticCurveTo(this.left, this.top, this.left + this.radius, this.top);
            c.stroke();
            c.fill();
        }
        c.restore();
    }
}

function QMLRepeater(meta, parent, engine) {
    QMLItem.call(this, meta, parent, engine);
    var self = this;

    createSimpleProperty(engine, this, "delegate");
    createSimpleProperty(engine, this, "model");
    createSimpleProperty(engine, this, "count");
    this.$completed = false;
    this.$items = []; // List of created items
    this.$addChild = function(childMeta) {
        this.delegate = childMeta;
    }

    this.modelChanged.connect(applyModel);
    this.delegateChanged.connect(applyModel);

    this.model = 0;
    this.count = 0;

    this.$init.push(function() {
        this.$completed = true;
    });

    this.itemAt = function(index) {
        return this.$items[index];
    }

    function applyChildProperties(child) {
        createSimpleProperty(engine, child, "index");
        child.index = new QMLBinding("parent.index");
        var model = self.model instanceof QMLListModel ? self.model.$model : self.model;
        for (var i in model.roleNames) {
            var func = (function(i) { return function() {
                    return model.data(child.index, model.roleNames[i]);
                    }
                })(i);
            setupGetter(child, model.roleNames[i], func);
        }
        for (var i = 0; i < child.children.length; i++)
            applyChildProperties(child.children[i]);
    }
    function callOnCompleted(child) {
        child.Component.completed();
        for (var i = 0; i < child.children.length; i++)
            callOnCompleted(child.children[i]);
    }
    function insertChildren(startIndex, endIndex) {
        workingContext.push(self.$scope);
        for (var index = startIndex; index < endIndex; index++) {
            var newMeta = cloneObject(self.delegate);
            newMeta.id = newMeta.id + index;
            var newItem = construct(newMeta, self, engine);

            if (engine.renderMode == QMLRenderMode.DOM && self.delegate.id)
                newItem.$domElement.className += " " + self.delegate.id;

            parent.children.splice(parent.children.indexOf(self) - self.$items.length + index, 0, newItem);
            newItem.parent = self.parent;
            self.$items.splice(index, 0, newItem);

            applyChildProperties(newItem);
            newItem.index = index;
            if (self.$completed) {
                // We don't call those on first creation, as they will be called
                // by the regular creation-procedures at the right time.
                for (var i = 0; i < newItem.$init.length; i++)
                    newItem.$init[i].call(newItem);
                callOnCompleted(newItem);
            }
        }
        for (var i = endIndex; i < self.$items.length; i++) {
            self.$items[i].index = i;
        }
        workingContext.pop();
        self.count = self.$items.length;
    }

    function applyModel() {
        if (!self.delegate)
            return;
        var model = self.model instanceof QMLListModel ? self.model.$model : self.model;
        if (model instanceof JSItemModel) {
            model.dataChanged.connect(function(startIndex, endIndex) {
                //TODO
            });
            model.rowsInserted.connect(insertChildren);
            model.rowsMoved.connect(function(sourceStartIndex, sourceEndIndex, destinationIndex) {
                var vals = self.$items.splice(sourceStartIndex, sourceEndIndex-sourceStartIndex);
                for (var i = 0; i < vals.length; i++) {
                    self.$items.splice(destinationIndex + i, 0, vals[i]);
                }
                var smallestChangedIndex = sourceStartIndex < destinationIndex
                                        ? sourceStartIndex : destinationIndex;
                for (var i = smallestChangedIndex; i < self.$items.length; i++) {
                    self.$items[i].index = i;
                }
                engine.$requestDraw();
            });
            model.rowsRemoved.connect(function(startIndex, endIndex) {
                removeChildren(startIndex, endIndex);
                for (var i = startIndex; i < self.$items.length; i++) {
                    self.$items[i].index = i;
                }
                self.count = self.$items.length;
                engine.$requestDraw();
            });
            model.modelReset.connect(function() {
                removeChildren(0, self.$items.length);
                insertChildren(0, model.rowCount());
                engine.$requestDraw();
            });

            insertChildren(0, model.rowCount());
        } else if (typeof model == "number") {
            removeChildren(0, self.$items.length);
            insertChildren(0, model);
        }
    }

    function removeChildren(startIndex, endIndex) {
        var removed = self.$items.splice(startIndex, endIndex - startIndex);
        for (var index in removed) {
            removed[index].$delete();
            removed[index].parent = undefined;
            removeChildProperties(removed[index]);
        }
    }
    function removeChildProperties(child) {
        if (child.id)
            self.$scope.remId(child.id);
        if (engine.renderMode == QMLRenderMode.Canvas && child instanceof QMLMouseArea)
            engine.mouseAreas.splice(engine.mouseAreas.indexOf(child), 1);
        engine.completedSignals.splice(engine.completedSignals.indexOf(child.Component.completed));
        for (var i = 0; i < child.children.length; i++)
            removeChildProperties(child.children[i])
    }
}

function QMLListModel(meta, parent, engine) {
    QMLBaseObject.call(this, meta, parent, engine);
    var self = this,
    firstItem = true;

    createSimpleProperty(engine, this, "count");
    this.$items = [];
    this.$model = new JSItemModel();
    this.count = 0;
    this.$addChild = function(meta) {
        this.append(construct(meta, this, engine));
    }

    this.$model.data = function(index, role) {
        return self.$items[index][role];
    }
    this.$model.rowCount = function() {
        return self.$items.length;
    }

    this.append = function(dict) {
        this.insert(this.$items.length, dict);
    }
    this.clear = function() {
        this.$items = [];
        this.$model.modelReset();
        this.count = 0;
    }
    this.get = function(index) {
        return this.$items[index];
    }
    this.insert = function(index, dict) {
        if (firstItem) {
            firstItem = false;
            var roleNames = [];
            for (var i in dict) {
                if (i != "id" && i != "index" && i[0] != "$")
                    roleNames.push(i);
            }
            this.$model.setRoleNames(roleNames);
        }
        this.$items.splice(index, 0, dict);
        this.$model.rowsInserted(index, index+1);
        this.count = this.$items.length;
    }
    this.move = function(from, to, n) {
        var vals = this.$items.splice(from, n);
        for (var i = 0; i < vals.length; i++) {
            this.$items.splice(to + i, 0, vals[i]);
        }
        this.$model.rowsMoved(from, from+n, to);
    }
    this.remove = function(index) {
        this.$items.splice(index, 1);
        this.$model.rowsRemoved(index, index+1);
        this.count = this.$items.length;
    }
    this.set = function(index, dict) {
        this.$items[index] = dict;
        engine.$requestDraw();
    }
    this.setProperty = function(index, property, value) {
        this.$items[index][property] = value;
        engine.$requestDraw();
    }
}

function QMLListElement(meta, parent, engine) {
    // QMLListElement can't have children and needs special handling of properties
    // thus we don't use QMLBaseObject for it
    var values = [];

    for (var i in meta) {
        if (i[0] != "$") {
            values[i] = meta[i];
            setupGetterSetter(this, i,
                (function(name){
                    return function() {
                        return values[name];
                    }
                })(i),
                (function(name) {
                    return function(newVal) {
                        val = newVal;
                        parent.$model.dataChanged(this.index, this.index);
                    }
                })(name)
            );
        }
    }

    var componentScope = workingContext[workingContext.length-1];

    this.$init = [function() {
        applyProperties(meta, this, this, componentScope, engine.rootScope);
    }];
}

function QMLImage(meta, parent, engine) {
    QMLItem.call(this, meta, parent, engine);
    var img = new Image(),
        self = this;

    if (engine.renderMode == QMLRenderMode.DOM) {
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.position = "absolute";
        this.$domElement.appendChild(img);
    }

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
    createSimpleProperty(engine, this, "asynchronous");
    createSimpleProperty(engine, this, "cache");
    createSimpleProperty(engine, this, "smooth");

    createSimpleProperty(engine, this, "fillMode");
    createSimpleProperty(engine, this, "mirror");
    createSimpleProperty(engine, this, "progress");
    createSimpleProperty(engine, this, "source");
    createSimpleProperty(engine, this, "status");

    this.sourceSize = new QObject(this);

    createSimpleProperty(engine, this.sourceSize, "width", { altParent: this });
    createSimpleProperty(engine, this.sourceSize, "height", { altParent: this });

    this.asynchronous = true;
    this.cache = true;
    this.smooth = true;
    this.fillMode = this.Image.Stretch;
    this.mirror = false;
    this.progress = 0;
    this.source = "";
    this.status = this.Image.Null;
    this.sourceSize.width = 0;
    this.sourceSize.height = 0;

    // Bind status to img element
    img.onload = function() {
        self.progress = 1;
        self.status = self.Image.Ready;

        var w = img.naturalWidth;
        var h = img.naturalHeight;
        self.sourceSize.width = w;
        self.sourceSize.height = h;
        self.implicitWidth = w;
        self.implicitHeight = h;
    }
    img.onerror = function() {
        self.status = self.Image.Error;
    }

    this.sourceChanged.connect(this, function(val) {
        this.progress = 0;
        this.status = this.Image.Loading;
        img.src = engine.$resolvePath(val);
    });

    this.$drawItem = function(c) {
        //descr("draw image", this, ["left", "top", "width", "height", "source"]);

        if (this.fillMode != this.Image.Stretch) {
            console.log("Images support only Image.Stretch fillMode currently");
        }
        if (this.status == this.Image.Ready) {
            c.save();
            c.drawImage(img, this.left, this.top, this.width, this.height);
            c.restore();
        } else {
            console.log("Waiting for image to load");
        }
    }
}

function QMLBorderImage(meta, parent, engine) {
    QMLItem.call(this, meta, parent, engine);
    var self = this;

    if (engine.renderMode == QMLRenderMode.Canvas)
        var img = new Image();

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
    }

    createSimpleProperty(engine, this, "source");
    createSimpleProperty(engine, this, "status");
    this.border = new QObject(this);
    createSimpleProperty(engine, this.border, "left", { altParent: this });
    createSimpleProperty(engine, this.border, "right", { altParent: this });
    createSimpleProperty(engine, this.border, "top", { altParent: this });
    createSimpleProperty(engine, this.border, "bottom", { altParent: this });
    createSimpleProperty(engine, this, "horizontalTileMode");
    createSimpleProperty(engine, this, "verticalTileMode");

    this.source = "";
    this.status = this.BorderImage.Null;
    this.border.left = 0;
    this.border.right = 0;
    this.border.top = 0;
    this.border.bottom = 0;
    this.horizontalTileMode = this.BorderImage.Stretch;
    this.verticalTileMode = this.BorderImage.Stretch;

    if (engine.renderMode == QMLRenderMode.DOM) {
        this.sourceChanged.connect(this, function() {
            this.$domElement.style.borderImageSource = "url(" + engine.$resolvePath(this.source) + ")";
        });
        this.border.leftChanged.connect(this, updateBorder);
        this.border.rightChanged.connect(this, updateBorder);
        this.border.topChanged.connect(this, updateBorder);
        this.border.bottomChanged.connect(this, updateBorder);
        this.horizontalTileModeChanged.connect(this, updateBorder);
        this.verticalTileModeChanged.connect(this, updateBorder);
    } else {
        this.sourceChanged.connect(this, function(val) {
            this.progress = 0;
            this.status = this.BorderImage.Loading;
            img.src = engine.$resolvePath(val);
        });
        img.onload = function() {
            self.progress = 1;
            self.status = self.BorderImage.Ready;
            engine.$requestDraw();
        }
        img.onerror = function() {
            self.status = self.BorderImage.Error;
        }
    }

    function updateBorder() {
        this.$domElement.style.MozBorderImageSource = "url(" + engine.$resolvePath(this.source) + ")";
        this.$domElement.style.MozBorderImageSlice = this.border.top + " "
                                                + this.border.right + " "
                                                + this.border.bottom + " "
                                                + this.border.left;
        this.$domElement.style.MozBorderImageRepeat = this.horizontalTileMode + " "
                                                    + this.verticalTileMode;
        this.$domElement.style.MozBorderImageWidth = this.border.top + " "
                                                + this.border.right + " "
                                                + this.border.bottom + " "
                                                + this.border.left;

        this.$domElement.style.webkitBorderImageSource = "url(" + engine.$resolvePath(this.source) + ")";
        this.$domElement.style.webkitBorderImageSlice = this.border.top + " "
                                                + this.border.right + " "
                                                + this.border.bottom + " "
                                                + this.border.left;
        this.$domElement.style.webkitBorderImageRepeat = this.horizontalTileMode + " "
                                                    + this.verticalTileMode;
        this.$domElement.style.webkitBorderImageWidth = this.border.top + " "
                                                + this.border.right + " "
                                                + this.border.bottom + " "
                                                + this.border.left;

        this.$domElement.style.OBorderImageSource = "url(" + engine.$resolvePath(this.source) + ")";
        this.$domElement.style.OBorderImageSlice = this.border.top + " "
                                                + this.border.right + " "
                                                + this.border.bottom + " "
                                                + this.border.left;
        this.$domElement.style.OBorderImageRepeat = this.horizontalTileMode + " "
                                                    + this.verticalTileMode;
        this.$domElement.style.OBorderImageWidth = this.border.top + "px "
                                                + this.border.right + "px "
                                                + this.border.bottom + "px "
                                                + this.border.left + "px";

        this.$domElement.style.borderImageSlice = this.border.top + " "
                                                + this.border.right + " "
                                                + this.border.bottom + " "
                                                + this.border.left;
        this.$domElement.style.borderImageRepeat = this.horizontalTileMode + " "
                                                    + this.verticalTileMode;
        this.$domElement.style.borderImageWidth = this.border.top + "px "
                                                + this.border.right + "px "
                                                + this.border.bottom + "px "
                                                + this.border.left + "px";
    }

    this.$drawItem = function(c) {
        if (this.horizontalTileMode != this.BorderImage.Stretch || this.verticalTileMode != this.BorderImage.Stretch) {
            console.log("BorderImages support only BorderImage.Stretch tileMode currently with the canvas-backend.");
        }
        if (this.status == this.BorderImage.Ready) {
            c.save();
            c.drawImage(img, 0, 0, this.border.left, this.border.top,
                        this.left, this.top, this.border.left, this.border.top);
            c.drawImage(img, img.naturalWidth - this.border.right, 0,
                        this.border.right, this.border.top,
                        this.left + this.width - this.border.right, this.top,
                        this.border.right, this.border.top);
            c.drawImage(img, 0, img.naturalHeight - this.border.bottom,
                        this.border.left, this.border.bottom,
                        this.left, this.top + this.height - this.border.bottom,
                        this.border.left, this.border.bottom);
            c.drawImage(img, img.naturalWidth - this.border.right, img.naturalHeight - this.border.bottom,
                        this.border.right, this.border.bottom,
                        this.left + this.width - this.border.right,
                        this.top + this.height - this.border.bottom,
                        this.border.right, this.border.bottom);

            c.drawImage(img, 0, this.border.top,
                        this.border.left, img.naturalHeight - this.border.bottom - this.border.top,
                        this.left, this.top + this.border.top,
                        this.border.left, this.height - this.border.bottom - this.border.top);
            c.drawImage(img, this.border.left, 0,
                        img.naturalWidth - this.border.right - this.border.left, this.border.top,
                        this.left + this.border.left, this.top,
                        this.width - this.border.right - this.border.left, this.border.top);
            c.drawImage(img, img.naturalWidth - this.border.right, this.border.top,
                        this.border.right, img.naturalHeight - this.border.bottom - this.border.top,
                        this.right - this.border.right, this.top + this.border.top,
                        this.border.right, this.height - this.border.bottom - this.border.top);
            c.drawImage(img, this.border.left, img.naturalHeight - this.border.bottom,
                        img.naturalWidth - this.border.right - this.border.left, this.border.bottom,
                        this.left + this.border.left, this.bottom - this.border.bottom,
                        this.width - this.border.right - this.border.left, this.border.bottom);
            c.restore();
        } else {
            console.log("Waiting for image to load");
        }
    }
}

function QMLMouseArea(meta, parent, engine) {
    QMLItem.call(this, meta, parent, engine);
    var self = this;

    if (engine.renderMode == QMLRenderMode.DOM) {
        this.$domElement.style.pointerEvents = "all";

        // IE does not handle mouse clicks to transparent divs, so we have
        // to set a background color and make it invisible using opacity
        // as that doesn't affect the mouse handling.
        this.$domElement.style.backgroundColor = "white";
        this.$domElement.style.opacity = 0;
    }

    createSimpleProperty(engine, this, "acceptedButtons");
    createSimpleProperty(engine, this, "enabled");
    createSimpleProperty(engine, this, "hoverEnabled");
    this.clicked = Signal([{type: "variant", name: "mouse"}]);
    this.entered = Signal();
    this.exited = Signal();
    createSimpleProperty(engine, this, "containsMouse");

    this.acceptedButtons = Qt.LeftButton;
    this.enabled = true;
    this.hoverEnabled = false;
    this.containsMouse = false;

    if (engine.renderMode == QMLRenderMode.DOM) {
        function handleClick(e) {
            var mouse = {
                accepted: true,
                button: e.button == 0 ? Qt.LeftButton :
                        e.button == 1 ? Qt.MiddleButton :
                        e.button == 2 ? Qt.RightButton :
                        0,
                modifiers: (e.ctrlKey * Qt.CtrlModifier)
                        | (e.altKey * Qt.AltModifier)
                        | (e.shiftKey * Qt.ShiftModifier)
                        | (e.metaKey * Qt.MetaModifier),
                x: (e.offsetX || e.layerX),
                y: (e.offsetY || e.layerY)
            };

            if (self.enabled && self.acceptedButtons & mouse.button) {
                self.clicked(mouse);
                engine.$requestDraw();
            }
            // This decides whether to show the browser's context menu on right click or not
            return !(self.acceptedButtons & Qt.RightButton);
        }
        this.$domElement.onclick = handleClick;
        this.$domElement.oncontextmenu = handleClick;
        this.$domElement.onmouseover = function(e) {
            if (self.hoverEnabled) {
                self.containsMouse = true;
                self.entered();
            }
        }
        this.$domElement.onmouseout = function(e) {
            if (self.hoverEnabled) {
                self.containsMouse = false;
                self.exited();
            }
        }
    } else {
        engine.mouseAreas.push(this);
    }
}

function QMLComponent(meta, engine) {
    var item;

    if (meta.$children.length !== 1)
        console.error("A QML document must only contain one root element!");

    workingContext.push(false);

    item = construct(meta.$children[0], undefined, engine);

    for (var i = 0; i < item.$init.length; i++)
        item.$init[i].call(item);
    workingContext.pop();

    return item;
}

function QMLDocument(meta, engine) {

    var doc,
        // The only item in this document
        item

    // todo: imports

    if (meta.$children.length !== 1)
        console.error("A QML document must only contain one root element!");

    // Build parent
    doc = new QMLItem(meta, undefined, engine);

    if (engine.renderMode == QMLRenderMode.DOM) {
	doc.$domElement = engine.rootElement || document.body;
        doc.$domElement.innerHTML = "";
    }

    workingContext.push(false);
    engine.operationFlags |= QMLOperationFlag.IgnoreReferenceErrors;

    item = construct(meta.$children[0], doc, engine);

    engine.operationFlags ^= QMLOperationFlag.IgnoreReferenceErrors;
    engine.rootScope = workingContext.pop().get();

    doc.children.push(item);

    if (engine.rootElement == undefined) {
	window.onresize = function() {
	    doc.height = window.innerHeight;
	    doc.width = window.innerWidth;
	}
	window.onresize();
    } else {
	function heightGetter() {
	    return item.height;
	}
	setupGetter(doc, "height", heightGetter);

	function widthGetter() {
	    return item.width;
	}
	setupGetter(doc, "width", widthGetter);
    }


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

    doc.x = 0;
    doc.y = 0;
    for (var i = 0; i < item.$init.length; i++)
        item.$init[i].call(item);

    if (engine.renderMode == QMLRenderMode.DOM) {
        doc.$domElement.style.position = "relative";
        doc.$domElement.style.top = "0";
        doc.$domElement.style.left = "0";
        doc.$domElement.style.overflow = "hidden";
        doc.$domElement.style.width = item.width + "px";
        doc.$domElement.style.height = item.height + "px";
    }

    return doc; // todo: return doc instead of item

}

function QMLState(meta, parent, engine) {
    QMLBaseObject.call(this, meta, parent, engine);

    createSimpleProperty(engine, this, "name");
    createSimpleProperty(engine, this, "changes");
    createSimpleProperty(engine, this, "extend");
    createSimpleProperty(engine, this, "when");
    this.changes = [];
    this.$item = parent;

    this.whenChanged.connect(this, function(newVal) {
        if (newVal)
            this.$item.state = this.name;
        else if (this.$item.state == this.name)
            this.$item.state = "";
    });

    this.$init.push(function() {
        for (var i = 0; i < this.changes.length; i++)
            for (var j = 0; j < this.changes[i].$init.length; j++)
                this.changes[i].$init[j].call(this.changes[i]);
    });

    this.$addChild = function(meta) {
        this.changes.push(construct(meta, this, engine));
    }
    this.$getAllChanges = function() {
        if (this.extend) {
            for (var i = 0; i < this.$item.states.length; i++)
                if (this.$item.states[i].name == this.extend)
                    return this.$item.states[i].$getAllChanges().concat(this.changes);
        } else
            return this.changes;
    }
}

function QMLPropertyChanges(meta, parent, engine) {
    QMLBaseObject.call(this, meta, parent, engine);

    createSimpleProperty(engine, this, "target");
    createSimpleProperty(engine, this, "explicit");
    createSimpleProperty(engine, this, "restoreEntryValues");

    this.explicit = false;
    this.restoreEntryValues = true;
    this.$actions = [];

    this.targetChanged.connect(this, function(newVal) {
        for (var i in this.$actions) {
            var bindSrc = "(function() { return " + this.$actions[i].value.src + "})";
            this.$actions[i].value.binding = evalBinding(null, bindSrc, newVal, workingContext[workingContext.length-1].get(), engine.rootScope);
        }
    });

    this.$setCustomData = function(propName, value) {
        var bindSrc = "(function() { return " + value.src + "})";
        value.binding = evalBinding(null, bindSrc, this.target, workingContext[workingContext.length-1].get(), engine.rootScope);
        this.$actions.push({
            property: propName,
            value: value
        });
    }
}

function QMLTransition(meta, parent, engine) {
    QMLBaseObject.call(this, meta, parent, engine);

    createSimpleProperty(engine, this, "animations");
    createSimpleProperty(engine, this, "from");
    createSimpleProperty(engine, this, "to");
    createSimpleProperty(engine, this, "reversible");
    this.animations = [];
    this.$item = parent;
    this.from = "*";
    this.to = "*";

    this.$init.push(function() {
        for (var i = 0; i < this.animations.length; i++)
            for (var j = 0; j < this.animations[i].$init.length; j++)
                this.animations[i].$init[j].call(this.animations[i]);
    });

    this.$addChild = function(meta) {
        this.animations.push(construct(meta, this, engine));
    }
    this.$start = function(actions) {
        for (var i = 0; i < this.animations.length; i++) {
            var animation = this.animations[i];
            animation.$actions = [];
            for (var j in actions) {
                var action = actions[j];
                if ((animation.$targets.length === 0 || animation.$targets.indexOf(action.target) !== -1)
                    && (animation.$props.length === 0 || animation.$props.indexOf(action.property) !== -1))
                    animation.$actions.push(action);
            }
            animation.start();
        }
    }
    this.$stop = function() {
        for (var i = 0; i < this.animations.length; i++)
            this.animations[i].stop();
    }
}

function QMLTimer(meta, parent, engine) {
    QMLBaseObject.call(this, meta, parent, engine);
    var prevTrigger,
        self = this;

    createSimpleProperty(engine, this, "interval");
    createSimpleProperty(engine, this, "repeat");
    createSimpleProperty(engine, this, "running");
    createSimpleProperty(engine, this, "triggeredOnStart");

    this.interval = 1000;
    this.repeat = false;
    this.running = false;
    this.triggeredOnStart = false;

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
        self.triggered();

        engine.$requestDraw();
    }

    engine.$registerStart(function() {
        if (self.running) {
            self.running = false; // toggled back by self.start();
            self.start();
        }
    });

    engine.$registerStop(function() {
        self.stop();
    });
}

function QMLAnimation(meta, parent, engine) {
    QMLBaseObject.call(this, meta, parent, engine);

    // Exports
    this.Animation = {
        Infinite: -1
    };

    createSimpleProperty(engine, this, "alwaysRunToEnd");
    createSimpleProperty(engine, this, "loops");
    createSimpleProperty(engine, this, "paused");
    createSimpleProperty(engine, this, "running");

    this.alwaysRunToEnd = false;
    this.loops = 1;
    this.paused = false;
    this.running = false;

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
    QMLAnimation.call(this, meta, parent, engine);
    var curIndex,
        passedLoops,
        i,
        self = this;

    createSimpleProperty(engine, this, "animations");
    this.animations = [];

    function nextAnimation(proceed) {
        var anim;
        if (self.running && !proceed) {
            curIndex++;
            if (curIndex < self.animations.length) {
                anim = self.animations[curIndex];
                console.log("nextAnimation", self, curIndex, anim);
                descr("", anim, ["target"]);
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

    this.animationsChanged.connect(this, function() {
        for (i = 0; i < this.animations.length; i++) {
            if (!this.animations[i].runningChanged.isConnected(nextAnimation))
                this.animations[i].runningChanged.connect(nextAnimation);
        }
    });

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
            if (curIndex < this.animations.length) {
                this.animations[curIndex].stop();
            }
        }
    }

    this.complete = function() {
        if (this.running) {
            if (curIndex < this.animations.length) {
                // Stop current animation
                this.animations[curIndex].stop();
            }
            this.running = false;
        }
    }

    this.$addChild = function(childMeta) {
        this.animations.push(construct(childMeta, this, engine));
    }
    this.$init.push(function() {
        for (var i = 0; i < this.animations.length; i++)
            for (var j = 0; j < this.animations[i].$init.length; j++)
                this.animations[i].$init[j].call(this.animations[i]);
    });

    engine.$registerStart(function() {
        if (self.running) {
            self.running = false; // toggled back by start();
            self.start();
        }
    });
    engine.$registerStop(function() {
        self.stop();
    });
};

function QMLParallelAnimation(meta, parent, engine) {
    QMLAnimation.call(this, meta, parent, engine);
    var curIndex,
        passedLoops,
        i;

    createSimpleProperty(engine, this, "animations");
    this.animations = [];
    this.$runningAnimations = 0;

    this.animationsChanged.connect(this, function() {
        for (i = 0; i < this.animations.length; i++) {
            if (!this.animations[i].runningChanged.isConnected(this, animationFinished))
                this.animations[i].runningChanged.connect(this, animationFinished);
        }
    });

    function animationFinished(newVal) {
        this.$runningAnimations += newVal ? 1 : -1;
        if (this.$runningAnimations === 0)
            this.running = false;
    }

    this.start = function() {
        if (!this.running) {
            this.running = true;
            for (i = 0; i < this.animations.length; i++)
                this.animations[i].start();
        }
    }
    this.stop = function() {
        if (this.running) {
            for (i = 0; i < this.animations.length; i++)
                this.animations[i].stop();
            this.running = false;
        }
    }
    this.complete = this.stop;

    this.$addChild = function(childMeta) {
        this.animations.push(construct(childMeta, this, engine));
    }
    this.$init.push(function() {
        for (var i = 0; i < this.animations.length; i++)
            for (var j = 0; j < this.animations[i].$init.length; j++)
                this.animations[i].$init[j].call(this.animations[i]);
    });

    engine.$registerStart(function() {
        if (self.running) {
            self.running = false; // toggled back by start();
            self.start();
        }
    });
    engine.$registerStop(function() {
        self.stop();
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

    createSimpleProperty(engine, this, "duration");
    createSimpleProperty(engine, this, "from");
    createSimpleProperty(engine, this, "properties");
    createSimpleProperty(engine, this, "property");
    createSimpleProperty(engine, this, "target");
    createSimpleProperty(engine, this, "targets");
    createSimpleProperty(engine, this, "to");

    this.easing = new QObject(this);
    createSimpleProperty(engine, this.easing, "type", { altParent: this });
    createSimpleProperty(engine, this.easing, "amplitude", { altParent: this });
    createSimpleProperty(engine, this.easing, "overshoot", { altParent: this });
    createSimpleProperty(engine, this.easing, "period", { altParent: this });

    function redoActions() {
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
    }
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
        if (this.property && this.$props.indexOf(this.property) === -1)
            this.$props.push(this.property);
    }
    function redoTargets() {
        this.$targets = this.targets.slice();

        if (this.target && this.$targets.indexOf(this.target) === -1)
            this.$targets.push(this.target);
    }

    this.duration = 250;
    this.easing.type = this.Easing.Linear;
    this.$props = [];
    this.$targets = [];
    this.properties = "";
    this.targets = [];

    this.targetChanged.connect(this, redoTargets);
    this.targetsChanged.connect(this, redoTargets);
    this.propertyChanged.connect(this, redoProperties);
    this.propertiesChanged.connect(this, redoProperties);
    this.toChanged.connect(this, redoActions);
    this.fromChanged.connect(this, redoActions);
    this.targetChanged.connect(this, redoActions);
    this.targetsChanged.connect(this, redoActions);
    this.propertyChanged.connect(this, redoActions);
    this.propertiesChanged.connect(this, redoActions);
}

function QMLNumberAnimation(meta, parent, engine) {
    QMLPropertyAnimation.call(this, meta, parent, engine);
    var tickStart,
        self = this;

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
                for (var i in self.$actions) {
                    var action = self.$actions[i],
                        at = (now - tickStart) / self.duration,
                        value = curve(at) * (action.to - action.from) + action.from;
                    action.target.$properties[action.property].set(value, true);
                }
            }

        }
    }

    // Methods
    this.start = function() {
        if (!this.running) {
            for (var i in self.$actions) {
                var action = self.$actions[i];
                action.from = action.from !== Undefined ? action.from : action.target[action.property];
            }
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
            workingContext.push(this.$scope);
            for (var i in this.$actions) {
                var action = this.$actions[i];
                action.target.$properties[action.property].set(action.to, true);
            }
            workingContext.pop();
            this.stop();
            engine.$requestDraw();
        }
    }
}

function QMLBehavior(meta, parent, engine) {
    QMLBaseObject.call(this, meta, parent, engine);

    createSimpleProperty(engine, this, "animation");
    createSimpleProperty(engine, this, "enabled");

    this.animationChanged.connect(this, function(newVal) {
        newVal.target = parent;
        newVal.property = meta.$on;
        parent.$properties[meta.$on].animation = newVal;
    });
    this.enabledChanged.connect(this, function(newVal) {
        parent.$properties[meta.$on].animation = newVal ? this.animation : null;
    })

    this.$addChild = function(childMeta) {
        this.animation = construct(childMeta, this, engine);
    }
    this.$init.push(function() {
        for (var i = 0; i < this.animation.$init.length; i++)
            this.animation.$init[i].call(this.animation);
    });
}


//------------DOM-only-Elements------------

function QMLTextInput(meta, parent, engine) {
    QMLItem.call(this, meta, parent, engine);

    if (engine.renderMode == QMLRenderMode.Canvas) {
        console.log("TextInput-type is only supported within the DOM-backend.");
        return;
    }

    var self = this;

    this.font = new QMLFont(this, engine);

    this.$domElement.innerHTML = "<input type=\"text\"/>"
    this.$domElement.firstChild.style.pointerEvents = "auto";
    // In some browsers text-inputs have a margin by default, which distorts
    // the positioning, so we need to manually set it to 0.
    this.$domElement.firstChild.style.margin = "0";
    this.$domElement.firstChild.style.width = "100%";

    createSimpleProperty(engine, this, "text", "");
    this.accepted = Signal();

    this.$init.push(function() {
        this.implicitWidth = this.$domElement.firstChild.offsetWidth;
        this.implicitHeight = this.$domElement.firstChild.offsetHeight;
    });

    this.textChanged.connect(this, function(newVal) {
        this.$domElement.firstChild.value = newVal;
    });

    this.$domElement.firstChild.onkeydown = function(e) {
        if (e.keyCode == 13) //Enter pressed
            self.accepted();
    }

    function updateValue(e) {
        if (self.text != self.$domElement.firstChild.value) {
            self.text = self.$domElement.firstChild.value;
        }
    }

    this.$domElement.firstChild.oninput = updateValue;
    this.$domElement.firstChild.onpropertychanged = updateValue;
}

function QMLButton(meta, parent, engine) {
    if (engine.renderMode == QMLRenderMode.Canvas) {
        console.log("Button-type is only supported within the DOM-backend. Use Rectangle + MouseArea instead.");
        QMLItem.call(this, meta, parent, engine);
        return;
    }

    this.$domElement = document.createElement("button");
    QMLItem.call(this, meta, parent, engine);
    var self = this;

    this.$domElement.style.pointerEvents = "auto";
    this.$domElement.innerHTML = "<span></span>";

    createSimpleProperty(engine, this, "text");
    this.clicked = Signal();

    this.textChanged.connect(this, function(newVal) {
        this.$domElement.firstChild.innerHTML = newVal;
        //TODO: Replace those statically sized borders
        this.implicitWidth = this.$domElement.firstChild.offsetWidth + 20;
        this.implicitHeight = this.$domElement.firstChild.offsetHeight + 5;
    });

    this.$domElement.onclick = function(e) {
        self.clicked();
    }
}

function QMLTextArea(meta, parent, engine) {
    QMLItem.call(this, meta, parent, engine);

    if (engine.renderMode == QMLRenderMode.Canvas) {
        console.log("TextArea-type is only supported within the DOM-backend.");
        return;
    }

    var self = this;

    this.font = new QMLFont(this, engine);

    this.$domElement.innerHTML = "<textarea></textarea>"
    this.$domElement.firstChild.style.pointerEvents = "auto";
    this.$domElement.firstChild.style.width = "100%";
    this.$domElement.firstChild.style.height = "100%";
    // In some browsers text-areas have a margin by default, which distorts
    // the positioning, so we need to manually set it to 0.
    this.$domElement.firstChild.style.margin = "0";

    createSimpleProperty(engine, this, "text", "");

    this.implicitWidth = this.$domElement.firstChild.offsetWidth;
    this.implicitHeight = this.$domElement.firstChild.offsetHeight;

    this.textChanged.connect(this, function(newVal) {
        this.$domElement.firstChild.value = newVal;
    });

    function updateValue(e) {
        if (self.text != self.$domElement.firstChild.value) {
            self.text = self.$domElement.firstChild.value;
        }
    }

    this.$domElement.firstChild.oninput = updateValue;
    this.$domElement.firstChild.onpropertychanged = updateValue;
}

})();
