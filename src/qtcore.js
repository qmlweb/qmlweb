/** @license

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
    },
    Font = {
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
    },
    Easing = {
        Linear: 1,
        InQuad: 2,          OutQuad: 3,     InOutQuad: 4,           OutInQuad: 5,
        InCubic: 6,         OutCubic: 7,    InOutCubic: 8,          OutInCubic: 9,
        InQuart: 10,        OutQuart: 11,   InOutQuart: 12,         OutInQuart: 13,
        InQuint: 14,        OutQuint: 15,   InOutQuint: 16,         OutInQuint: 17,
        InSine: 18,         OutSine: 19,    InOutSine: 20,          OutInSine: 21,
        InExpo: 22,         OutExpo: 23,    InOutExpo: 24,          OutInExpo: 25,
        InCirc: 26,         OutCirc: 27,    InOutCirc: 28,          OutInCirc: 29,
        InElastic: 30,      OutElastic: 31, InOutElastic: 32,       OutInElastic: 33,
        InBack: 34,         OutBack: 35,    InOutBack: 36,          OutInBack: 37,
        InBounce: 38,       OutBounce: 39,  InOutBounce: 40,        OutInBounce: 41
    },
    // Simple shortcuts to getter & setter functions, coolness with minifier
    GETTER = "__defineGetter__",
    SETTER = "__defineSetter__",
    Undefined = undefined,
    // Property that is currently beeing evaluated. Used to get the information
    // which property called the getter of a certain other property for
    // evaluation and is thus dependant on it.
    evaluatingBinding = undefined,
    // context in which a QML slot/function is executed or a binding is evaluated.
    _executionContext = null,
    // All object constructors
    constructors = {
            'int': QMLInteger,
            real: Number,
            'double': Number,
            string: String,
            'bool': Boolean,
            list: QMLList,
            color: QMLColor,
            'enum': QMLVariant,
            url: String,
            variant: QMLVariant,
            'var': QMLVariant,
            anchors: QMLAnchors,
            font: QMLFont,
            Component: QMLComponent,
            QMLDocument: QMLComponent,
            MouseArea: QMLMouseArea,
            Image: QMLImage,
            AnimatedImage: QMLAnimatedImage,
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
            TextArea: QMLTextArea,
            CheckBox: QMLCheckbox
        }

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
 * Compile binding. Afterwards you may call binding.eval to evaluate.
 */
QMLBinding.prototype.compile = function() {
    var bindSrc = this.isFunction
                    ? "(function(o, c) { _executionContext = c;\nwith(c)\nwith(o)\n" + this.src + "\n})"
                    : "(function(o, c) { _executionContext = c;\nwith(c)\nwith(o)\nreturn " + this.src + "\n})";
    this.eval = eval(bindSrc);
}
QMLBinding.prototype.bind = function(object, propName, objectScope, componentScope) {
    if (!objectScope || !componentScope)
        throw "Internal error: trying to evaluate binding without scope";
    var binding = Object.create(this);
    binding.obj = object;
    binding.propName = propName;
    binding.objectScope = objectScope;
    binding.componentScope = componentScope;

    if (engine.operationState !== QMLOperationState.Init) {
        binding.compile();

        evaluatingBinding = binding;
        var newVal = binding.eval(objectScope, componentScope);
        evaluatingBinding = null;
        return newVal;
    } else {
        engine.bindings.push(binding);
        return;
    }
}
// Update recalculates the value of a binding and resets the propertyit's assigned to.
// Called when one of the dependencies changes.
QMLBinding.prototype.update = function() {
    evaluatingBinding = this;
    var val = this.eval(this.objectScope, this.componentScope);
    evaluatingBinding = undefined;

    this.obj[this.propName] = val;
}

/**
 * QML Object constructor.
 * @param {Object} meta Meta information about the object and the creation context
 * @return {Object} New qml object
 */
function construct(meta) {
    var item,
        component;

    if (meta.object.$class in constructors) {
        item = new constructors[meta.object.$class](meta.parent);
    } else if (component = engine.loadComponent(meta.object.$class)) {
        item = component.createObject(meta.parent);
        item.$innerContext = item.$context;

        if (engine.renderMode == QMLRenderMode.DOM)
            item.dom.className += " " + meta.object.$class + (meta.object.id ? " " + meta.object.id : "");
    } else {
        console.log("No constructor found for " + meta.object.$class);
        return;
    }

    // scope
    item.$context = meta.context;

    // id
    if (meta.object.id) {
        meta.context[meta.object.id] = item;
        if (item.dom)
            item.dom.className += " " + meta.object.id;
    }

    // Apply properties (Bindings won't get evaluated, yet)
    applyProperties(meta.object, item, item, meta.context);

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
function createProperty(data) {
    function getAlias() {
        var obj = data.targetObj || data.context[data.targetObjName];
        return data.targetPropName ? obj[data.targetPropName] : obj;
    }
    function setAlias(newVal) {
        if (!data.targetPropName)
            throw "Cannot set alias property pointing to an QML object.";
        var obj = data.targetObj || data.context[data.targetObjName];
        obj[data.targetPropName] = newVal;
    }
    function getProperty() {
        // If this call to the getter is due to a property that is dependant on this
        // one, we need it to take track of changes
        if (evaluatingBinding && !this[data.name + "Changed"].isConnected(evaluatingBinding, QMLBinding.prototype.update))
            this[data.name + "Changed"].connect(evaluatingBinding, QMLBinding.prototype.update);

        return data.get ? data.get.call(this, name) : this.$properties[data.name];
    }
    function setProperty(newVal) {
        var i,
            oldVal = this.$properties[data.name];

        if (constructors[data.type] == QMLList) {
            newVal = QMLList(newVal, this, data.name);
        } else if (newVal instanceof QMLMetaElement) {
            if (constructors[newVal.$class] == QMLComponent || constructors[data.type] == QMLComponent)
                newVal = new QMLComponent(newVal);
            else
                newVal = construct({ object: newVal, parent: this, context: _executionContext });
        } else if (newVal instanceof Object || newVal === undefined) {
            newVal = newVal;
        } else {
            newVal = constructors[data.type](newVal, this, data.name);
        }
        data.set ? data.set.call(this, newVal, data.name) : (this.$properties[data.name] = newVal);

        if (newVal !== oldVal) {
            if (data.animation && !fromAnimation) {
                data.animation.running = false;
                data.animation.$actions = [{
                    target: data.animation.target || this,
                    property: data.animation.property || this.name,
                    from: data.animation.from || oldVal,
                    to: data.animation.to || newVal
                }];
                data.animation.running = true;
            }
            if (this.$updateDirtyProperty)
                this.$updateDirtyProperty(data.name, newVal);
            if (this.$changeSignals[data.name])
                this.$changeSignals[data.name](newVal, oldVal, newVal);
        }
    }

    if (data.object.$innerContext) {
        createProperty({ type: "alias", object: data.object.$innerContext, name: data.name,
                         targetObj: data.object, targetPropName: data.name });
    }

    if (data.type == "alias") {
        setupGetterSetter(data.object, data.name, getAlias, setAlias);
    } else {
        setupGetterSetter(data.object, data.name, getProperty, setProperty);
        data.object.$properties[data.name] = data.initialValue;
    }

    setupGetter(data.object, data.name + "Changed",
        function() {
            if (!(data.name in this.$changeSignals)) {
                console.warn(data.name + "Changed signal did not exist while asking for it. Creating it.");
                this.$changeSignals[data.name] = Signal();
            }
            return this.$changeSignals[data.name];
        }
    );
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
    for (i in metaObject) {
        var value = metaObject[i];
        // skip global id's and internal values
        if (i == "id" || i[0] == "$") {
            continue;
        }
        // slots
        if (i.indexOf("on") == 0 && i[2].toUpperCase() == i[2]) {
            var signalName =  i[2].toLowerCase() + i.slice(3);
            if (!item[signalName]) {
                console.warn("No signal called " + signalName + " found!");
                continue;
            }
            if (!value.eval) {
                var params = "";
                for (var j in item[signalName].parameters) {
                    params += j==0 ? "" : ", ";
                    params += item[signalName].parameters[j].name;
                }
                value.src = "(function(" + params + ") { _executionContext = c;\n" + value.src + "\n})";
                value.isFunction = false;
                value.compile();
            }
            item[signalName].connect(item, value.eval(objectScope, componentScope));
            continue;
        }

        if (value instanceof Object) {
            if (value instanceof QMLSignalDefinition) {
                item[i] = Signal(value.parameters);
                if (item.$innerContext)
                    componentScope[i] = item[i];
                continue;
            } else if (value instanceof QMLMethod) {
                value.compile();
                item[i] = value.eval(objectScope, componentScope);
                if (item.$innerContext)
                    componentScope[i] = item[i];
                continue;
            } else if (value instanceof QMLAliasDefinition) {
                createProperty({ type: "alias", object: item, name: i, targetObjName: value.objectName,
                                 targetPropName: value.propertyName, context: _executionContext });
                continue;
            } else if (value instanceof QMLPropertyDefinition) {
                createProperty({ type: value.type, object: item, name: i });
                item[i] = value.value;
                continue;
            } else if (i in item && value instanceof QMLMetaPropertyGroup) {
                // Apply properties one by one, otherwise apply at once
                applyProperties(value, item[i], objectScope, componentScope);
                continue;
            } else if (value instanceof QMLBinding) {
                value = value.bind(item, i, objectScope, componentScope)
            }
        }
//         if (item.$properties && i in item.$properties)
//             item.$properties[i].set(value, true, objectScope, componentScope);
        /*else*/ if (i in item)
            item[i] = value;
        else if (item.$setCustomData)
            item.$setCustomData(i, value);
        else
            console.warn("Cannot assign to non-existent property \"" + i + "\". Ignoring assignment.");
    }
    if (metaObject.$children && metaObject.$children.length !== 0) {
        if (item.$defaultProperty)
            item[item.$defaultProperty] = metaObject.$children;
        else
            throw "Cannot assign to unexistant default property";
    }
    // We purposefully set the default property AFTER using it, in order to only have it applied for
    // instanciations of this component, but not for its internal children
    if (metaObject.$defaultProperty)
        item.$defaultProperty = metaObject.$defaultProperty;
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
QMLOperationState = {
    Idle: 1,
    Init: 2,
    Running: 3
}

// There can only be one running QMLEngine. This variable points to the currently running engine.
var engine = new (function () {
//----------Public Members----------
    this.fps = 60;
    this.$interval = Math.floor(1000 / this.fps); // Math.floor, causes bugs to timing?
    this.running = false;

    // Mouse Handling
    this.mouseAreas = [];
    this.oldMousePos = {x:0, y:0};

    // List of available Components
    this.components = {};

    // List of Component.completed signals
    this.completedSignals = [];

    // Current operation state of the engine (Idle, init, etc.)
    this.operationState = 1;

    // List of properties whose values are bindings. For internal use only.
    this.bindings = [];


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
//         if (options.debugSrc) {
//             options.debugSrc(src);
//         }
        this.loadQML(src);
    }
    // parse and construct qml
    this.loadQML = function(src) {
        this.operationState = QMLOperationState.Init;
        engine = this;
        var tree = parseQML(src);
//         if (options.debugTree) {
//             options.debugTree(tree);
//         }

        // Create and initialize objects
        var component = new QMLComponent(tree);
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
            if (evaluatingBinding && dependantProperties.indexOf(evaluatingBinding) == -1)
                dependantProperties.push(evaluatingBinding);

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
    // Stylesheet used for default style of elements.
    this.globalStylesheet = document.createElement("style");
    this.globalStylesheet.type = "text/css";
    document.head.appendChild(this.globalStylesheet);

    // Load file, parse and construct as Component (.qml)
    this.loadComponent = function(name)
    {
        if (name in this.components)
            return this.components[name];

        var file = basePath + name + ".qml";

        var src = getUrlContents(file);
        if (src=="")
            return undefined;
        var tree = new QMLComponent(parseQML(src));
        this.components[name] = tree;
        return tree;
    }

    this.$initializePropertyBindings = function() {
        // Initialize property bindings
        while (this.bindings.length) {
            var binding = this.bindings.pop();
            binding.compile();
            binding.update();
        }
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

//         if (options.drawStat) {
//             options.drawStat((new Date()).getTime() - time.getTime());
//         }
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

//     options = options || {};
//
//     if (options.debugConsole) {
//         // Replace QML-side console.log
//         console = {};
//         console.log = function() {
//             var args = Array.prototype.slice.call(arguments);
//             options.debugConsole.apply(Undefined, args);
//         };
//     }

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
})();
QMLEngine = function(element, options) {
    engine.rootElement = element;
    engine.renderMode = (element && element.nodeName == "CANVAS") ? QMLRenderMode.Canvas : QMLRenderMode.DOM;
    return engine
}

function QMLInteger(val) {
    return (val|0);
}

function QMLVariant(val) {
    return val;
}

// TODO
function QMLColor(val) {
    return val;
}

function QMLList(val, obj, name) {
    var list = [];
    if (val instanceof Array)
        for (var i in val)
            list.push(construct({object: val[i], parent: obj, context: _executionContext }));
    else if (val instanceof QMLMetaElement)
        list.push(construct({object: val, parent: obj, context: _executionContext }));

    return list;
}

var p = QMLAnchors.prototype = new QObject();
p.$setHorizontalAnchorsProperty = function(newVal, name) {
    this.$properties[name] = newVal;
    this.$parent.$updateHGeometry();
}
p.$setVerticalAnchorsProperty = function(newVal, name) {
    this.$properties[name] = newVal;
    this.$parent.$updateVGeometry();
}
p.$setConvenienceAnchorsProperty = function(newVal, name) {
    this.$properties[name] = newVal;
    this.$parent.$updateHGeometry();
    this.$parent.$updateVGeometry();
}
createProperty({ type: "real", object: p, name: "left", set: p.$setHorizontalAnchorsProperty });
createProperty({ type: "real", object: p, name: "horizontalCenter", set: p.$setHorizontalAnchorsProperty });
createProperty({ type: "real", object: p, name: "right", set: p.$setHorizontalAnchorsProperty });
createProperty({ type: "real", object: p, name: "top", set: p.$setVerticalAnchorsProperty });
createProperty({ type: "real", object: p, name: "verticalCenter", set: p.$setVerticalAnchorsProperty });
createProperty({ type: "real", object: p, name: "bottom", set: p.$setVerticalAnchorsProperty });
createProperty({ type: "real", object: p, name: "fill", set: p.$setConvenienceAnchorsProperty });
createProperty({ type: "real", object: p, name: "centerIn", set: p.$setConvenienceAnchorsProperty });
createProperty({ type: "real", object: p, name: "margins", initialValue: 0, set: p.$setConvenienceAnchorsProperty });
createProperty({ type: "real", object: p, name: "leftMargin", set: p.$setHorizontalAnchorsProperty });
createProperty({ type: "real", object: p, name: "horizontalCenterOffset", set: p.$setHorizontalAnchorsProperty });
createProperty({ type: "real", object: p, name: "rightMargin", set: p.$setHorizontalAnchorsProperty });
createProperty({ type: "real", object: p, name: "topMargin", set: p.$setVerticalAnchorsProperty });
createProperty({ type: "real", object: p, name: "verticalCenterOffset", set: p.$setVerticalAnchorsProperty });
createProperty({ type: "real", object: p, name: "bottomMargin", set: p.$setVerticalAnchorsProperty });
p.$updateDirtyProperty = function(n, newVal) {
    this.$parent.$updateDirtyProperty(this.$name, this);
}
function QMLAnchors(val, obj, name) {
    QObject.call(this, obj);
    this.$name = name;
}

p = QMLFont.prototype = new QObject();
createProperty({ type: "bool", object: p, name: "bold", initialValue: false });
createProperty({ type: "enum", object: p, name: "capitalization", initialValue: 0 });
createProperty({ type: "string", object: p, name: "family", initialValue: "sans-serif" });
createProperty({ type: "bool", object: p, name: "italic", initialValue: false });
createProperty({ type: "real", object: p, name: "letterSpacing", initialValue: 0 });
createProperty({ type: "int", object: p, name: "pixelSize" });
createProperty({ type: "real", object: p, name: "pointSize", initialValue: 10 });
createProperty({ type: "bool", object: p, name: "strikeout", initialValue: false });
createProperty({ type: "bool", object: p, name: "underline", initialValue: false });
createProperty({ type: "enum", object: p, name: "weight" });
createProperty({ type: "real", object: p, name: "wordSpacing", initialValue: 0 });
p.$updateDirtyProperty = function(name, newVal) {
    this.$parent.$updateDirtyProperty(this.$name + "." + name, newVal);
}
function QMLFont(val, obj, name) {
    QObject.call(this, obj);
    this.$name = name;
}

p = QMLPen.prototype = new QObject();
createProperty({ type: "color", object: p, name: "color", initialValue: "transparent" });
createProperty({ type: "int", object: p, name: "width", initialValue: 1 });
p.$updateDirtyProperty = function(name, newVal) {
    this.$parent.$updateDirtyProperty(this.$name + "." + name, newVal);
}
function QMLPen(val, obj, name) {
    QObject.call(this, obj);
    this.$name = name
}

QMLComponent.prototype.createObject = function(parent, properties) {
    var oldState = engine.operationState,
        context = this.$context ? Object.create(this.$context) : {};
    context.$properties = context.$properties ? Object.create(context.$properties) : {};
    engine.operationState = QMLOperationState.Init;

    var item = construct({
        object: this.$metaObject,
        parent: parent,
        context: context,
        isComponentRoot: true
    });

    for (var i in item)
        if (i[0] !== '$')
            createProperty({ type: "alias", object: context, name: i, targetObj: item, targetPropName: i });

    engine.operationState = oldState;

    return item;
}
function QMLComponent(meta) {
    if (constructors[meta.$class] == QMLComponent) {
        if (meta.$children.length > 1)
            console.error("A QML component must only contain one root element!");

        this.$metaObject = meta.$children[0];
    } else {
        this.$metaObject = meta;
    }

    this.$context = _executionContext;
}

// Base object for all qml thingies
QObject.prototype.$delete = function() {
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
function QObject(parent) {
    this.$parent = parent;
    if (parent && parent.$tidyupList)
        parent.$tidyupList.push(this);
    this.$properties = this.$properties ? Object.create(this.$properties) : {};
    this.$changeSignals = {};
    // List of things to tidy up when deleting this object.
    this.$tidyupList = [];
}

// Base object for all qml elements
function QMLBaseObject(parent) {
    QObject.call(this, parent);
    var i,
        prop;

    if (!this.$draw)
        this.$draw = noop;

    // Component.onCompleted
    this.Component = new QObject(this);
    this.Component.completed = Signal([]);
    engine.completedSignals.push(this.Component.completed);
}

p = QMLItem.prototype = new QMLBaseObject();
p.$defaultProperty = "data";

p.$setData = function(newVal) {
    for (var i in newVal) {
        var child = newVal[i];
        if (child instanceof QMLItem)
            child.$setParentInternal(this); // This will also add it to children.
        else
            this.resources.push(child);
    }
    this.resourcesChanged();
    this.childrenChanged();
}
p.$setX = function(newVal) {
    this.$properties.x = newVal;
    this.$updateHGeometry();
}
p.$setY = function(newVal) {
    this.$properties.y = newVal;
    this.$updateVGeometry();
}
p.$getWidth = function() {
    return this.$properties.width || this.$properties.implicitWidth;
}
p.$setWidth = function(newVal) {
    this.$properties.width = newVal;
    this.$updateHGeometry();
}
p.$getHeight = function() {
    return this.$properties.height || this.$properties.implicitHeight;
}
p.$setHeight = function(newVal) {
    this.$properties.height = newVal;
    this.$updateVGeometry();
}
p.$setImplicitWidth = function(newVal) {
    this.$properties.implicitWidth = newVal;
    if (!this.$properties.width) {
        if (this.$changeSignals.width)
            this.widthChanged();
        this.$updateHGeometry();
    }
}
p.$setImplicitHeight = function(newVal) {
    this.$properties.implicitHeight = newVal;
    if (!this.$properties.height) {
        if (this.$changeSignals.height)
            this.heightChanged();
        this.$updateVGeometry();
    }
}
p.$setParent = function(newVal) {
    var oldParent = this.$properties.parent;
    this.$setParentInternal(newVal);
    if (oldParent)
        oldParent.childrenChanged();
    this.$properties.parent.childrenChanged();
}
p.$setParentInternal = function(newVal) {
    if (this.$properties.parent) {
        oldParent.children.splice(oldParent.children.indexOf(this), 1);
        if (engine.renderMode == QMLRenderMode.DOM)
            oldParent.dom.removeChild(this.dom);
    }
    this.$properties.parent = newVal;
    if (newVal && newVal.children.indexOf(this) == -1) {
        newVal.children.push(this);
    }
    if (newVal && engine.renderMode == QMLRenderMode.DOM)
        newVal.dom.appendChild(this.dom);
    this.$updateHGeometry();
    this.$updateVGeometry();
}
p.$updateHGeometry = function() {
    var anchors = this.anchors || this;
    if (this.$updatingGeometry)
        return;
    this.$updatingGeometry = true;

    var t, w, width, x, left, hC, right,
        lM = anchors.leftMargin || anchors.margins,
        rM = anchors.rightMargin || anchors.margins;

    if ((t = anchors.fill) !== undefined) {
        if (!t.leftChanged.isConnected(this, this.$updateHGeometry))
            t.leftChanged.connect(this, this.$updateHGeometry);
        if (!t.widthChanged.isConnected(this, this.$updateHGeometry))
            t.widthChanged.connect(this, this.$updateHGeometry);

        this.$isUsingImplicitWidth = false;
        width = t.width - lM - rM;
        x = t.left - (this.parent ? this.parent.left : 0) + lM;
        left = t.left + lM;
        right = t.right - rM;
        hC = (left + right) / 2;
    } else if ((t = anchors.centerIn) !== undefined) {
        if (!t.horizontalCenterChanged.isConnected(this, this.$updateHGeometry))
            t.horizontalCenterChanged.connect(this, this.$updateHGeometry);

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
        if (this.parent && !this.parent.leftChanged.isConnected(this, this.$updateHGeometry))
            this.parent.leftChanged.connect(this, this.$updateHGeometry);

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
p.$updateVGeometry = function() {
    var anchors = this.anchors || this;
    if (this.$updatingGeometry)
        return;
    this.$updatingGeometry = true;

    var t, w, height, y, top, vC, bottom,
        tM = anchors.topMargin || anchors.margins,
        bM = anchors.bottomMargin || anchors.margins;

    if ((t = anchors.fill) !== undefined) {
        if (!t.topChanged.isConnected(this, this.$updateVGeometry))
            t.topChanged.connect(this, this.$updateVGeometry);
        if (!t.heightChanged.isConnected(this, this.$updateVGeometry))
            t.heightChanged.connect(this, this.$updateVGeometry);

        this.$isUsingImplicitHeight = false;
        height = t.height - tM - bM;
        y = t.top - (this.parent ? this.parent.top : 0) + tM;
        top = t.top + tM;
        bottom = t.bottom - bM;
        vC = (top + bottom) / 2;
    } else if ((t = anchors.centerIn) !== undefined) {
        if (!t.verticalCenterChanged.isConnected(this, this.$updateVGeometry))
            t.verticalCenterChanged.connect(this, this.$updateVGeometry);

        w = height || this.height;
        vC = t.verticalCenter;
        y = vC - w / 2 - (this.parent ? this.parent.top : 0);
        top = vC - w / 2;
        bottom = vC + w / 2;
    } else if ((t = anchors.top) !== undefined) {
        top = t + tM
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
        if (this.parent && !this.parent.topChanged.isConnected(this, this.$updateVGeometry))
            this.parent.topChanged.connect(this, this.$updateVGeometry);

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
p.$updateTransform = function() {
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
    this.css.transform = transform;
    this.css.MozTransform = transform;    // Firefox
    this.css.webkitTransform = transform; // Chrome, Safari and Opera
    this.css.OTransform = transform;      // Opera
    this.css.msTransform = transform;     // IE
}
p.$setState = function(newVal) {
    var oldState, newState, i, j, k,
        oldVal = this.$properties.state;
    this.$properties.state = newVal;
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
                                || change.target.$properties[item.property],
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
                                    || change.target.$properties[item.property],
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
        _executionContext = newState ? newState.$context: action.target.$context;
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
}
p.$updateDirtyProperty = function(name, newVal) {
    if (engine.renderMode == QMLRenderMode.Canvas) {
        engine.$requestDraw();
        return;
    }

    switch (name) {
        case "clip":
            this.css.overflow = newVal ? "hidden" : "visible";
            break;
        case "height":
            this.css.height = newVal ? newVal + "px" : "auto";
            break;
        case "opacity":
            this.css.opacity = newVal;
            break;
        case "rotation":
        case "scale":
        case "transform":
            this.$updateTransform();
            break;
        case "visible":
            this.css.visibility = newVal ? "inherit" : "hidden";
            break;
        case "width":
            this.css.width = newVal ? newVal + "px" : "auto";
            break;
        case "x":
            this.css.left = newVal + "px";
            break;
        case "y":
            this.css.top = newVal + "px";
            break;
        case "z":
            this.css.zIndex = newVal;
            break;
    }
}

createProperty({ type: "anchors", object: p, name: "anchors", initialValue: [] });
createProperty({ type: "list", object: p, name: "data", initialValue: [], set: p.$setData });
createProperty({ type: "list", object: p, name: "children", initialValue: [] });
createProperty({ type: "list", object: p, name: "resources", initialValue: [] });
createProperty({ type: "Item", object: p, name: "parent", initialValue: null, set: p.$setParent });
createProperty({ type: "real", object: p, name: "implicitWidth", initialValue: 0, set: p.$setImplicitWidth });
createProperty({ type: "real", object: p, name: "implicitHeight", initialValue: 0, set: p.$setImplicitHeight });
createProperty({ type: "real", object: p, name: "left" });
createProperty({ type: "real", object: p, name: "right" });
createProperty({ type: "real", object: p, name: "top" });
createProperty({ type: "real", object: p, name: "bottom" });
createProperty({ type: "real", object: p, name: "horizontalCenter" });
createProperty({ type: "real", object: p, name: "verticalCenter" });
createProperty({ type: "real", object: p, name: "rotation", initialValue: 0 });
createProperty({ type: "real", object: p, name: "scale", initialValue: 1 });
createProperty({ type: "real", object: p, name: "z", initialValue: 0 });
createProperty({ type: "list", object: p, name: "transform", initialValue: [] });
createProperty({ type: "bool", object: p, name: "visible", initialValue: true });
createProperty({ type: "real", object: p, name: "opacity", initialValue: 1 });
createProperty({ type: "bool", object: p, name: "clip", initialValue: false });
createProperty({ type: "list", object: p, name: "states", initialValue: [] });
createProperty({ type: "list", object: p, name: "transitions", initialValue: [] });
createProperty({ type: "string", object: p, name: "state", initialValue: "", set: p.$setState });
createProperty({ type: "real", object: p, name: "x", initialValue: 0, set: p.$setX });
createProperty({ type: "real", object: p, name: "y", initialValue: 0, set: p.$setY });
createProperty({ type: "real", object: p, name: "width", get: p.$getWidth, set: p.$setWidth });
createProperty({ type: "real", object: p, name: "height", get: p.$getHeight, set: p.$setHeight });
engine.globalStylesheet.appendChild(document.createTextNode(".Item { position: absolute; pointerEvents: none }"));
// Item qml object
function QMLItem(parent) {
    QMLBaseObject.call(this, parent);
    var child,
        o, i;

    this.data = [];
    this.children = [];
    this.resources = [];
    this.$revertActions = [];
    this.anchors = new QMLAnchors(null, this, "anchors");

    if (engine.renderMode == QMLRenderMode.DOM) {
        if (this.$parent === null) { // This is the root element. Initialize it.
            this.dom = engine.rootElement || document.body;
            this.dom.innerHTML = "";
            var self = this;
            if (engine.rootElement == undefined) {
                window.onresize = function() {
                    self.implicitHeight = window.innerHeight;
                    self.implicitWidth = window.innerWidth;
                }
            } else {
                this.implicitHeight = this.dom.offsetHeight;
                this.implicitWidth = this.dom.offsetWidth;
            }
            this.dom.style.position = "relative"; // Needed to make absolute positioning work
            this.dom.style.top = "0";
            this.dom.style.left = "0";
            this.dom.style.overflow = "hidden"; // No QML stuff should stand out the root element
        } else if (!this.dom) { // Create a dom element for this item.
            this.dom = document.createElement("div");
        }
        this.dom.className = "Item";
        this.css = this.dom.style;
    }

    // Init size of root element
    if (engine.renderMode == QMLRenderMode.DOM
        && this.$parent === null && engine.rootElement == undefined) {
        window.onresize();
    }

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

// ========== QMLPositioner ==========

p = QMLPositioner.prototype = new QMLItem();
createProperty({ type: "int", object: p, name: "spacing", initialValue: 0 });

function QMLPositioner(parent) {
    QMLItem.call(this, parent);

    this.spacingChanged.connect(this, this.layoutChildren);
    this.childrenChanged.connect(this, this.layoutChildren);
    this.childrenChanged.connect(this, QMLPositioner.slotChildrenChanged);
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

// ========== Row ==========

p = QMLRow.prototype = new QMLPositioner();
function QMLRow(parent) {
    QMLPositioner.call(this, parent);
    if (engine.renderMode == QMLRenderMode.DOM)
        this.dom.className += " Row";

    this.layoutDirectionChanged.connect(this, this.layoutChildren);
}
p.layoutChildren = function() {
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
    this.implicitHeight = maxHeight;
    this.implicitWidth = curPos - this.spacing; // We want no spacing at the right side
}
p.$setLayoutDirection = function(newVal) {
    this.$properties.layoutDirection = newVal;
    this.layoutChildren();
}
createProperty({ type: "enum", object: p, name: "layoutDirection", initialValue: 0, set: p.$setLayoutDirection });

// ========== Column ==========

p = QMLColumn.prototype = new QMLPositioner();
function QMLColumn(parent) {
    QMLPositioner.call(this, parent);
    if (engine.renderMode == QMLRenderMode.DOM)
        this.dom.className += " Column";
}
p.layoutChildren = function() {
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
    this.implicitWidth = maxWidth;
    this.implicitHeight = curPos - this.spacing; // We want no spacing at the bottom side
}

// ========== Grid ==========

p = QMLGrid.prototype = new QMLPositioner();
function QMLGrid(parent) {
    QMLPositioner.call(this, parent);
    if (engine.renderMode == QMLRenderMode.DOM)
        this.dom.className += " Grid";

    this.Grid = {
        LeftToRight: 0,
        TopToBottom: 1
    }

}
p.layoutChildren = function() {
    var visibleItems = [],
        r = 0, c = 0,
        colWidth = [],
        rowHeight = [],
        gridWidth = -this.spacing,
        gridHeight = -this.spacing,
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
    } else if (!this.columns) {
        r = this.rows;
        c = Math.ceil(visibleItems.length / r);
    } else {
        c = this.columns;
        r = Math.ceil(visibleItems.length / c);
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

    for (var i in colWidth)
        gridWidth += colWidth[i] + this.spacing;
    for (var i in rowHeight)
        gridHeight += rowHeight[i] + this.spacing;

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

    this.implicitWidth = gridWidth;
    this.implicitHeight = gridHeight;
}
p.$setColumns = function(newVal) {
    this.$properties.columns = newVal;
    this.layoutChildren();
}
p.$setRows = function(newVal) {
    this.$properties.rows = newVal;
    this.layoutChildren();
}
p.$setFlow = function(newVal) {
    this.$properties.flow = newVal;
    this.layoutChildren();
}
p.$setLayoutDirection = function(newVal) {
    this.$properties.layoutDirection = newVal;
    this.layoutChildren();
}
createProperty({ type: "int", object: p, name: "columns", set: p.$setColumns });
createProperty({ type: "int", object: p, name: "rows", set: p.$setRows });
createProperty({ type: "enum", object: p, name: "flow", initialValue: 0, set: p.$setFlow });
createProperty({ type: "enum", object: p, name: "layoutDirection", initialValue: 0, set: p.$setLayoutDirection });

// ========== Flow ==========

p = QMLFlow.prototype = new QMLPositioner();
function QMLFlow(parent) {
    QMLPositioner.call(this, parent);
    if (engine.renderMode == QMLRenderMode.DOM)
        this.dom.className += " Flow";

    this.Flow = {
        LeftToRight: 0,
        TopToBottom: 1
    }

    this.widthChanged.connect(this, this.layoutChildren);
}
p.layoutChildren = function() {
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
        this.implicitHeight = curVPos + rowSize;
    else
        this.implicitWidth = curHPos + rowSize;
}
p.$setFlow = function(newVal) {
    this.$properties.flow = newVal;
    this.layoutChildren();
}
p.$setLayoutDirection = function(newVal) {
    this.$properties.layoutDirection = newVal;
    this.layoutChildren();
}
createProperty({ type: "enum", object: p, name: "flow", initialValue: 0, set: p.$setFlow });
createProperty({ type: "enum", object: p, name: "layoutDirection", initialValue: 0, set: p.$setLayoutDirection });

// ========== vector3d ==========

p = QMLVector3D.prototype = new QObject();
createProperty({ type: "real", object: p, name: "x", initialValue: 0 });
createProperty({ type: "real", object: p, name: "y", initialValue: 0 });
createProperty({ type: "real", object: p, name: "z", initialValue: 0 });
function QMLVector3D(parent) {
    QObject.call(this, parent);
}

// ========== Rotation ==========

p = QMLRotation.prototype = new QMLBaseObject();
function QMLRotation(parent) {
    QMLBaseObject.call(this, parent);

    this.axis = new QMLVector3D(this);
    this.axis.z = 1;
    this.origin = new QMLVector3D(this);
}
p.$updateOrigin = function() {
    this.$parent.dom.style.transformOrigin = this.origin.x + "px " + this.origin.y + "px";
    this.$parent.dom.style.MozTransformOrigin = this.origin.x + "px " + this.origin.y + "px";    // Firefox
    this.$parent.dom.style.webkitTransformOrigin = this.origin.x + "px " + this.origin.y + "px"; // Chrome, Safari and Opera
}
p.$updateDirtyProperty = function(name, newVal) {
    if (engine.renderMode == QMLRenderMode.Canvas)
        return;

    switch (name) {
        case "origin.x":
        case "origin.y":
            this.$updateOrigin();
        case "axis.x":
        case "axis.y":
        case "axis.z":
        case "angle":
            this.$parent.$updateTransform();
    }
}
createProperty({ type: "real", object: p, name: "angle", initialValue: 0 });

// ========== Scale ==========

p = QMLScale.prototype = new QMLBaseObject();
function QMLScale(parent) {
    QMLBaseObject.call(this, parent);

    this.origin = new QMLVector3D(this);
}
p.$updateOrigin = function() {
    this.$parent.dom.style.transformOrigin = this.origin.x + "px " + this.origin.y + "px";
    this.$parent.dom.style.MozTransformOrigin = this.origin.x + "px " + this.origin.y + "px";    // Firefox
    this.$parent.dom.style.webkitTransformOrigin = this.origin.x + "px " + this.origin.y + "px"; // Chrome, Safari and Opera
}
p.$updateDirtyProperty = function(name, newVal) {
    if (engine.renderMode == QMLRenderMode.Canvas)
        return;

    switch (name) {
        case "origin.x":
        case "origin.y":
            this.$updateOrigin();
        case "xScale":
        case "yScale":
            this.$parent.$updateTransform();
    }
}
createProperty({ type: "real", object: p, name: "xScale", initialValue: 0 });
createProperty({ type: "real", object: p, name: "yScale", initialValue: 0 });

// ========== Translate ==========

p = QMLTranslate.prototype = new QMLBaseObject();
function QMLTranslate(parent) {
    QMLBaseObject.call(this, parent);
}
p.$updateDirtyProperty = function(name, newVal) {
    if (engine.renderMode == QMLRenderMode.DOM)
        this.$parent.$updateTransform();
}
createProperty({ type: "real", object: p, name: "x", initialValue: 0 });
createProperty({ type: "real", object: p, name: "y", initialValue: 0 });

// ========== Text ==========

p = QMLText.prototype = new QMLItem();

function QMLText(parent) {
    QMLItem.call(this, parent);
    if (engine.renderMode == QMLRenderMode.DOM)
        this.dom.className += " Text";

    this.font = new QMLFont(null, this, "font");

    if (engine.renderMode == QMLRenderMode.DOM) {
        // We create another span inside the text to distinguish the actual
        // (possibly html-formatted) text from child elements
        this.dom.innerHTML = "<span></span>";
        this.dom.firstChild.style.width = "100%";
        this.dom.firstChild.style.height = "100%";
    }

    this.Component.completed.connect(this, this.$updateImplicitSize);
}

p.Text = {
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
}
p.$updateImplicitSize = function() {
    var height = 0,
        width = 0;

    if (engine.renderMode == QMLRenderMode.DOM && this.dom) {
        height = this.dom.firstChild.offsetHeight;
        width = this.dom.firstChild.offsetWidth;
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
        width = engine.$getTextMetrics(this.text, fontCss(this.font)).width;
    }

    this.implicitHeight = height;
    this.implicitWidth = width;
}
p.$updateDirtyProperty = function(name, newVal) {
    if (engine.renderMode !== QMLRenderMode.DOM)
        return;
    switch (name) {
        case "color":
            this.dom.firstChild.style.color = newVal;
            break;
        case "font.bold":
            this.dom.firstChild.style.fontWeight =
                this.font.weight !== Undefined ? this.font.weight :
                newVal ? "bold" : "normal";
            this.$updateImplicitSize();
            break;
        case "font.capitalization":
            this.dom.firstChild.style.fontVariant =
                newVal == "smallcaps" ? "small-caps" : "normal";
            newVal = newVal == "smallcaps" ? "none" : newVal;
            this.dom.firstChild.style.textTransform = newVal;
            this.$updateImplicitSize();
            break;
        case "font.family":
            this.dom.firstChild.style.fontFamily = newVal;
            this.$updateImplicitSize();
            break;
        case "font.italic":
            this.dom.firstChild.style.fontStyle = newVal ? "italic" : "normal";
            this.$updateImplicitSize();
            break;
        case "font.letterSpacing":
            this.dom.firstChild.style.letterSpacing = newVal !== Undefined ? newVal + "px" : "";
            this.$updateImplicitSize();
            break;
        case "font.pixelSize":
            var val = newVal !== Undefined ? newVal + "px "
                : (this.font.pointSize || 10) + "pt";
            this.dom.style.fontSize = val;
            this.dom.firstChild.style.fontSize = val;
            this.$updateImplicitSize();
            break;
        case "font.pointSize":
            var val = this.font.pixelSize !== Undefined ? this.font.pixelSize + "px "
                : (newVal || 10) + "pt";
            this.dom.style.fontSize = val;
            this.dom.firstChild.style.fontSize = val;
            this.$updateImplicitSize();
            break;
        case "font.strikeout":
            this.dom.firstChild.style.textDecoration = newVal
                ? "line-through"
                : this.font.underline
                ? "underline"
                : "none";
            this.$updateImplicitSize();
            break;
        case "font.underline":
            this.dom.firstChild.style.textDecoration = this.font.strikeout
                ? "line-through"
                : newVal
                ? "underline"
                : "none";
            this.$updateImplicitSize();
            break;
        case "font.weight":
            this.dom.firstChild.style.fontWeight =
                newVal !== Undefined ? newVal :
                this.font.bold ? "bold" : "normal";
            this.$updateImplicitSize();
            break;
        case "font.wordSpacing":
            this.dom.firstChild.style.wordSpacing = newVal !== Undefined ? newVal + "px" : "";
            this.$updateImplicitSize();
            break;
        case "horizontalAlignment":
            this.dom.style.textAlign = newVal;
            // AlignJustify doesn't work with pre/pre-wrap, so we decide the
            // lesser of the two evils to be ignoring "\n"s inside the text.
            if (newVal == "justify")
                this.dom.firstChild.style.whiteSpace = "normal";
            break;
        case "lineHeight":
            this.dom.firstChild.style.lineHeight = newVal + "px";
            this.$updateImplicitSize();
            break;
        case "style":
            switch (newVal) {
                case 0:
                    this.dom.firstChild.style.textShadow = "none";
                    break;
                case 1:
                    var color = this.styleColor;
                    this.dom.firstChild.style.textShadow = "1px 0 0 " + color
                        + ", -1px 0 0 " + color
                        + ", 0 1px 0 " + color
                        + ", 0 -1px 0 " + color;
                    break;
                case 2:
                    this.dom.firstChild.style.textShadow = "1px 1px 0 " + this.styleColor;
                    break;
                case 3:
                    this.dom.firstChild.style.textShadow = "-1px -1px 0 " + this.styleColor;
            }
            this.$updateImplicitSize();
            break;
        case "styleColor":
            switch (this.style) {
                case 0:
                    this.dom.firstChild.style.textShadow = "none";
                    break;
                case 1:
                    this.dom.firstChild.style.textShadow = "1px 0 0 " + newVal
                        + ", -1px 0 0 " + newVal
                        + ", 0 1px 0 " + newVal
                        + ", 0 -1px 0 " + newVal;
                    break;
                case 2:
                    this.dom.firstChild.style.textShadow = "1px 1px 0 " + newVal;
                    break;
                case 3:
                    this.dom.firstChild.style.textShadow = "-1px -1px 0 " + newVal;
            }
            break;
        case "text":
            this.dom.firstChild.innerHTML = newVal;
            this.$updateImplicitSize();
            break;
        case "wrapMode":
            switch (newVal) {
                case 0:
                    this.dom.firstChild.style.whiteSpace = "pre";
                    this.dom.firstChild.style.wordWrap = "normal";
                    break;
                case 1:
                    this.dom.firstChild.style.whiteSpace = "pre-wrap";
                    this.dom.firstChild.style.wordWrap = "normal";
                    break;
                case 2:
                    this.dom.firstChild.style.whiteSpace = "pre-wrap";
                    this.dom.firstChild.style.wordBreak = "break-all";
                    break;
                case 3:
                    this.dom.firstChild.style.whiteSpace = "pre-wrap";
                    this.dom.firstChild.style.wordWrap = "break-word";
            }
            // AlignJustify doesn't work with pre/pre-wrap, so we decide the
            // lesser of the two evils to be ignoring "\n"s inside the text.
            if (this.horizontalAlignment == "justify")
                this.dom.firstChild.style.whiteSpace = "normal";
            this.$updateImplicitSize();
        case "parent":
            this.$updateImplicitSize();
        default:
            QMLItem.prototype.$updateDirtyProperty.call(this, name, newVal);
    }
}
p.$drawItem = function(c) {
    c.save();
    c.font = fontCss(this.font);
    c.fillStyle = this.color;
    c.textAlign = "left";
    c.textBaseline = "top";
    c.fillText(this.text, this.left, this.top);
    c.restore();
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
createProperty({ type: "color", object: p, name: "color", initialValue: "black" });
createProperty({ type: "font", object: p, name: "font" });
createProperty({ type: "string", object: p, name: "text", initialValue: "" });
createProperty({ type: "real", object: p, name: "lineHeight", initialValue: 1 });
createProperty({ type: "enum", object: p, name: "wrapMode", initialValue: p.Text.NoWrap });
createProperty({ type: "enum", object: p, name: "horizontalAlignment" });
createProperty({ type: "enum", object: p, name: "style" });
createProperty({ type: "color", object: p, name: "styleColor" });
engine.globalStylesheet.appendChild(document.createTextNode(".Text {\
    pointer-events: auto; \
    color: black;\
    font-weight: normal;\
    font-variant: normal;\
    font-family: sans-serif;\
    font-style: normal;\
    letter-spacing: normal;\
    line-height: 1;\
    font-size: 10pt;\
    text-align: left;\
    text-decoration: none;\
    text-shadow: none;\
    white-space: pre;\
    word-wrap: normal; \
    word-break: normal;\
    word-spacing: normal;\
}"));

// ========== Rectangle ==========

p = QMLRectangle.prototype = new QMLItem();
function QMLRectangle(parent) {
    QMLItem.call(this, parent);

    this.dom.className += " Rectangle";
    this.border = new QMLPen(null, this, "border");
}
p.$updateDirtyProperty = function(name, newVal) {
    if (engine.renderMode == QMLRenderMode.Canvas) {
        engine.$requestDraw();
        return;
    }

    switch (name) {
        case "color":
            this.dom.style.backgroundColor = newVal;
            break;
        case "radius":
            this.dom.style.borderRadius = newVal + "px";
            break;
        case "border.color":
            this.dom.style.borderColor = newVal;
            this.dom.style.borderStyle = this.border.width == 0 || newVal == "transparent"
                                                ? "none" : "solid";
            break;
        case "border.width":
            this.dom.style.borderWidth = newVal + "px";
            this.dom.style.borderStyle = newVal == 0 || this.border.color == "transparent"
                                                ? "none" : "solid";
            break;
        default:
            QMLItem.prototype.$updateDirtyProperty.call(this, name, newVal);

    }
}
p.$drawItem = function(c) {
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
createProperty({ type: "color", object: p, name: "color", initialValue: "white" });
createProperty({ type: "real", object: p, name: "radius", initialValue: 0 });
engine.globalStylesheet.appendChild(document.createTextNode(".Rectangle {\
    background-color: white; \
    border-width: 1px \
}"))

// ========== Repeater ==========

p = QMLRepeater.prototype = new QMLItem();
p.$defaultProperty = "delegate";

function QMLRepeater(parent) {
    QMLItem.call(this, parent);

    this.$items = []; // List of created items
}

p.itemAt = function(index) {
    return this.$items[index];
}
p.$setModel = function(newVal) {
    this.$properties.model = newVal;
    this.$applyModel();
}
p.$setDelegate = function(newVal) {
    this.$properties.delegate = newVal;
    this.$applyModel();
}
p.$callOnCompleted = function(child) {
    child.Component.completed();
    for (var i = 0; i < child.children.length; i++)
        this.$callOnCompleted(child.children[i]);
}
p.$insertChildren = function(startIndex, endIndex) {
    for (var index = startIndex; index < endIndex; index++) {
        var newItem = this.delegate.createObject(this);

        createProperty({ type: "int", object: newItem, name: "index" });
        var model = this.model instanceof QMLListModel ? this.model.$model : this.model;
        for (var i in model.roleNames) {
            var roleName = model.roleNames[i];
            createProperty({ type: "variant", object: newItem, name: roleName });
            _executionContext = this.model.$context;
            newItem[roleName] = model.data(index, roleName);

            // TODO: use prototypes for components and add this to the delegate component
            (function(model, index, roleName) {
                setupGetter(newItem.$context, roleName, function() {
                    return model.data(index, roleName);
                });
            })(model, index, roleName);
        }

        this.parent.children.splice(this.parent.children.indexOf(this) - this.$items.length + index, 0, newItem);
        newItem.parent = this.parent;
        this.parent.childrenChanged();
        this.$items.splice(index, 0, newItem);

        newItem.index = index;

        if (engine.operationState !== QMLOperationState.Init) {
            // We don't call those on first creation, as they will be called
            // by the regular creation-procedures at the right time.
            engine.$initializePropertyBindings();
            this.$callOnCompleted(newItem);
        }
    }
    for (var i = endIndex; i < this.$items.length; i++)
        this.$items[i].index = i;

    this.count = this.$items.length;
}
p.$applyModel = function() {
    if (!this.delegate)
        return;
    var model = this.model instanceof QMLListModel ? this.model.$model : this.model;
    if (model instanceof JSItemModel) {
        model.dataChanged.connect(function(startIndex, endIndex) {
            //TODO
        });
        model.rowsInserted.connect(this.$insertChildren);
        model.rowsMoved.connect(function(sourceStartIndex, sourceEndIndex, destinationIndex) {
            var vals = this.$items.splice(sourceStartIndex, sourceEndIndex-sourceStartIndex);
            for (var i = 0; i < vals.length; i++) {
                this.$items.splice(destinationIndex + i, 0, vals[i]);
            }
            var smallestChangedIndex = sourceStartIndex < destinationIndex
                                    ? sourceStartIndex : destinationIndex;
            for (var i = smallestChangedIndex; i < this.$items.length; i++) {
                this.$items[i].index = i;
            }
            engine.$requestDraw();
        });
        model.rowsRemoved.connect(function(startIndex, endIndex) {
            this.$removeChildren(startIndex, endIndex);
            for (var i = startIndex; i < this.$items.length; i++) {
                this.$items[i].index = i;
            }
            this.count = this.$items.length;
            engine.$requestDraw();
        });
        model.modelReset.connect(function() {
            this.$removeChildren(0, this.$items.length);
            this.$insertChildren(0, model.rowCount());
            engine.$requestDraw();
        });

        this.$insertChildren(0, model.rowCount());
    } else if (typeof model == "number") {
        this.$removeChildren(0, this.$items.length);
        this.$insertChildren(0, model);
    }
}
p.$removeChildren = function(startIndex, endIndex) {
    var removed = this.$items.splice(startIndex, endIndex - startIndex);
    for (var index in removed) {
        removed[index].$delete();
        removed[index].parent = undefined;
        this.$removeChildProperties(removed[index]);
    }
}
p.$removeChildProperties = function(child) {
    if (engine.renderMode == QMLRenderMode.Canvas && child instanceof QMLMouseArea)
        engine.mouseAreas.splice(engine.mouseAreas.indexOf(child), 1);
    engine.completedSignals.splice(engine.completedSignals.indexOf(child.Component.completed), 1);
    for (var i = 0; i < child.children.length; i++)
        this.$removeChildProperties(child.children[i])
}
createProperty({ type: "Component", object: p, name: "delegate", set: p.$setDelegate });
createProperty({ type: "variant", object: p, name: "model", initialValue: 0, set: p.$setModel });
createProperty({ type: "int", object: p, name: "count", initialValue: 0 });

// ========== ListModel ==========

p = QMLListModel.prototype = new QMLBaseObject();
p.$defaultProperty = "$items";

function QMLListModel(parent) {
    QMLBaseObject.call(this, parent);
    var self = this,
        firstItem = true;

    this.$model = new JSItemModel();

    this.$itemsChanged.connect(this, function(newVal) {
        if (firstItem) {
            firstItem = false;
            var roleNames = [];
            var dict = newVal[0];
            for (var i in (dict instanceof QMLListElement) ? dict.$properties : dict) {
                if (i != "index")
                    roleNames.push(i);
            }
            this.$model.setRoleNames(roleNames);
        }
        this.count = this.$items.length;
    });

    this.$model.data = function(index, role) {
        return self.$items[index][role];
    }
    this.$model.rowCount = function() {
        return self.$items.length;
    }
}

p.append = function(dict) {
    this.insert(this.$items.length, dict);
}
p.clear = function() {
    this.$items = [];
    this.$model.modelReset();
    this.count = 0;
}
p.get = function(index) {
    return this.$items[index];
}
p.insert = function(index, dict) {
    this.$items.splice(index, 0, dict);
    this.$itemsChanged(this.$items);
    this.$model.rowsInserted(index, index+1);
}
p.move = function(from, to, n) {
    var vals = this.$items.splice(from, n);
    for (var i = 0; i < vals.length; i++) {
        this.$items.splice(to + i, 0, vals[i]);
    }
    this.$model.rowsMoved(from, from+n, to);
}
p.remove = function(index) {
    this.$items.splice(index, 1);
    this.$model.rowsRemoved(index, index+1);
    this.count = this.$items.length;
}
p.set = function(index, dict) {
    this.$items[index] = dict;
    engine.$requestDraw();
}
p.setProperty = function(index, property, value) {
    this.$items[index][property] = value;
    engine.$requestDraw();
}
createProperty({ type: "int", object: p, name: "count", initialValue: 0 });
createProperty({ type: "list", object: p, name: "$items", initialValue: [] });

// ========== ListElement ==========

p = QMLListElement.prototype = new QMLBaseObject();
function QMLListElement(parent) {
    QMLBaseObject.call(this, parent);

    this.$setCustomData = function(propName, value) {
        createProperty({ type: "variant", object: this, name: propName, initialValue: value });
    }
}

// ========== size ==========

p = QMLSize.prototype = new QObject();
createProperty({ type: "int", object: p, name: "width", initialValue: 0 });
createProperty({ type: "int", object: p, name: "height", initialValue: 0 });
function QMLSize(parent) {
    QObject.call(this, parent);
}

// ========== Image ==========

p = QMLImage.prototype = new QMLItem();

function QMLImage(parent) {
    QMLItem.call(this, parent);
    this.$img = new Image();
    var self = this;

    if (engine.renderMode == QMLRenderMode.DOM) {
        this.dom.className += " Image";
        this.dom.appendChild(this.$img);
    }

    this.sourceSize = new QMLSize(this);

    // Bind status to img element
    this.$img.onload = function() {
        self.progress = 1;
        self.status = self.Image.Ready;

        var w = this.naturalWidth;
        var h = this.naturalHeight;
        self.sourceSize.width = w;
        self.sourceSize.height = h;
        self.implicitWidth = w;
        self.implicitHeight = h;
    }
    this.$img.onerror = function() {
        self.status = self.Image.Error;
    }

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

p.Image = {
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
p.$setSource = function(newVal) {
    this.$properties.source = newVal;
    this.progress = 0;
    this.status = this.Image.Loading;
    this.$img.src = engine.$resolvePath(newVal);
}
createProperty({ type: "enum", object: p, name: "fillMode", initialValue: p.Image.Stretch });
createProperty({ type: "bool", object: p, name: "mirror", initialValue: false });
createProperty({ type: "real", object: p, name: "progress", initialValue: 0 });
createProperty({ type: "url", object: p, name: "source", initialValue: "", set: p.$setSource });
createProperty({ type: "enum", object: p, name: "status", initialValue: p.Image.Null });
// no-op properties
createProperty({ type: "bool", object: p, name: "asynchronous", initialValue: true });
createProperty({ type: "bool", object: p, name: "cache", initialValue: true });
createProperty({ type: "bool", object: p, name: "smooth", initialValue: true });

engine.globalStylesheet.appendChild(document.createTextNode(".Image img {\
    width: 100%; \
    height: 100%; \
    position: absolute; \
}"));

// ========== AnimatedImage ==========

p = QMLAnimatedImage.prototype = new QMLImage();
function QMLAnimatedImage(parent) {
    QMLImage.call(this, parent);
}

p = QMLScaleGrid.prototype = new QObject();
createProperty({ type: "int", object: p, name: "left", initialValue: 0 });
createProperty({ type: "int", object: p, name: "right", initialValue: 0 });
createProperty({ type: "int", object: p, name: "top", initialValue: 0 });
createProperty({ type: "int", object: p, name: "bottom", initialValue: 0 });
function QMLScaleGrid(parent) {
    QObject.call(parent);
}

// ========== BorderImage ==========

p = QMLBorderImage.prototype = new QMLItem();
p.BorderImage = {
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
createProperty({ type: "url", object: p, name: "source", initialValue: "" });
createProperty({ type: "enum", object: p, name: "status", initialValue: p.BorderImage.Null });
createProperty({ type: "enum", object: p, name: "horizontalTileMode", initialValue: p.BorderImage.Stretch });
createProperty({ type: "enum", object: p, name: "verticalTileMode", initialValue: p.BorderImage.Stretch });
function QMLBorderImage(parent) {
    QMLItem.call(this, parent);
    var self = this;

    if (engine.renderMode == QMLRenderMode.Canvas)
        var img = new Image();

    this.border = new QMLScaleGrid(this);

    if (engine.renderMode == QMLRenderMode.DOM) {
        this.sourceChanged.connect(this, function() {
            this.dom.style.borderImageSource = "url(" + engine.$resolvePath(this.source) + ")";
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
        this.dom.style.MozBorderImageSource = "url(" + engine.$resolvePath(this.source) + ")";
        this.dom.style.MozBorderImageSlice = this.border.top + " "
                                                + this.border.right + " "
                                                + this.border.bottom + " "
                                                + this.border.left;
        this.dom.style.MozBorderImageRepeat = this.horizontalTileMode + " "
                                                    + this.verticalTileMode;
        this.dom.style.MozBorderImageWidth = this.border.top + " "
                                                + this.border.right + " "
                                                + this.border.bottom + " "
                                                + this.border.left;

        this.dom.style.webkitBorderImageSource = "url(" + engine.$resolvePath(this.source) + ")";
        this.dom.style.webkitBorderImageSlice = this.border.top + " "
                                                + this.border.right + " "
                                                + this.border.bottom + " "
                                                + this.border.left;
        this.dom.style.webkitBorderImageRepeat = this.horizontalTileMode + " "
                                                    + this.verticalTileMode;
        this.dom.style.webkitBorderImageWidth = this.border.top + " "
                                                + this.border.right + " "
                                                + this.border.bottom + " "
                                                + this.border.left;

        this.dom.style.OBorderImageSource = "url(" + engine.$resolvePath(this.source) + ")";
        this.dom.style.OBorderImageSlice = this.border.top + " "
                                                + this.border.right + " "
                                                + this.border.bottom + " "
                                                + this.border.left;
        this.dom.style.OBorderImageRepeat = this.horizontalTileMode + " "
                                                    + this.verticalTileMode;
        this.dom.style.OBorderImageWidth = this.border.top + "px "
                                                + this.border.right + "px "
                                                + this.border.bottom + "px "
                                                + this.border.left + "px";

        this.dom.style.borderImageSlice = this.border.top + " "
                                                + this.border.right + " "
                                                + this.border.bottom + " "
                                                + this.border.left;
        this.dom.style.borderImageRepeat = this.horizontalTileMode + " "
                                                    + this.verticalTileMode;
        this.dom.style.borderImageWidth = this.border.top + "px "
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

// ========== MouseArea ==========

p = QMLMouseArea.prototype = new QMLItem();
createProperty({ type: "variant", object: p, name: "acceptedButtons", initialValue: Qt.LeftButton });
createProperty({ type: "bool", object: p, name: "enabled", initialValue: true });
createProperty({ type: "bool", object: p, name: "hoverEnabled", initialValue: false });
createProperty({ type: "real", object: p, name: "mouseX", initialValue: 0 });
createProperty({ type: "real", object: p, name: "mouseY", initialValue: 0 });
createProperty({ type: "bool", object: p, name: "pressed", initialValue: false });
createProperty({ type: "bool", object: p, name: "containsMouse", initialValue: false });
function QMLMouseArea(parent) {
    QMLItem.call(this, parent);
    var self = this;

    if (engine.renderMode == QMLRenderMode.DOM) {
        this.dom.style.pointerEvents = "all";
        this.dom.className += " MouseArea";

        // IE does not handle mouse clicks to transparent divs, so we have
        // to set a background color and make it invisible using opacity
        // as that doesn't affect the mouse handling.
        this.dom.style.backgroundColor = "white";
        this.dom.style.opacity = 0;
    }

    this.clicked = Signal([{type: "variant", name: "mouse"}]);
    this.entered = Signal();
    this.exited = Signal();
    this.positionChanged = Signal([{type: "variant", name: "mouse"}]);

    if (engine.renderMode == QMLRenderMode.DOM) {
        function eventToMouse(e) {
            return {
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
        }
        function handleClick(e) {
            var mouse = eventToMouse(e);

            if (self.enabled && self.acceptedButtons & mouse.button) {
                self.clicked(mouse);
                engine.$requestDraw();
            }
            // This decides whether to show the browser's context menu on right click or not
            return !(self.acceptedButtons & Qt.RightButton);
        }
        this.dom.onclick = handleClick;
        this.dom.oncontextmenu = handleClick;
        this.dom.onmousedown = function(e) {
            if (self.enabled) {
                var mouse = eventToMouse(e);
                self.mouseX = mouse.x;
                self.mouseY = mouse.y;
                self.pressed = true;
            }
        }
        this.dom.onmouseup = function(e) {
            self.pressed = false;
        }
        this.dom.onmouseover = function(e) {
            if (self.hoverEnabled) {
                self.containsMouse = true;
                self.entered();
            }
        }
        this.dom.onmouseout = function(e) {
            if (self.hoverEnabled) {
                self.containsMouse = false;
                self.exited();
            }
        }
        this.dom.onmousemove = function(e) {
            if (self.enabled && (self.hoverEnabled || self.pressed)) {
                var mouse = eventToMouse(e);
                self.positionChanged(mouse);
                self.mouseX = mouse.x;
                self.mouseY = mouse.y;
            }
        }
    } else {
        engine.mouseAreas.push(this);
    }
}

// ========== State ==========

p = QMLState.prototype = new QMLBaseObject();
p.$defaultProperty = "changes";
createProperty({ type: "string", object: p, name: "name", initialValue: "" });
createProperty({ type: "list", object: p, name: "changes", initialValue: [] });
createProperty({ type: "string", object: p, name: "extend", initialValue: "" });
createProperty({ type: "bool", object: p, name: "when", initialValue: false });
function QMLState(parent) {
    QMLBaseObject.call(this, parent);

    this.$item = this.$parent;

    this.whenChanged.connect(this, function(newVal) {
        if (newVal)
            this.$item.state = this.name;
        else if (this.$item.state == this.name)
            this.$item.state = "";
    });

    this.$getAllChanges = function() {
        if (this.extend) {
            for (var i = 0; i < this.$item.states.length; i++)
                if (this.$item.states[i].name == this.extend)
                    return this.$item.states[i].$getAllChanges().concat(this.changes);
        } else
            return this.changes;
    }
}

// ========== PropertyChanges ==========

p = QMLPropertyChanges.prototype = new QMLBaseObject();
createProperty({ type: "QtObject", object: p, name: "target" });
createProperty({ type: "bool", object: p, name: "explicit", initialValue: false });
createProperty({ type: "bool", object: p, name: "restoreEntryValues", initialValue: true });
function QMLPropertyChanges(parent) {
    QMLBaseObject.call(this, parent);

    this.$actions = [];

    this.$setCustomData = function(propName, value) {
        this.$actions.push({
            property: propName,
            value: value
        });
    }
}

// ========== Transition ==========

p = QMLTransition.prototype = new QMLBaseObject();
p.$defaultProperty = "animations";
createProperty({ type: "list", object: p, name: "animations", initialValue: [] });
createProperty({ type: "string", object: p, name: "from", initialValue: "*" });
createProperty({ type: "string", object: p, name: "to", initialValue: "*" });
createProperty({ type: "bool", object: p, name: "reversible", initialValue: false });
function QMLTransition(parent) {
    QMLBaseObject.call(this, parent);

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

// ========== Timer ==========

p = QMLTimer.prototype = new QMLBaseObject();
p.$prevTrigger = 0;
p.start = function() {
    if (!this.running) {
        this.running = true;
        this.$prevTrigger = (new Date).getTime();
        if (this.triggeredOnStart) {
            trigger();
        }
    }
}
p.stop = function() {
    if (this.running) {
        this.running = false;
    }
}
p.restart = function() {
    this.stop();
    this.start();
}
p.$trigger = function() {
    if (!this.repeat)
        // We set the value directly in order to be able to emit the runningChanged
        // signal after triggered, like Qt does it.
        this.$properties.running = false;

    // Trigger this.
    this.triggered();

    engine.$requestDraw();

    if (!this.repeat)
        // Emit changed signal manually after setting the value manually above.
        this.runningChanged();
}

createProperty({ type: "int", object: p, name: "interval", initialValue: 1000 });
createProperty({ type: "bool", object: p, name: "repeat", initialValue: false });
createProperty({ type: "bool", object: p, name: "running", initialValue: false });
createProperty({ type: "bool", object: p, name: "triggeredOnStart", initialValue: false });
function QMLTimer(parent) {
    QMLBaseObject.call(this, parent);
    var self = this;

    // Create trigger as simple property. Reading the property triggers
    // the function!
    this.triggered = Signal();

    engine.$addTicker(ticker);
    function ticker(now, elapsed) {
        if (self.running) {
            if (now - self.$prevTrigger >= self.interval) {
                self.$prevTrigger = now;
                self.$trigger();
            }
        }
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

// ========== Animation ==========

p = QMLAnimation.prototype = new QMLBaseObject();
p.Animation = {
    Infinite: Math.Infinite
};
// Methods
p.restart = function() {
    this.stop();
    this.start();
};
p.start = function() {
    this.running = true;
}
p.stop = function() {
    this.running = false;
}
p.pause = function() {
    this.paused = true;
}
p.resume = function() {
    this.paused = false;
}
// To be overridden
p.complete = unboundMethod;

createProperty({ type: "bool", object: p, name: "alwaysRunToEnd", initialValue: false });
createProperty({ type: "int", object: p, name: "loops", initialValue: 1 });
createProperty({ type: "bool", object: p, name: "paused", initialValue: false });
createProperty({ type: "bool", object: p, name: "running", initialValue: false });
function QMLAnimation(parent) {
    QMLBaseObject.call(this, parent);
}

// ========== SequentialAnimation ==========

p = QMLSequentialAnimation.prototype = new QMLAnimation();
p.$defaultProperty = "animations";
p.start = function() {
    if (!this.running) {
        this.running = true;
        curIndex = -1;
        passedLoops = 0;
        nextAnimation();
    }
}
p.stop = function() {
    if (this.running) {
        this.running = false;
        if (curIndex < this.animations.length) {
            this.animations[curIndex].stop();
        }
    }
}
p.complete = function() {
    if (this.running) {
        if (curIndex < this.animations.length) {
            // Stop current animation
            this.animations[curIndex].stop();
        }
        this.running = false;
    }
}

createProperty({ type: "list", object: p, name: "animations", initialValue: [] });
function QMLSequentialAnimation(parent) {
    QMLAnimation.call(this, parent);
    var curIndex,
        passedLoops,
        i,
        self = this;

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

// ========== ParallelAnimation ==========

p = QMLParallelAnimation.prototype = new QMLAnimation();
p.$defaultProperty = "animations";

p.start = function() {
    if (!this.running) {
        this.running = true;
        for (i = 0; i < this.animations.length; i++)
            this.animations[i].start();
    }
}
p.stop = function() {
    if (this.running) {
        for (i = 0; i < this.animations.length; i++)
            this.animations[i].stop();
        this.running = false;
    }
}
p.complete = p.stop;

createProperty({ type: "list", object: p, name: "animations", initialValue: [] });
function QMLParallelAnimation(parent) {
    QMLAnimation.call(this, parent);
    var curIndex,
        passedLoops,
        i;

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

// ========== easing-curve ==========

p = QMLEasingCurve.prototype = new QObject();
p.$valueForProgress = function(t) {
    switch(this.type) {
        // Quad
        case Easing.InQuad: return Math.pow(t, 2);
        case Easing.OutQuad: return -Math.pow(t - 1, 2) + 1;
        case Easing.InOutQuad:
            if (t < 0.5)
                return 2 * Math.pow(t, 2);
            return -2 * Math.pow(t - 1, 2) + 1;
        case Easing.OutInQuad:
            if (t < 0.5)
                return -2 * Math.pow(t - 0.5, 2) + 0.5;
            return 2 * Math.pow(t - 0.5, 2) + 0.5;
        // Cubic
        case Easing.InCubic: return Math.pow(t, 3);
        case Easing.OutCubic: return Math.pow(t - 1, 3) + 1;
        case Easing.InOutCubic:
            if (t < 0.5)
                return 4 * Math.pow(t, 3);
            return 4 * Math.pow(t - 1, 3) + 1;
        case Easing.OutInCubic:
            return 4 * Math.pow(t - 0.5, 3) + 0.5;
        // Quart
        case Easing.InQuart: return Math.pow(t, 4);
        case Easing.OutQuart: return -Math.pow(t - 1, 4) + 1;
        case Easing.InOutQuart:
            if (t < 0.5)
                return 8 * Math.pow(t, 4);
            return -8 * Math.pow(t - 1, 4) + 1;
        case Easing.OutInQuart:
            if (t < 0.5)
                return -8 * Math.pow(t - 0.5, 4) + 0.5;
            return 8 * Math.pow(t - 0.5, 4) + 0.5;
        // Quint
        case Easing.InQuint: return Math.pow(t, 5);
        case Easing.OutQuint: return Math.pow(t - 1, 5) + 1;
        case Easing.InOutQuint:
            if (t < 0.5)
                return 16 * Math.pow(t, 5);
            return 16 * Math.pow(t - 1, 5) + 1;
        case Easing.OutInQuint:
            if (t < 0.5)
                return 16 * Math.pow(t - 0.5, 5) + 0.5;
            return 16 * Math.pow(t - 0.5, 5) + 0.5;
        // Sine
        case Easing.InSine: return -Math.cos(0.5 * Math.PI * t) + 1;
        case Easing.OutSine: return Math.sin(0.5 * Math.PI * t);
        case Easing.InOutSine: return -0.5 * Math.cos(Math.PI * t) + 0.5;
        case Easing.OutInSine:
            if (t < 0.5)
                return 0.5 * Math.sin(Math.PI * t);
            return -0.5 * Math.sin(Math.PI * t) + 1;
        // Expo
        case Easing.InExpo: return (1/1023) * (Math.pow(2, 10*t) - 1);
        case Easing.OutExpo: return -(1024/1023) * (Math.pow(2, -10*t) - 1);
        case Easing.InOutExpo:
            if (t < 0.5)
                return (1/62) * (Math.pow(2, 10*t) - 1);
            return -(512/31) * Math.pow(2, -10*t) + (63/62);
        case Easing.OutInExpo:
            if (t < 0.5)
                return -(16/31) * (Math.pow(2, -10*t) - 1);
            return (1/1984) * Math.pow(2, 10*t) + (15/31);
        // Circ
        case Easing.InCirc: return 1 - Math.sqrt(1 - t*t);
        case Easing.OutCirc: return Math.sqrt(1 - Math.pow(t - 1, 2));
        case Easing.InOutCirc:
            if (t < 0.5)
                return 0.5 * (1 - Math.sqrt(1 - 4*t*t));
            return 0.5 * (Math.sqrt(1 - 4 * Math.pow(t - 1, 2)) + 1);
        case Easing.OutInCirc:
            if (t < 0.5)
                return 0.5 * Math.sqrt(1 - Math.pow(2 * t - 1, 2));
            return 0.5 * (2 - Math.sqrt(1 - Math.pow(2 * t - 1, 2)));
        // Elastic
        case Easing.InElastic:
            return -this.amplitude * Math.pow(2, 10 * t - 10)
                    * Math.sin(2 * t * Math.PI / this.period - Math.asin(1 / this.amplitude));
        case Easing.OutElastic:
            return this.amplitude * Math.pow(2, -10 * t)
                    * Math.sin(2 * t * Math.PI / this.period - Math.asin(1 / this.amplitude))
                    + 1;
        case Easing.InOutElastic:
            if (t < 0.5)
                return -0.5 * this.amplitude * Math.pow(2, 20 * t - 10)
                        * Math.sin(4 * t * Math.PI / this.period - Math.asin(1 / this.amplitude));
            return -0.5 * this.amplitude * Math.pow(2, -20 * t + 10)
                    * Math.sin(4 * t * Math.PI / this.period + Math.asin(1 / this.amplitude))
                    + 1;
        case Easing.OutInElastic:
            if (t < 0.5)
                return 0.5 * this.amplitude * Math.pow(2, -20 * t)
                        * Math.sin(4 * t * Math.PI / this.period - Math.asin(1 / this.amplitude))
                        + 0.5;
            return -0.5 * this.amplitude * Math.pow(2, 20 * t - 20)
                    * Math.sin(4 * t * Math.PI / this.period - Math.asin(1 / this.amplitude))
                    + 0.5;
        // Back
        case Easing.InBack: return (this.overshoot + 1) * Math.pow(t, 3) - this.overshoot * Math.pow(t, 2);
        case Easing.OutBack: return (this.overshoot + 1) * Math.pow(t - 1, 3) + this.overshoot * Math.pow(t - 1, 2) + 1;
        case Easing.InOutBack:
            if (t < 0.5)
                return 4 * (this.overshoot + 1) * Math.pow(t, 3) - 2 * this.overshoot * Math.pow(t, 2);
            return 0.5 * (this.overshoot + 1) * Math.pow(2 * t - 2, 3) + this.overshoot/2 * Math.pow(2 * t - 2, 2) + 1;
        case Easing.OutInBack:
            if (t < 0.5)
                return 0.5 * ((this.overshoot + 1) * Math.pow(2 * t - 1, 3) + this.overshoot * Math.pow(2 * t - 1, 2) + 1);
            return 4 * (this.overshoot + 1) * Math.pow( t - 0.5, 3) - 2 * this.overshoot * Math.pow(t - 0.5, 2) + 0.5;
        // Bounce
        case Easing.InBounce:
            if (t < 1/11) return -this.amplitude * (121/16) * (t*t - (1/11)*t);
            if (t < 3/11) return -this.amplitude * (121/16) * (t*t - (4/11)*t + (3/121));
            if (t < 7/11) return -this.amplitude * (121/16) * (t*t - (10/11)*t + (21/121));
            return -(121/16) * (t*t - 2*t + 1) + 1;
        case Easing.OutBounce:
            if (t < 4/11) return (121/16) * t*t;
            if (t < 8/11) return this.amplitude * (121/16) * (t*t - (12/11)*t + (32/121)) + 1;
            if (t < 10/11) return this.amplitude * (121/16) * (t*t - (18/11)*t + (80/121)) + 1;
            return this.amplitude * (121/16) * (t*t - (21/11)*t + (10/11)) + 1;
        case Easing.InOutBounce:
            if (t < 1/22) return -this.amplitude * (121/8) * (t*t - (1/22)*t);
            if (t < 3/22) return -this.amplitude * (121/8) * (t*t - (2/11)*t + (3/484));
            if (t < 7/22) return -this.amplitude * (121/8) * (t*t - (5/11)*t + (21/484));
            if (t < 11/22) return -(121/8) * (t*t - t + 0.25) + 0.5;
            if (t < 15/22) return (121/8) * (t*t - t) + (137/32);
            if (t < 19/22) return this.amplitude * (121/8) * (t*t - (17/11)*t + (285/484)) + 1;
            if (t < 21/22) return this.amplitude * (121/8) * (t*t - (20/11)*t + (399/484)) + 1;
            return this.amplitude * (121/8) * (t*t - (43/22)*t + (21/22)) + 1;
        case Easing.OutInBounce:
            if (t < 4/22) return (121/8) * t*t;
            if (t < 8/22) return -this.amplitude * (121/8) * (t*t - (6/11)*t + (8/121)) + 0.5;
            if (t < 10/22) return -this.amplitude * (121/8) * (t*t - (9/11)*t + (20/121)) + 0.5;
            if (t < 11/22) return -this.amplitude * (121/8) * (t*t - (21/22)*t + (5/22)) + 0.5;
            if (t < 12/22) return this.amplitude * (121/8) * (t*t - (23/22)*t + (3/11)) + 0.5;
            if (t < 14/22) return this.amplitude * (121/8) * (t*t - (13/11)*t + (42/121)) + 0.5;
            if (t < 18/22) return this.amplitude * (121/8) * (t*t - (16/11)*t + (63/121)) + 0.5;
            return -(121/8) * (t*t - 2*t + (117/121)) + 0.5;
        // Default
        default:
            console.log("Unsupported animation type: ", this.type);
        // Linear
        case Easing.Linear:
            return t;
    }
}
createProperty({ type: "enum", object: p, name: "type", initialValue: Easing.Linear });
createProperty({ type: "real", object: p, name: "amplitude", initialValue: 1 });
createProperty({ type: "real", object: p, name: "overshoot", initialValue: 0.3 });
createProperty({ type: "real", object: p, name: "period", initialValue: 1.70158 });
function QMLEasingCurve(parent) {
    QObject.call(this, parent);
}

// ========== PropertyAnimation ==========

p = QMLPropertyAnimation.prototype = new QMLAnimation();

function QMLPropertyAnimation(parent) {
    QMLAnimation.call(this, parent);

    this.easing = new QMLEasingCurve(this);

    this.$props = [];
    this.$targets = [];
    this.$actions = [];
}

p.$redoActions = function() {
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
p.$redoProperties = function() {
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
p.$redoTargets = function() {
    this.$targets = this.targets.slice();

    if (this.target && this.$targets.indexOf(this.target) === -1)
        this.$targets.push(this.target);
}
p.$setTargetProperty = function(newVal) {
    this.property = newVal.name;
    this.target = newVal.obj;
}
p.$setTarget = function(newVal) {
    this.$properties.target = newVal;
    this.$redoTargets();
}
p.$setTargets = function(newVal) {
    this.$properties.targets = newVal;
    this.$redoTargets();
}
p.$setProperty = function(newVal) {
    this.$properties.property = newVal;
    this.$redoProperties();
}
p.$setProperties = function(newVal) {
    this.$properties.properties = newVal;
    this.$redoProperties();
}
createProperty({ type: "int", object: p, name: "duration", initialValue: 250 });
createProperty({ type: "real", object: p, name: "from" });
createProperty({ type: "string", object: p, name: "properties", initialValue: "", set: p.$setProperties });
createProperty({ type: "string", object: p, name: "property", set: p.$setProperty });
createProperty({ type: "QtObject", object: p, name: "target", set: p.$setTarget });
createProperty({ type: "list", object: p, name: "targets", initialValue: [], set: p.$setTargets });
createProperty({ type: "real", object: p, name: "to" });

// ========== NumberAnimation ==========

p = QMLNumberAnimation.prototype = new QMLPropertyAnimation();

function QMLNumberAnimation(parent) {
    QMLPropertyAnimation.call(this, parent);
    var self = this;

    engine.$addTicker(ticker);

    function ticker(now, elapsed) {
        if ((self.running || self.$loop === -1) && !self.paused) { // this.$loop === -1 is a marker to just finish this run
            if (self.$at == 0 && self.$loop == 0 && !self.$actions.length)
                self.$redoActions();
            self.$at += elapsed / self.duration;
            if (self.$at >= 1)
                self.complete();
            else
                for (var i in self.$actions) {
                    var action = self.$actions[i],
                        newVal = self.easing.$valueForProgress(self.$at) * (action.to - action.from) + action.from;
                    action.target.$properties[action.property] = newVal;
                    if (action.target.$updateDirtyProperty)
                        action.target.$updateDirtyProperty(action.property, newVal);
                    action.target[action.property + "Changed"]();
                }
        }
    }
}

p.$at = 0;
p.$loop = 0,
p.complete = function() {
    for (var i in this.$actions) {
        var action = this.$actions[i];
        action.target.$properties[action.property] = action.to;
        if (action.target.$updateDirtyProperty)
            action.target.$updateDirtyProperty(action.property, action.to);
        action.target[action.property + "Changed"]();
    }
    engine.$requestDraw();

    if (++this.$loop == this.loops)
        this.running = false;
    else if (!this.running)
        this.$actions = [];
    else
        this.$startLoop();
}
p.$startLoop = function() {
    for (var i in this.$actions) {
        var action = this.$actions[i];
        action.from = action.from !== Undefined ? action.from : action.target[action.property];
    }
    this.$at = 0;
}
p.$setRunning = function(newVal) {
    this.$properties.running = newVal;
    if (newVal) {
        this.$startLoop();
        this.paused = false;
    } else if (this.alwaysRunToEnd && this.$at < 1) {
        this.$loop = -1; // -1 is used as a marker to stop
    } else {
        this.$loop = 0;
        this.$actions = [];
    }
};
createProperty({ type: "bool", object: p, name: "running", initialValue: false, set: p.$setRunning });

// ========== Behavior ==========

p = QMLBehavior.prototype = new QMLBaseObject();
p.$defaultProperty = "animation";
p.$targetProperty = null;
p.$setTargetProperty = function(newVal) {
    this.$targetProperty = newVal;
    this.$targetProperty.animation = newVal ? this.animation : null;
}
createProperty({ type: "Animation", object: p, name: "animation" });
createProperty({ type: "bool", object: p, name: "enabled", initialValue: true });
function QMLBehavior(parent) {
    QMLBaseObject.call(this, parent);

    this.animationChanged.connect(this, function(newVal) {
        newVal.target = this.$targetProperty.obj;
        newVal.property = this.$targetProperty.name;
        this.$targetProperty.animation = newVal ? this.animation : null;
    });
    this.enabledChanged.connect(this, function(newVal) {
        this.$targetProperty.animation = newVal ? this.animation : null;
    });
}


//------------DOM-only-Elements------------

p = QMLTextInput.prototype = new QMLItem();
createProperty({ type: "string", object: p, name: "text", initialValue: "" });
function QMLTextInput(parent) {
    QMLItem.call(this, parent);

    if (engine.renderMode == QMLRenderMode.Canvas) {
        console.log("TextInput-type is only supported within the DOM-backend.");
        return;
    }

    var self = this;

    this.font = new QMLFont(this);

    this.dom.innerHTML = "<input type=\"text\"/>"
    this.dom.firstChild.style.pointerEvents = "auto";
    // In some browsers text-inputs have a margin by default, which distorts
    // the positioning, so we need to manually set it to 0.
    this.dom.firstChild.style.margin = "0";
    this.dom.firstChild.style.width = "100%";

    this.accepted = Signal();

    this.Component.completed.connect(this, function() {
        this.implicitWidth = this.dom.firstChild.offsetWidth;
        this.implicitHeight = this.dom.firstChild.offsetHeight;
    });

    this.textChanged.connect(this, function(newVal) {
        this.dom.firstChild.value = newVal;
    });

    this.dom.firstChild.onkeydown = function(e) {
        if (e.keyCode == 13) //Enter pressed
            self.accepted();
    }

    function updateValue(e) {
        if (self.text != self.dom.firstChild.value) {
            self.text = self.dom.firstChild.value;
        }
    }

    this.dom.firstChild.oninput = updateValue;
    this.dom.firstChild.onpropertychanged = updateValue;
}

p = QMLButton.prototype = new QMLItem();
createProperty({ type: "string", object: p, name: "text", initialValue: "" });
function QMLButton(parent) {
    if (engine.renderMode == QMLRenderMode.Canvas) {
        console.log("Button-type is only supported within the DOM-backend. Use Rectangle + MouseArea instead.");
        QMLItem.call(this, parent);
        return;
    }

    this.dom = document.createElement("button");
    QMLItem.call(this, parent);
    var self = this;

    this.dom.style.pointerEvents = "auto";
    this.dom.innerHTML = "<span></span>";

    this.clicked = Signal();

    this.Component.completed.connect(this, function() {
        this.implicitWidth = this.dom.firstChild.offsetWidth + 20;
        this.implicitHeight = this.dom.firstChild.offsetHeight + 5;
    });
    this.textChanged.connect(this, function(newVal) {
        this.dom.firstChild.innerHTML = newVal;
        //TODO: Replace those statically sized borders
        this.implicitWidth = this.dom.firstChild.offsetWidth + 20;
        this.implicitHeight = this.dom.firstChild.offsetHeight + 5;
    });

    this.dom.onclick = function(e) {
        self.clicked();
    }
}

p = QMLTextArea.prototype = new QMLItem();
createProperty({ type: "string", object: p, name: "text", initialValue: "" });
function QMLTextArea(parent) {
    QMLItem.call(this, parent);

    if (engine.renderMode == QMLRenderMode.Canvas) {
        console.log("TextArea-type is only supported within the DOM-backend.");
        return;
    }

    var self = this;

    this.font = new QMLFont(this);

    this.dom.innerHTML = "<textarea></textarea>"
    this.dom.firstChild.style.pointerEvents = "auto";
    this.dom.firstChild.style.width = "100%";
    this.dom.firstChild.style.height = "100%";
    // In some browsers text-areas have a margin by default, which distorts
    // the positioning, so we need to manually set it to 0.
    this.dom.firstChild.style.margin = "0";


    this.Component.completed.connect(this, function() {
        this.implicitWidth = this.dom.firstChild.offsetWidth;
        this.implicitHeight = this.dom.firstChild.offsetHeight;
    });

    this.textChanged.connect(this, function(newVal) {
        this.dom.firstChild.value = newVal;
    });

    function updateValue(e) {
        if (self.text != self.dom.firstChild.value) {
            self.text = self.dom.firstChild.value;
        }
    }

    this.dom.firstChild.oninput = updateValue;
    this.dom.firstChild.onpropertychanged = updateValue;
}

p = QMLCheckbox.prototype = new QMLItem();
createProperty({ type: "string", object: p, name: "text" });
createProperty({ type: "bool", object: p, name: "checked" });
createProperty({ type: "color", object: p, name: "color" });
function QMLCheckbox(parent) {
    if (engine.renderMode == QMLRenderMode.Canvas) {
        console.log("CheckBox-type is only supported within the DOM-backend.");
        QMLItem.call(this, parent);
        return;
    }

    this.dom = document.createElement("label");
    QMLItem.call(this, parent);
    var self = this;

    this.font = new QMLFont(this);

    this.dom.innerHTML = "<input type=\"checkbox\"><span></span>";
    this.dom.style.pointerEvents = "auto";
    this.dom.firstChild.style.verticalAlign = "text-bottom";

    this.Component.completed.connect(this, function() {
        this.implicitHeight = this.dom.offsetHeight;
        this.implicitWidth = this.dom.offsetWidth;
    });
    this.textChanged.connect(this, function(newVal) {
        this.dom.children[1].innerHTML = newVal;
        this.implicitHeight = this.dom.offsetHeight;
        this.implicitWidth = this.dom.offsetWidth;
    });
    this.colorChanged.connect(this, function(newVal) {
        this.dom.children[1].style.color = newVal;
    });

    this.dom.firstChild.onchange = function() {
        self.checked = this.checked;
    };
}

})();
