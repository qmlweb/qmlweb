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

// Helpers

function QW_INHERIT(constructor, baseClass) {
    constructor.prototype = Object.create(baseClass.prototype);
    constructor.prototype.constructor = baseClass;
}

// var Qt = --> makes Qt not visible for external scripts.
// But we need it to be visible for some cases.
// So we declare Qt as global variable.

Qt = {
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
// evaluatingProperty = undefined,
evaluatingPropertyTop = undefined,
evaluatingPropertyStack = [],
evaluatingPropertyPaused = false,
evaluatingPropertyStackOfStacks = [],
// All object constructors
constructors = {
    int: QMLInteger,
    real: Number,
    double: Number,
    string: String,
    bool: Boolean,
    list: QMLList,
    color: QMLColor,
    enum: Number,
    url: String,
    variant: QMLVariant,
    'var': QMLVariant,
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
    FontLoader: QMLFontLoader,
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
    TextArea: QMLTextEdit, // non-standard, to be removed!
    TextEdit: QMLTextEdit,
    CheckBox: QMLCheckbox,
    Video:    QMLVideo
};

// mix of engine.loadQML and Loader.qml
// THINK now we force to provide executionContext. Maybe it is better to compute if from parent if not provided?
Qt.createQmlObject = function( src, parent, file, executionContext )
{
        var tree = parseQML(src, file);

        // Create and initialize objects

        var component = new QMLComponent({ object: tree, parent: parent, context: executionContext });
        
        engine.loadImports( tree.$imports );
        //component.$basePath = engine.$basePath;
        
        if (!file) file = Qt.resolvedUrl("createQmlObject_function");
        component.$basePath = engine.extractBasePath( file );
        component.$imports = tree.$imports; // for later use
        component.$file = file; // not just for debugging, but for basepath too, see above
    
        var obj = component.createObject(parent);
        obj.parent = parent;
        parent.childrenChanged();
        
        // engine.$initializePropertyBindings();

        if (engine.operationState !== QMLOperationState.Init && engine.operationState !== QMLOperationState.Idle) {
          // We don't call those on first creation, as they will be called
          // by the regular creation-procedures at the right time.
          engine.$initializePropertyBindings();
          engine.callCompletedSignals();
          /*
          function callOnCompleted(child) {
            child.Component.completed();
            for (var i = 0; i < child.children.length; i++)
               callOnCompleted(child.children[i]);
          }
      
          callOnCompleted(obj);
          */
        }

        return obj;
}

// Load file, parse and construct as Component (.qml)
//FIXME: remove the parameter executionContext and get it autonomously.
Qt.createComponent = function(name, executionContext)
{
    if (name in engine.components) {
        // user specified context? => should create copy of component with new context
        /*
        if (executionContext) {
            var newComponentInstance = Object.create( engine.components[name] );
            newComponentInstance.$context = executionContext;
            return newComponentInstance;        
        }
        */
        // no context, may return cached object.
        return engine.components[name];
    }
        
    var nameIsUrl = name.indexOf("//") >= 0 || name.indexOf(":/") >= 0; // e.g. // in protocol, or :/ in disk urls (D:/)
    
    // Do not perform path lookups if name starts with @ sign.
    // This is used when we load components from qmldir files
    // because in that case we do not need any lookups.
    // INFO we keep original name to later use it as cache key (engine.components)
    var origName = name;
    if (name.length > 0 && name[0] == "@") {
      nameIsUrl = true;
      name = name.substr( 1,name.length-1 );
    }

    var file = nameIsUrl ? name : engine.$basePath + name;

    var src = getUrlContents(file,true);
    
    // if failed to load, and provided name is not direct url, try to load from dirs in importPathList()
    if (src===false && !nameIsUrl) {
        var moredirs = engine.importPathList();
   
        for (var i=0; i<moredirs.length; i++) {
          file = moredirs[i] + name;
          src = getUrlContents(file,true);
          if (src !== false) break;
        }
    }

    if (src === false)
       return undefined;
   
    var tree = parseQML(src, file);

    if (tree.$children.length !== 1)
        console.error("A QML component must only contain one root element!");
       
    var component = new QMLComponent({ object: tree, context: executionContext });
    component.$basePath = engine.extractBasePath( file );

    component.$imports = tree.$imports;
    component.$file = file; // just for debugging
    
    engine.loadImports( tree.$imports,component.$basePath );

    engine.components[origName] = component;
    return component;
}

// Returns url resolved relative to the URL of the caller.
// http://doc.qt.io/qt-5/qml-qtqml-qt.html#resolvedUrl-method
Qt.resolvedUrl = function(url)
{

  if (!url || !url.substr) // url is not a string object
    return url;

  // must check for cases: D:/, file://, no slash at all. If some of them occurs, keep url.
  if (url == "" || url.indexOf(":/") != -1 || url.indexOf("://") != -1 || url.indexOf("/") == 0)
    return engine.removeDotSegments( url );
    
  // we have $basePath variable placed in context of "current" document
  // this is done in construct() function

  // let's go to the callers and inspect their arguments
  // The 2-nd argument of the callers we hope is context object
  // e.g. see calling signature of bindings and signals 

  // Actually Qt cpp code is doing the same; the difference is that they know calling context
  // https://qt.gitorious.org/qt/qtdeclarative/source/eeaba26596d447c531dfac9d6e6bf5cfe4537813:src/qml/qml/v8/qqmlbuiltinfunctions.cpp#L833

  var detectedBasePath = "";
  var currentCaller = Qt.resolvedUrl.caller;
  var maxcount = 10;
  while (maxcount-- > 0 && currentCaller) {
    if (currentCaller.arguments[1] && currentCaller.arguments[1]["$basePath"])
    {
      detectedBasePath = currentCaller.arguments[1]["$basePath"];
      break;
    }
    currentCaller = currentCaller.caller;
  }

  return engine.removeDotSegments( detectedBasePath + url )
}

/**
 * Compile binding. Afterwards you may call binding.eval to evaluate.
 */
QMLBinding.prototype.compile = function() {
    var bindSrc;
    
    if (this.function) {
      // this is old behaviour
      // bindSrc = "(function(__executionObject, __executionContext) { with(__executionContext) with(__executionObject) " + this.src + "})"
      
      // this is new, with additional scope for "var" operators inside this.src.
      // Explanation. Those operators may declare variables with same names as in __executionContext or __executionObject.
      // This is why we need one more layer of scope.

      /* Test 1. What we do not want to occur.
         var s = { x:3 }
         with (s) { var x = 7; }
         console.log(s); 
         // output: 7. this is bad!

         Test 2. What we actually need.
         
         var s = { x:3 }
         with (s) { (function() { var x = 5; })() }
         console.log(s); 
         // output: 3. this is good!
         
         Test 3. We need this too.

         var s = { x:3 }
         with (s) { (function() { x = 5; })() }
         console.log(s); 
         //output: 5. good!
         
      */

      //var s = "return (function(){"+this.src+"})()";
      //bindSrc = "(function(__executionObject, __executionContext) { with(__executionContext) with(__executionObject) " + s + "})"

      bindSrc = [
        "(function(__executionObject, __executionContext) { with(__executionContext) with(__executionObject) ",
        "return (function(){",
        this.src,
        "})()",
        "})"
      ].join("");
      
    }
    else
    {
      // bindSrc = "(function(__executionObject, __executionContext) { with(__executionContext) with(__executionObject) return " + this.src + "})";
      bindSrc = [
        "(function(__executionObject, __executionContext) { with(__executionContext) with(__executionObject) return ",
        this.src,
        "})"
      ].join("");
    }

    /* 
    var bindSrc = this.function
                    ? "(function(__executionObject, __executionContext) { with(__executionContext) with(__executionObject) " + this.src + "})"
                    : "(function(__executionObject, __executionContext) { with(__executionContext) with(__executionObject) return " + this.src + "})";
    */                 
    this.eval = eval(bindSrc);
}

/**
 * QML Object constructor.
 * @param {Object} meta Meta information about the object and the creation context
 * @return {Object} New qml object
 */
function construct(meta) {
    var item,
        component;

    // QtCore.js build-in class?
    if (meta.object.$class in constructors) {
        item = new constructors[meta.object.$class](meta);
    } 
    else {
      // Load component from file. Please look at import.js for main notes.

      // Actually, we have to use that order:
      // 1) try to load component from current basePath 
      // 2) from importPathList 
      // 3) from directories in imports statements and then 
      // 4) from qmldir files

      // Currently we support only 1,2 and 4 and use order: 4,1,2
      // TODO: engine.qmldirs is global for all loaded components. That's not qml's original behaviour.
 
      var qdirInfo = engine.qmldirs[ meta.object.$class ]; // Are we have info on that component in some imported qmldir files?
      if (qdirInfo) {
          // We have that component in some qmldir, load it from qmldir's url // 4
          component = Qt.createComponent( "@" + qdirInfo.url,meta.context );
      }
      else
          component = Qt.createComponent(meta.object.$class + ".qml",meta.context ); // 1,2

      if (component) {
        var item = component.createObject(meta.parent);
        
        // Alter objects context to the outer context
        item.$context = meta.context;
        
        if (engine.renderMode == QMLRenderMode.DOM)
            item.dom.className += " " + meta.object.$class + (meta.object.id ? " " + meta.object.id : "");
        var dProp; // Handle default properties
      } else {
          console.log("No constructor found for " + meta.object.$class);
          return;
      }
    }

    // id
    if (meta.object.id) {
        // we have to call `delete` before setting new value to context
        // because it may contain some object property with defined setter
        // in that case our assign will invoke that setter, and thus we will break some external object property!

        /// delete meta.context[meta.object.id]; 
        /// meta.context[meta.object.id] = item;

        // PROBLEM
        // we cannot just delete value from context, because it may contain setters/getters from prototype context's
        // which are not deleted by `delete`

        // SOLUTION
        // we declare new getter and empty setter. seems it is ok.

        setupGetterSetter( meta.context, meta.object.id, function() { return item }, function() {} );
    }

    // keep path in item for probale use it later in Qt.resolvedUrl 
    item.$context["$basePath"] = engine.$basePath; //gut

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
        try {
          pushEvalStack();
          for (var i in connectedSlots)
              connectedSlots[i].slot.apply(connectedSlots[i].thisObj, arguments);
        } finally {
          popEvalStack();
        }
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

        // Notify object of connect
        if (options.obj && options.obj.$connectNotify) {
            options.obj.$connectNotify(options);
        }
    }
    signal.disconnect = function() {
        // 1 = function  2 = string  3 = object with string method  4 = object with function
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

        // Notify object of disconnect
        if (options.obj && options.obj.$disconnectNotify) {
            options.obj.$disconnectNotify(options);
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
QMLSignal = Signal; // Export as QMLSignal

/**
 * Create property getters and setters for object.
 * @param {Object} obj Object for which gsetters will be set
 * @param {String} propName Property name
 * @param {Object} [options] Options that allow finetuning of the property
 */
function createSimpleProperty(type, obj, propName) {
    var prop = new QMLProperty(type, obj, propName);

    obj[propName + "Changed"] = prop.changed;
    obj.$properties[propName] = prop;
    var getter = function() {
        return obj.$properties[propName].get();
    };
    var setter = function(newVal) {
        return obj.$properties[propName].set(newVal, QMLProperty.ReasonUser);
    };
    setupGetterSetter(obj, propName, getter, setter);
    if (obj.$isComponentRoot) {
        setupGetterSetter(obj.$context, propName, getter, setter);
        //if (obj.$context.__proto__)
        //  setupGetterSetter(obj.$context.__proto__, propName, getter, setter);
    }
}

function QMLProperty(type, obj, name) {
    this.obj = obj;
    this.name = name;
    this.changed = Signal([], {obj:obj});
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
QMLProperty.ReasonAnimtation = 2;

function pushEvalStack() {
  evaluatingPropertyStackOfStacks.push( evaluatingPropertyStack );
  evaluatingPropertyStack = [];
  evaluatingPropertyTop = undefined;
//  console.log("evaluatingPropertyTop=>undefined due to push stck ");
}

function popEvalStack() {
  evaluatingPropertyStack = evaluatingPropertyStackOfStacks.pop() || [];
  evaluatingPropertyTop = evaluatingPropertyStack[ evaluatingPropertyStack.length-1 ];
}

function pushEvaluatingProperty( prop ) {
    // TODO say warnings if already on stack. This means binding loop. BTW actually we do not loop because needsUpdate flag is reset before entering update again.
    if (evaluatingPropertyStack.indexOf( prop ) >= 0) {
      console.error("Property binding loop detected for property ",prop.name, [prop].slice(0));
      debugger;
    }

    evaluatingPropertyTop = prop; 
    evaluatingPropertyStack.push( prop ); //keep stack of props
    //console.log("pushed to evaluatingPropertyStack = ",prop.name, evaluatingPropertyStack.slice(0) );
}

function popEvaluatingProperty() {

    evaluatingPropertyStack.pop();
    evaluatingPropertyTop = evaluatingPropertyStack[ evaluatingPropertyStack.length-1 ];
    /*
    //console.log("popped from evaluatingPropertyStack = ",evaluatingPropertyStack.slice(0) );
    if (evaluatingPropertyStack.length == 0) {
      evaluatingPropertyTop = undefined;
    }
    else
      evaluatingPropertyTop = evaluatingPropertyStack[ evaluatingPropertyStack.length-1 ];
    */
}

// Updater recalculates the value of a property if one of the
// dependencies changed
QMLProperty.prototype.update = function() {
    this.needsUpdate = false;
    
    if (!this.binding)
        return;

    var oldVal = this.val;
    try {
      pushEvaluatingProperty(this);

	    if (!this.binding.eval) 
	      this.binding.compile();
	    this.val = this.binding.eval(this.objectScope, this.componentScope);

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

    if (this.val !== oldVal)
        this.changed(this.val, oldVal, this.name);
        

}

// Define getter
QMLProperty.prototype.get = function() {
    //if (this.needsUpdate && !evaluatingPropertyPaused) {
    if (this.needsUpdate && engine.operationState !== QMLOperationState.Init) {
      this.update();
    }

    // If this call to the getter is due to a property that is dependant on this
    // one, we need it to take track of changes
    if (evaluatingPropertyTop && !this.changed.isConnected(evaluatingPropertyTop, QMLProperty.prototype.update)) {
         //console.log( "connecting property to dependency top! this=", this.name, evaluatingPropertyTop.name, "thisobj=",[this].slice(0),"topobj=",evaluatingPropertyStack.slice(0), "this val=",[this.val].slice(0) );
        this.changed.connect(evaluatingPropertyTop, QMLProperty.prototype.update);
    }

    return this.val;
}

// Define setter
QMLProperty.prototype.set = function(newVal, reason, objectScope, componentScope) {
    var i,
        oldVal = this.val;

    if (newVal instanceof QMLBinding) {
        if (!objectScope || !componentScope)
            throw "Internal error: binding assigned without scope";
        this.binding = newVal;
        this.objectScope = objectScope;
        this.componentScope = componentScope;

        if (engine.operationState !== QMLOperationState.Init) {
            if (!newVal.eval)
                newVal.compile();
                
            try {
              pushEvaluatingProperty(this);
                
              this.needsUpdate = false;
              newVal = this.binding.eval(objectScope, componentScope);
            } finally { // for try
              popEvaluatingProperty();
            }
        } else {
            engine.bindedProperties.push(this);
            return;
        }
    } else {
        if (reason != QMLProperty.ReasonAnimation)
            this.binding = null;
        if (newVal instanceof Array)
            newVal = newVal.slice(); // Copies the array
    }

    if (constructors[this.type] == QMLList) {
        this.val = QMLList({ object: newVal, parent: this.obj, context: componentScope });
    } else if (newVal instanceof QMLMetaElement) {
        if (constructors[newVal.$class] == QMLComponent || constructors[this.type] == QMLComponent)
            this.val = new QMLComponent({ object: newVal, parent: this.obj, context: componentScope });
        else
            this.val = construct({ object: newVal, parent: this.obj, context: componentScope });
    } else if (newVal instanceof Object || newVal === undefined) {
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
        if (this.obj.$syncPropertyToRemote instanceof Function && reason == QMLProperty.ReasonUser) { // is a remote object from e.g. a QWebChannel
            this.obj.$syncPropertyToRemote(this.name, newVal);
        } else {
            this.changed(this.val, oldVal, this.name);
        }
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
 * Apply properties from metaObject to item.
 * @param {Object} metaObject Source of properties
 * @param {Object} item Target of property apply
 * @param {Object} objectScope Scope in which properties should be evaluated
 * @param {Object} componentScope Component scope in which properties should be evaluated
 */
function applyProperties(metaObject, item, objectScope, componentScope) {
    var i;
    objectScope = objectScope || item;
    for (i in metaObject) {
        var value = metaObject[i];
        if (i == "id" || i == "$class") { // keep them
          item[i] = value;
          continue;
          //debugger;
        } 
        
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
                value.src = "(function(" + params + ") {" + value.src + "})";
                value.function = false;
                value.compile();
            }
            item[signalName].connect(item, value.eval(objectScope, componentScope));
            continue;
        }

        if (value instanceof Object) {
            if (value instanceof QMLSignalDefinition) {
                item[i] = Signal(value.parameters);
                if (item.$isComponentRoot)
                    componentScope[i] = item[i]; // BUG? might be here, if componentScope contains property with same name and a setter func. Must reset getter-setter, see construct function.
                continue;
            } else if (value instanceof QMLMethod) {
                value.compile();
                item[i] = value.eval(objectScope, componentScope);
                if (item.$isComponentRoot)
                    componentScope[i] = item[i];
                continue;
            } else if (value instanceof QMLAliasDefinition) {
                // TODO: 1. Alias must be able to point to prop or id of local object,eg: property alias q: t
                //       2. Alias may have same name as id it points to: property alias someid: someid
                //       3. Alias proxy (or property proxy) to proxy prop access to selected incapsulated object. (think twice).
                createSimpleProperty("alias", item, i);
                item.$properties[i].componentScope = componentScope;
                item.$properties[i].val = value;

                item.$properties[i].get = function() {
                    var obj = this.componentScope[this.val.objectName];
                    return this.val.propertyName ? obj.$properties[this.val.propertyName].get() : obj;
                }
                item.$properties[i].set = function(newVal, reason, objectScope, componentScope) {
                    if (!this.val.propertyName)
                        throw "Cannot set alias property pointing to an QML object.";
                    this.componentScope[this.val.objectName].$properties[this.val.propertyName].set(newVal, reason, objectScope, componentScope);
                }
                
                if (value.propertyName) {
                  var con = function(prop) {
                    var obj = prop.componentScope[prop.val.objectName];
                    if (!obj) {
                      console.error("qtcore: target object ",prop.val.objectName," not found for alias ",prop );
                    }
                    else
                    {
                      var targetProp = obj.$properties[prop.val.propertyName];
                      if (!targetProp) {
                        console.error("qtcore: target property [",prop.val.objectName,"].",prop.val.propertyName," not found for alias ",prop.name );
                      }
                      else
                        targetProp.changed.connect( prop.changed );
                     }
                  }                
                  engine.pendingOperations.push( [con,item.$properties[i]] );
                }

                continue;
            } else if (value instanceof QMLPropertyDefinition) {
                createSimpleProperty(value.type, item, i);
                item.$properties[i].set(value.value, QMLProperty.ReasonInit, objectScope, componentScope);
                continue;
            } else if (item[i] && value instanceof QMLMetaPropertyGroup) {
                // Apply properties one by one, otherwise apply at once
                applyProperties(value, item[i], objectScope, componentScope);
                continue;
            }
        }
        if (item.$properties && i in item.$properties)
            item.$properties[i].set(value, QMLProperty.ReasonInit, objectScope, componentScope);
        else if (i in item)
            item[i] = value;
        else if (item.$setCustomData)
            item.$setCustomData(i, value);
        else
            console.warn("Cannot assign to non-existent property \"" + i + "\". Ignoring assignment.");
    }
    if (metaObject.$children && metaObject.$children.length !== 0) {
        if (item.$defaultProperty)
            item.$properties[item.$defaultProperty].set(metaObject.$children, QMLProperty.ReasonInit, objectScope, componentScope);
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

    // List of operations to perform later after init. For internal use only.
    this.pendingOperations = [];

    // Root object of the engine
    this.rootObject = null;

    // Base path of qml engine (used for resource loading)
    this.$basePath = "";
    
    // Cache of content of loaded qmldir files. Used in engine.loadImports method.
    // We init it with blank content of QtQuick module, because Qmlweb by default provides all the things from QtQuick.
    this.qmldirsContents = { "QtQuick":{} };


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

    this.extractBasePath = function( file ) {
        var basePath = file.split(/[\/\\]/); // work both in url ("/") and windows ("\", from file://d:\test\) notation
        if (file.indexOf("https://gist.github.com") >= 0) {
          // we have next types of urls in gist:
          // https://gist.github.com/pavelvasev/d41aa7cedaf35d5d5fd1
          // -> in this case must keep all file url as basePath
          // https://gist.github.com/pavelvasev/d41aa7cedaf35d5d5fd1#file-apasha2-vl
          // -> in this case must forget the "#file-apasha2-vl" part
          basePath[basePath.length - 1] = basePath[basePath.length - 1].split("#")[0];
          // and then, we have to attach "/raw/"
          basePath[basePath.length - 1] = basePath[basePath.length - 1] + "/raw/";
        }
        else
          basePath[basePath.length - 1] = ""; // just forget the file part
        basePath = basePath.join("/");
        return basePath;
    }

    this.callCompletedSignals = function () {
        while (this.completedSignals.length > 0) {
           var h = this.completedSignals.splice(0,1); // remove first handler from list and put it to `h`
           h[0](); // call first handler
        }
        /*
        for (var i in this.completedSignals) {
            this.completedSignals[i]();
        }
        */
    }

    // Load file, parse and construct (.qml or .qml.js)
    this.loadFile = function(file) {
        this.$basePath = this.extractBasePath( file );

        var src = getUrlContents(file);
        if (options.debugSrc) {
            options.debugSrc(src);
        }
        this.loadQML(src,file);
    }
    // parse and construct qml
    this.loadQML = function(src,file) { // file is not required; only for debug purposes
        engine = this;
        var tree = parseQML(src, file);
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

        this.$initializePropertyBindings();
        
        this.start();
        
        // Call completed signals
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
      engine.loadImports() - load qmldir files from `import` statements. Please look at import.js for main notes.

        * `importsArray` is in parser notation, e.g. [import1, import2, ...] where each importN is also array: ["qmlimport","name",version,as,isQualifiedName]
        * `currentFileDir` is a base dir for imports lookup (it will be used together with importPathList())

      As a result, loadImports stores component names and urls from qmldir files in engine.qmldir variable
      engine.qmldir is a hash of form: { componentName => { url } }
      Later, engine.qmldir is used in construct() function for components lookup.

      TODO We have to keep results in component scope. 
           We have to add module "as"-names to component's names (which is possible after keeping imports in component scope).
    */
    
    this.loadImports = function(importsArray, currentFileDir) { 
      if (!engine.qmldirsContents) engine.qmldirsContents = {}; // cache
      if (!engine.qmldirs) engine.qmldirs = {};                 // resulting components lookup table
    
      if (!importsArray || importsArray.length == 0) return;
      if (!currentFileDir) currentFileDir = this.$basePath;     // use engine.$basePath by default
      
      for (var i=0; i<importsArray.length; i++) {
        var entry = importsArray[i];
        
        var name = entry[1];

        var nameIsUrl = name.indexOf("//") == 0 || name.indexOf("://") >= 0;  // is it url to remote resource
        var nameIsQualifiedModuleName = entry[4]; // e.g. QtQuick, QtQuick.Controls, etc
        var nameIsDir = !nameIsQualifiedModuleName && !nameIsUrl; // local [relative] dir

        if (nameIsDir) {
            // resolve name from relative to full dir path
            // we hope all dirs are relative
            if (currentFileDir && currentFileDir.length > 0)
              name = this.removeDotSegments( currentFileDir + name );
            if (name[ name.length-1 ] == "/") 
              name = name.substr( 0, name.length-1 ); // remove trailing slash as it required for `readQmlDir` 
        }
        // TODO if nameIsDir, we have also to add `name` to importPathList() for current component...
        
        // check if we have already loaded that qmldir file
        if (engine.qmldirsContents[ name ]) continue;
        
        var content = false; 

        if (nameIsQualifiedModuleName && this.userAddedModulePaths && this.userAddedModulePaths[ name ]) {
          // 1. we have qualified module and user had configured path for that module with engine.addModulePath
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
          var probableDirs = [currentFileDir].concat( engine.importPathList() ) 
          var diredName = name.replace( /\./g,"/" );
        
          for (var k=0; k<probableDirs.length; k++) {
            var file = probableDirs[k] + diredName;
            content = readQmlDir( file );
            if (content) break;
          }
        }

        if (!content) { 
          console.log("cannot load imports for ",name );
          // save blank info, meaning that we failed to load import
          // this prevents repeated lookups
          engine.qmldirsContents[ name ] = {};

          // NEW
          // add that dir to import path list
          // that means, lookup qml files in that dir by trying to load them directly
          // this is not the same behavior as in Qt for "url" schemes,
          // but it is same as for ordirnal disk files. 
          // So, we do it for experimental purposes.
          if (nameIsDir) /// || nameIsUrl
            engine.addImportPath( name + "/" );

          continue;
        }
        
        // copy founded externals to global var
        // TODO actually we have to copy it to current component
        for (var attrname in content.externals) { engine.qmldirs[attrname] = content.externals[attrname]; }

        // keep already loaded qmldir files
        engine.qmldirsContents[ name ] = content;
      }

    }

    this.registerProperty = function(obj, propName) // SEEMS NOT USED
    {
        var dependantProperties = [];
        var value = obj[propName];
        console.log("!!!!!!!!!!!!!!!!!!!! registerProperty");

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

    this.$initializePropertyBindings = function() {
        // Initialize property bindings
        // console.log("$$$$$$$$$$$$$$$ $initializePropertyBindings, this.bindedProperties.length = ",this.bindedProperties.length);
        
//        console.trace();
        //for (var i = 0; i < this.bindedProperties.length; i++) {
        // we use `while`, because $initializePropertyBindings may be called recursive (because of Loader and/or createQmlObject )

        while (this.bindedProperties.length > 0) {
            var property = this.bindedProperties.splice(0,1) [0];
            if (!property.binding)
                continue; // Probably, the binding was overwritten by an explicit value. Ignore.
            if (property.needsUpdate)
                property.update();
            else
            if (["width","height","fill","x","y","left","right","top","bottom"].indexOf(property.name) >= 0) {
               // It is possible that bindings with these names was already evaluated during eval of other bindings
               // but in that case updateHGeometry and updateVGeometry could be blocked during their eval.
               // So we call them explicitly, just in case.
               
               if (property.changed.isConnected(property.obj, updateHGeometry))
                  updateHGeometry.apply( property.obj,[property.val, property.val, property.name] );
               if (property.changed.isConnected(property.obj, updateVGeometry))
                  updateVGeometry.apply( property.obj,[property.val, property.val, property.name] );                  
            }    
        }
        //this.bindedProperties = [];
        
        this.$initializeAliasSignals();
        //console.log("$$$$$$$$$$$$$$$ $initializePropertyBindings complete");
    }

    this.$initializeAliasSignals = function() {
        // Perform pending operations. Now we use it only to init alias's "changed" handlers, that's why we have such strange function name.
        //for (var i = 0; i < this.pendingOperations.length; i++) {
        while (this.pendingOperations.length > 0) {
            var op = this.pendingOperations.splice(0,1)[0];
            op[0]( op[1], op[2], op[3] );
        }
        this.pendingOperations = [];
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
        if (file == "" || file.indexOf("://") != -1 || file.indexOf("/") == 0 || file.indexOf("data:") == 0 || file.indexOf("blob:") == 0) {
            return file;
        }
        return this.$basePath + file;
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

    // Requests draw in case something has probably changed.
    this.$requestDraw = function()
    {
        isDirty = true;
    }

    // Performance measurements
    this.$perfDraw = function(canvas)
    {
        this.rootObject.$draw(canvas);
    }

    this.$draw = function()
    {
        if (this.renderMode != QMLRenderMode.Canvas)
            return;
        var time = new Date();

        element.height = this.rootObject.height;
        element.width = this.rootObject.width;

        // Pixel-perfect size
//         canvasEl.style.height = canvasEl.height + "px";
//         canvasEl.style.width = canvasEl.width + "px";

        this.rootObject.$draw(canvas);

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

    var // Callbacks for stopping or starting the engine
        whenStop = [],
        whenStart = [],
        // Ticker resource id and ticker callbacks
        tickerId,
        tickers = [],
        lastTick = new Date().getTime(),
        // isDirty tells if we should do redraw
        isDirty = true,
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

    // TODO: Move to module initialization
    for (i in constructors) {
        if (constructors[i].getAttachedObject)
            setupGetter(QMLBaseObject.prototype, i, constructors[i].getAttachedObject);
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

function QMLInteger(val) {
    return (val|0);
}

function QMLVariant(val) {
    return val;
}

// TODO
function QMLColor(val) {
    if (typeof(val)==="number")
    {
       // we assume it is int value and must be converted to css hex with padding
       // http://stackoverflow.com/questions/57803/how-to-convert-decimal-to-hex-in-javascript
       val = "#" + (Math.round(val)+0x1000000).toString(16).substr(-6).toUpperCase();
    }
    else
    if (typeof(val)==="array" && val.length >= 3) {
       // array like [r,g,b] where r,g,b are in 0..1 range
       var m = 255;
       val = "rgb("+Math.round(m*val[0])+","+Math.round(m*val[1])+","+Math.round(m*val[2])+")";
    }

    return val;
}

function QMLList(meta) {
    var list = [];
    if (meta.object instanceof Array)
        for (var i in meta.object)
            list.push(construct({object: meta.object[i], parent: meta.parent, context: meta.context }));
    else if (meta.object instanceof QMLMetaElement)
        list.push(construct({object: meta.object, parent: meta.parent, context: meta.context }));

    return list;
}

function QMLContext() {
    this.nameForObject = function(obj) {
        for (var name in this) {
            if (this[name] == obj)
                return name;
        }
    }
}

QMLComponent.getAttachedObject = function() { // static
    if (!this.$Component) {
        this.$Component = new QObject(this);
        this.$Component.completed = Signal([]);
        this.$Component.destruction = Signal([]);        
        engine.completedSignals.push(this.$Component.completed);
    }
    return this.$Component;
}

// componentContext is not necessary
QMLComponent.prototype.createObject = function(parent, properties, componentContext ) {
    var oldState = engine.operationState;
    engine.operationState = QMLOperationState.Init;
    
    // change base path to current component base path

    var bp = engine.$basePath; // this is old engine.$basePath = this.$basePath ? this.$basePath : engine.$basePath;
    
    // the logic of finding basepath is tricky
    // 1 check own component property $basePath
    // 2 if (1) failed, try lookup in context
    engine.$basePath = this.$basePath || (this.$context ? this.$context.$basePath : null) || engine.$basePath;
    
    // `componentContext` param is a feature for optimization
    // sometimes we do not want to keep context in component
    // because it may be 'blank' component from cache (see createComponent method)
    // so we introduce `componentContext` param for override component context
    
    if (!componentContext) componentContext = this.$context;

    var objectContext = componentContext ? Object.create(componentContext) : new QMLContext();

    /* debugging. must define _uniqueId method. see https://gist.github.com/pavelvasev/1d37390dfdd2dcba24ac#file-uniq-js
    if (componentContext)
       objectContext._parentUniqueId = componentContext._uniqueId;
     objectContext.__uniqueId = undefined;
     console.log("created context ",objectContext._uniqueId,objectContext, "from componentContext",objectContext._parentUniqueId, componentContext);
    */
    
    var item = construct({
        object: this.$metaObject,
        parent: parent,
        context: objectContext,
        isComponentRoot: true
    });
    // change base path back
    engine.$basePath = bp;

    engine.operationState = oldState;

    return item;
}
function QMLComponent(meta) {
    if (constructors[meta.object.$class] == QMLComponent)
        this.$metaObject = meta.object.$children[0];
    else
        this.$metaObject = meta.object;
    this.$context = meta.context;
}

// Base object for all qml thingies
QObject = function(parent) {
    this.$parent = parent;
    if (parent && parent.$tidyupList)
        parent.$tidyupList.push(this);
    // List of things to tidy up when deleting this object.
    this.$tidyupList = [];
    this.$properties = {};

    this.$delete = function() {
        if (this.$Component)
          this.$Component.destruction();
        
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

        this.parent = undefined; // must do this. => 1) parent will be notified and erase object from it's children. 2) DOM node will be removed.
    }
    
    // must have `destroy` method
    // http://doc.qt.io/qt-5/qtqml-javascript-dynamicobjectcreation.html
    this.destroy = this.$delete;    
}
QObject.createSimpleProperty = createSimpleProperty;

// Base object for all qml elements
QW_INHERIT(QMLBaseObject, QObject);
function QMLBaseObject(meta) {
    QObject.call(this, meta.parent);
    var i,
        prop;

    this.$draw = function(){};
    this.$isComponentRoot = meta.isComponentRoot;
    this.$context = meta.context;
}

function updateHGeometry(newVal, oldVal, propName) {
    var anchors = this.anchors || this;

    if (this.$updatingGeometry) {
        return;
    }
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
        if (this.parent && !this.parent.$properties.left.changed.isConnected(this, updateHGeometry))
            this.parent.$properties.left.changed.connect(this, updateHGeometry);

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
        tM = anchors.topMargin || anchors.margins,
        bM = anchors.bottomMargin || anchors.margins;

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
        height = t.height - tM - bM;
        y = t.top - (this.parent ? this.parent.top : 0) + tM;
        top = t.top + tM;
        bottom = t.bottom - bM;
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
        if (this.parent && !this.parent.$properties.top.changed.isConnected(this, updateVGeometry))
            this.parent.$properties.top.changed.connect(this, updateVGeometry);

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
QW_INHERIT(QMLItem, QMLBaseObject);
function QMLItem(meta) {
    QMLBaseObject.call(this, meta);
    var child,
        o, i;

    if (engine.renderMode == QMLRenderMode.DOM) {
        if (this.$parent === null) { // This is the root element. Initialize it.
            this.dom = engine.rootElement || document.body;
            this.dom.innerHTML = "";
            var self = this;
            this.dom.style.position = "relative"; // Needed to make absolute positioning work
            this.dom.style.top = "0";
            this.dom.style.left = "0";
            this.dom.style.overflow = "hidden"; // No QML stuff should stand out the root element
        } else {
            if (!this.dom) { // Create a dom element for this item.
                /* If some Item-based component want's to hold itself in html tag different than "div",
                   it can specify desired tag name:
                   ```
                   property var htmlTagName: "fieldset"
                   ```
                */
                var tagName = meta.object.htmlTagName ? meta.object.htmlTagName.value : undefined;
                this.dom = document.createElement( tagName || "div" );
            }
            this.dom.style.position = "absolute";
        }
        this.dom.style.pointerEvents = "none";
        this.dom.className = meta.object.$class + (this.id ? " " + this.id : "");
        this.css = this.dom.style;
    }
    createSimpleProperty("list", this, "data");
    this.$defaultProperty = "data";
    createSimpleProperty("list", this, "children");
    createSimpleProperty("list", this, "resources");
    createSimpleProperty("Item", this, "parent");
    this.children = [];
    this.resources = [];
    this.parentChanged.connect(this, function(newParent, oldParent) {
        if (oldParent) {
            oldParent.children.splice(oldParent.children.indexOf(this), 1);
            oldParent.childrenChanged();
            if (engine.renderMode == QMLRenderMode.DOM)
                oldParent.dom.removeChild(this.dom);
        }
        if (newParent && newParent.children.indexOf(this) == -1) {
            newParent.children.push(this);
            newParent.childrenChanged();
        }
        if (newParent && engine.renderMode == QMLRenderMode.DOM)
            newParent.dom.appendChild(this.dom);
    });
    this.parentChanged.connect(this, updateHGeometry);
    this.parentChanged.connect(this, updateVGeometry);
    this.dataChanged.connect(this, function(newData) {
        for (var i in newData) {
            var child = newData[i];
            if (child.hasOwnProperty("parent")) // Seems to be an Item. TODO: Use real inheritance and ask using instanceof.
                child.parent = this; // This will also add it to children.
            else
                this.resources.push(child);
        }
    });
    
    createSimpleProperty("real", this, "x");
    createSimpleProperty("real", this, "y");
    createSimpleProperty("real", this, "width");
    createSimpleProperty("real", this, "height");
    createSimpleProperty("real", this, "implicitWidth");
    createSimpleProperty("real", this, "implicitHeight");
    createSimpleProperty("real", this, "left");
    createSimpleProperty("real", this, "right");
    createSimpleProperty("real", this, "top");
    createSimpleProperty("real", this, "bottom");
    createSimpleProperty("real", this, "horizontalCenter");
    createSimpleProperty("real", this, "verticalCenter");
    createSimpleProperty("real", this, "rotation");
    createSimpleProperty("real", this, "scale");
    createSimpleProperty("real", this, "z");
    createSimpleProperty("list", this, "transform");
    createSimpleProperty("bool", this, "visible");
    createSimpleProperty("real", this, "opacity");
    createSimpleProperty("bool", this, "clip");
    this.xChanged.connect(this, updateHGeometry);
    this.yChanged.connect(this, updateVGeometry);
    this.widthChanged.connect(this, updateHGeometry);
    this.heightChanged.connect(this, updateVGeometry);
    this.implicitWidthChanged.connect(this, updateHGeometry);
    this.implicitHeightChanged.connect(this, updateVGeometry);

    this.$isUsingImplicitWidth = true;
    this.$isUsingImplicitHeight = true;

    this.anchors = new QObject(this);
    createSimpleProperty("real", this.anchors, "left");
    createSimpleProperty("real", this.anchors, "right");
    createSimpleProperty("real", this.anchors, "top");
    createSimpleProperty("real", this.anchors, "bottom");
    createSimpleProperty("real", this.anchors, "horizontalCenter");
    createSimpleProperty("real", this.anchors, "verticalCenter");
    createSimpleProperty("real", this.anchors, "fill");
    createSimpleProperty("real", this.anchors, "centerIn");
    createSimpleProperty("real", this.anchors, "margins");
    createSimpleProperty("real", this.anchors, "leftMargin");
    createSimpleProperty("real", this.anchors, "rightMargin");
    createSimpleProperty("real", this.anchors, "topMargin");
    createSimpleProperty("real", this.anchors, "bottomMargin");
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

    createSimpleProperty("list", this, "states");
    createSimpleProperty("string", this, "state");
    createSimpleProperty("list", this, "transitions");
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
                                    || change.target.$properties[item.property].val,
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
                                        || change.target.$properties[item.property].val,
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
            action.target.$properties[action.property].set(action.value, QMLProperty.ReasonUser, action.target,
                                                           newState ? newState.$context: action.target.$context);
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
            this.dom.style.transform = transform;
            this.dom.style.MozTransform = transform;    // Firefox
            this.dom.style.webkitTransform = transform; // Chrome, Safari and Opera
            this.dom.style.OTransform = transform;      // Opera
            this.dom.style.msTransform = transform;     // IE
        }
        this.rotationChanged.connect(this, this.$updateTransform);
        this.scaleChanged.connect(this, this.$updateTransform);
        this.transformChanged.connect(this, this.$updateTransform);
        this.visibleChanged.connect(this, function(newVal) {
            this.dom.style.visibility = newVal ? "inherit" : "hidden";
        });
        this.opacityChanged.connect(this, function(newVal) {
            this.dom.style.opacity = newVal;
        });
        this.clipChanged.connect(this, function(newVal) {
            this.dom.style.overflow = newVal ? "hidden" : "visible";
        });
        this.zChanged.connect(this, function(newVal) {
            this.dom.style.zIndex = newVal;
        });
        this.xChanged.connect(this, function(newVal) {
            this.dom.style.left = newVal + "px";
        });
        this.yChanged.connect(this, function(newVal) {
            this.dom.style.top = newVal + "px";
        });
        this.widthChanged.connect(this, function(newVal) {
            this.dom.style.width = newVal ? newVal + "px" : "auto";
        });
        this.heightChanged.connect(this, function(newVal) {
            this.dom.style.height = newVal ? newVal + "px" : "auto";
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

    // Init size of root element
    if (engine.renderMode == QMLRenderMode.DOM
        && this.$parent === null) {
        if (engine.rootElement == undefined) {
            // Case 1: Qml scene is placed in body tag

            // event handling by addEventListener is probably better than setting window.onresize
            var updateQmlGeometry = function() {
                self.implicitHeight = window.innerHeight;
                self.implicitWidth = window.innerWidth;
            }
            window.addEventListener( "resize", updateQmlGeometry );
            updateQmlGeometry();
        } else {
            // Case 2: Qml scene is placed in some element tag
        
            // we have to call `self.implicitHeight =` and `self.implicitWidth =` 
            // each time the rootElement changes it's geometry
            // to reposition child elements of qml scene

            // it is good to have this as named method of dom element, so we can call it
            // from outside too, whenever element changes it's geometry (not only on window resize)
            this.dom.updateQmlGeometry = function() {
              self.implicitHeight = self.dom.offsetHeight;
              self.implicitWidth = self.dom.offsetWidth;
            };
            window.addEventListener( "resize", this.dom.updateQmlGeometry );
            this.dom.updateQmlGeometry();
        }
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

QW_INHERIT(QMLPositioner, QMLItem);
function QMLPositioner(meta) {
    QMLItem.call(this, meta);

    createSimpleProperty("int", this, "spacing");
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

QW_INHERIT(QMLRow, QMLPositioner);
function QMLRow(meta) {
    QMLPositioner.call(this, meta);

    createSimpleProperty("enum", this, "layoutDirection");
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
    this.implicitHeight = maxHeight;
    this.implicitWidth = curPos - this.spacing; // We want no spacing at the right side
}

QW_INHERIT(QMLColumn, QMLPositioner);
function QMLColumn(meta) {
    QMLPositioner.call(this, meta);
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
    this.implicitWidth = maxWidth;
    this.implicitHeight = curPos - this.spacing; // We want no spacing at the bottom side
}

QW_INHERIT(QMLGrid, QMLPositioner);
function QMLGrid(meta) {
    QMLPositioner.call(this, meta);

    this.Grid = {
        LeftToRight: 0,
        TopToBottom: 1
    }

    createSimpleProperty("int", this, "columns");
    createSimpleProperty("int", this, "rows");
    createSimpleProperty("enum", this, "flow");
    createSimpleProperty("enum", this, "layoutDirection");
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

QW_INHERIT(QMLFlow, QMLPositioner);
function QMLFlow(meta) {
    QMLPositioner.call(this, meta);

    this.Flow = {
        LeftToRight: 0,
        TopToBottom: 1
    }

    createSimpleProperty("enum", this, "flow");
    createSimpleProperty("enum", this, "layoutDirection");
    this.flowChanged.connect(this, this.layoutChildren);
    this.layoutDirectionChanged.connect(this, this.layoutChildren);
    this.widthChanged.connect(this, this.layoutChildren);

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
        this.implicitHeight = curVPos + rowSize;
    else
        this.implicitWidth = curHPos + rowSize;
}

QW_INHERIT(QMLRotation, QMLBaseObject);
function QMLRotation(meta) {
    QMLBaseObject.call(this, meta);

    createSimpleProperty("real", this, "angle");

    this.axis = new QObject(this);
    createSimpleProperty("real", this.axis, "x");
    createSimpleProperty("real", this.axis, "y");
    createSimpleProperty("real", this.axis, "z");

    this.origin = new QObject(this);
    createSimpleProperty("real", this.origin, "x");
    createSimpleProperty("real", this.origin, "y");

    if (engine.renderMode == QMLRenderMode.DOM) {
        function updateOrigin() {
            this.$parent.dom.style.transformOrigin = this.origin.x + "px " + this.origin.y + "px";
            this.$parent.dom.style.MozTransformOrigin = this.origin.x + "px " + this.origin.y + "px";    // Firefox
            this.$parent.dom.style.webkitTransformOrigin = this.origin.x + "px " + this.origin.y + "px"; // Chrome, Safari and Opera
        }
        this.angleChanged.connect(this.$parent, this.$parent.$updateTransform);
        this.axis.xChanged.connect(this.$parent, this.$parent.$updateTransform);
        this.axis.yChanged.connect(this.$parent, this.$parent.$updateTransform);
        this.axis.zChanged.connect(this.$parent, this.$parent.$updateTransform);
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

QW_INHERIT(QMLScale, QMLBaseObject);
function QMLScale(meta) {
    QMLBaseObject.call(this, meta);

    createSimpleProperty("real", this, "xScale");
    createSimpleProperty("real", this, "yScale");

    this.origin = new QObject(this);
    createSimpleProperty("real", this.origin, "x");
    createSimpleProperty("real", this.origin, "y");

    if (engine.renderMode == QMLRenderMode.DOM) {
        function updateOrigin() {
            this.$parent.dom.style.transformOrigin = this.origin.x + "px " + this.origin.y + "px";
            this.$parent.dom.style.MozTransformOrigin = this.origin.x + "px " + this.origin.y + "px";    // Firefox
            this.$parent.dom.style.webkitTransformOrigin = this.origin.x + "px " + this.origin.y + "px"; // Chrome, Safari and Opera
        }
        this.xScaleChanged.connect(this.$parent, this.$parent.$updateTransform);
        this.yScaleChanged.connect(this.$parent, this.$parent.$updateTransform);
        this.origin.xChanged.connect(this, updateOrigin);
        this.origin.yChanged.connect(this, updateOrigin);

        this.xScale = 0;
        this.yScale = 0;
        this.origin.x = 0;
        this.origin.y = 0;
    }

}

QW_INHERIT(QMLTranslate, QMLBaseObject);
function QMLTranslate(meta) {
    QMLBaseObject.call(this, meta);

    createSimpleProperty("real", this, "x");
    createSimpleProperty("real", this, "y");

    if (engine.renderMode == QMLRenderMode.DOM) {
        this.xChanged.connect(this.$parent, this.$parent.$updateTransform);
        this.yChanged.connect(this.$parent, this.$parent.$updateTransform);

        this.x = 0;
        this.y = 0;
    }

}

function QMLFont(parent) {
    QObject.call(this);
    createSimpleProperty("bool", this, "bold");
    createSimpleProperty("enum", this, "capitalization");
    createSimpleProperty("string", this, "family");
    createSimpleProperty("bool", this, "italic");
    createSimpleProperty("real", this, "letterSpacing");
    createSimpleProperty("int", this, "pixelSize");
    createSimpleProperty("real", this, "pointSize");
    createSimpleProperty("bool", this, "strikeout");
    createSimpleProperty("bool", this, "underline");
    createSimpleProperty("enum", this, "weight");
    createSimpleProperty("real", this, "wordSpacing");

    if (engine.renderMode == QMLRenderMode.DOM) {
        this.pointSizeChanged.connect(function(newVal) {
            parent.dom.firstChild.style.fontSize = newVal + "pt";
        });
        this.boldChanged.connect(function(newVal) {
            parent.dom.firstChild.style.fontWeight =
                parent.font.weight !== Undefined ? parent.font.weight :
                newVal ? "bold" : "normal";
        });
        this.capitalizationChanged.connect(function(newVal) {
            parent.dom.firstChild.style.fontVariant =
                newVal == "smallcaps" ? "small-caps" : "normal";
            newVal = newVal == "smallcaps" ? "none" : newVal;
            parent.dom.firstChild.style.textTransform = newVal;
        });
        this.familyChanged.connect(function(newVal) {
            parent.dom.firstChild.style.fontFamily = newVal;
        });
        this.italicChanged.connect(function(newVal) {
            parent.dom.firstChild.style.fontStyle = newVal ? "italic" : "normal";
        });
        this.letterSpacingChanged.connect(function(newVal) {
            parent.dom.firstChild.style.letterSpacing = newVal !== Undefined ? newVal + "px" : "";
        });
        this.pixelSizeChanged.connect(function(newVal) {
            var val = newVal !== Undefined ? newVal + "px "
                : (parent.font.pointSize || 10) + "pt";
            parent.dom.style.fontSize = val;
            parent.dom.firstChild.style.fontSize = val;
        });
        this.pointSizeChanged.connect(function(newVal) {
            var val = parent.font.pixelSize !== Undefined ? parent.font.pixelSize + "px "
                : (newVal || 10) + "pt";
            parent.dom.style.fontSize = val;
            parent.dom.firstChild.style.fontSize = val;
        });
        this.strikeoutChanged.connect(function(newVal) {
            parent.dom.firstChild.style.textDecoration = newVal
                ? "line-through"
                : parent.font.underline
                ? "underline"
                : "none";
        });
        this.underlineChanged.connect(function(newVal) {
            parent.dom.firstChild.style.textDecoration = parent.font.strikeout
                ? "line-through"
                : newVal
                ? "underline"
                : "none";
        });
        this.weightChanged.connect(function(newVal) {
            parent.dom.firstChild.style.fontWeight =
                newVal !== Undefined ? newVal :
                parent.font.bold ? "bold" : "normal";
        });
        this.wordSpacingChanged.connect(function(newVal) {
            parent.dom.firstChild.style.wordSpacing = newVal !== Undefined ? newVal + "px" : "";
        });
    }
}

QW_INHERIT(QMLFontLoader, QMLBaseObject);
function QMLFontLoader(meta) {
    QMLBaseObject.call(this, meta);

    // Exports.
    this.FontLoader = {
        // status
        Null: 0,
        Ready: 1,
        Loading: 2,
        Error: 3
    }

    createSimpleProperty("string", this, "name");
    createSimpleProperty("url", this, "source");
    createSimpleProperty("enum", this, "status");

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
        if (lastName !== fontName)
            return;
        if (i > 0) {
            var name = self.name;
            inTouchName = true;
            // Calling self.nameChanged() is not enough, we have to actually change the value to flush the bindings.
            self.name = 'sans-serif';
            self.name = name;
            inTouchName = false;
        }
        if (i < timeouts.length) {
            setTimeout(function() {
                cycleTouchName(fontName, i + 1);
            }, timeouts[i] - (i > 0 ? timeouts[i - 1] : 0));
        }
    }

    function loadFont(fontName) {
        if ((lastName === fontName) || inTouchName)
           return;
        lastName = fontName;

        if (!fontName) {
            self.status = self.FontLoader.Null;
            return;
        }
        self.status = self.FontLoader.Loading;
        if (typeof FontLoader !== 'undefined') {
            var fontLoader = new FontLoader([fontName], {
                "fontsLoaded": function(error) {
                    if (error !== null) {
                        if ((lastName === fontName) && (error.notLoadedFontFamilies[0] === fontName)) {
                            self.name = fontName; // Set the name for the case of font loading after the timeout.
                            self.status = self.FontLoader.Error;
                        }
                    }
                },
                "fontLoaded": function(fontFamily) {
                    if ((lastName === fontName) && (fontFamily == fontName)) {
                        self.name = fontName;
                        self.status = self.FontLoader.Ready;
                    }
                }
            }, timeouts[timeouts.length - 1]);
            FontLoader.testDiv = null; // Else I get problems loading multiple fonts (FontLoader.js bug?)
            fontLoader.loadFonts();
        } else {
            console.warn('FontLoader.js library is not loaded.\nYou should load https://github.com/smnh/FontLoader if you want to use QtQuick FontLoader elements.')
            self.status = self.FontLoader.Error; // You should not rely on 'status' property without FontLoader.js.
            self.name = fontName;
            cycleTouchName(fontName, 0)
        }
    }

    this.sourceChanged.connect(this, function(font_src) {
        var fontName = 'font_' + ((new Date()).getTime()).toString(36) + '_' + (Math.round(Math.random() * 1e15)).toString(36);
        domStyle.innerHTML = '@font-face { font-family: \'' + fontName + '\'; src: url(\'' + engine.$resolvePath(font_src) + '\'); }';
        document.getElementsByTagName('head')[0].appendChild(domStyle);
        loadFont(fontName);
    });

    this.nameChanged.connect(this, loadFont);
}

QW_INHERIT(QMLText, QMLItem);
function QMLText(meta) {
    QMLItem.call(this, meta);

    if (engine.renderMode == QMLRenderMode.DOM) {
        // We create another span inside the text to distinguish the actual
        // (possibly html-formatted) text from child elements
        this.dom.innerHTML = "<span></span>";
        this.dom.style.pointerEvents = "auto";
        this.dom.firstChild.style.width = "100%";
        this.dom.firstChild.style.height = "100%";
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

    this.font = new QMLFont(this);

    createSimpleProperty("color", this, "color");
    createSimpleProperty("string", this, "text");
    createSimpleProperty("real", this, "lineHeight");
    createSimpleProperty("enum", this, "wrapMode");
    createSimpleProperty("enum", this, "horizontalAlignment");
    createSimpleProperty("enum", this, "style");
    createSimpleProperty("color", this, "styleColor");

    if (engine.renderMode == QMLRenderMode.DOM) {
        this.colorChanged.connect(this, function(newVal) {
            newVal = QMLColor(newVal);
            this.dom.firstChild.style.color = newVal;
        });
        this.textChanged.connect(this, function(newVal) {
            this.dom.firstChild.innerHTML = newVal;
        });
        this.lineHeightChanged.connect(this, function(newVal) {
            this.dom.firstChild.style.lineHeight = newVal + "px";
        });
        this.wrapModeChanged.connect(this, function(newVal) {
            switch (newVal) {
                case 0:
                    this.dom.firstChild.style.whiteSpace = "pre";
                    break;
                case 1:
                    this.dom.firstChild.style.whiteSpace = "pre-wrap";
                    break;
                case 2:
                    this.dom.firstChild.style.whiteSpace = "pre-wrap";
                    this.dom.firstChild.style.wordBreak = "break-all";
                    break;
                case 3:
                    this.dom.firstChild.style.whiteSpace = "pre-wrap";
                    this.dom.firstChild.style.wordWrap = "break-word";
            };
            // AlignJustify doesn't work with pre/pre-wrap, so we decide the
            // lesser of the two evils to be ignoring "\n"s inside the text.
            if (this.horizontalAlignment == "justify")
                this.dom.firstChild.style.whiteSpace = "normal";
        });
        this.horizontalAlignmentChanged.connect(this, function(newVal) {
            this.dom.style.textAlign = newVal;
            // AlignJustify doesn't work with pre/pre-wrap, so we decide the
            // lesser of the two evils to be ignoring "\n"s inside the text.
            if (newVal == "justify")
                this.dom.firstChild.style.whiteSpace = "normal";
        });
        this.styleChanged.connect(this, function(newVal) {
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
            };
        });
        this.styleColorChanged.connect(this, function(newVal) {
            newVal = QMLColor(newVal);
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

    this.Component.completed.connect(this, updateImplicitHeight);
    this.Component.completed.connect(this, updateImplicitWidth);

    function updateImplicitHeight() {
        var height;

        if (this.text === Undefined || this.text === "") {
            height = 0;
        } else if (engine.renderMode == QMLRenderMode.DOM) {
            height = this.dom ? this.dom.firstChild.offsetHeight : 0;
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
            width = this.dom ? this.dom.firstChild.offsetWidth : 0;
        else
            width = engine.$getTextMetrics(this.text, fontCss(this.font)).width;

        this.implicitWidth = width;
    }

    this.$drawItem = function(c) {
        c.save();
        c.font = fontCss(this.font);
        c.fillStyle = this.color;
        c.textAlign = "left";
        c.textBaseline = "top";
        c.fillText(this.text, this.left, this.top);
        c.restore();
    }
}

QW_INHERIT(QMLRectangle, QMLItem);
function QMLRectangle(meta) {
    QMLItem.call(this, meta);

    createSimpleProperty("color", this, "color");
    createSimpleProperty("real", this, "radius");

    this.border = new QObject(this);
    createSimpleProperty("color", this.border, "color");
    createSimpleProperty("int", this.border, "width");

    if (engine.renderMode == QMLRenderMode.DOM) {
        this.colorChanged.connect(this, function(newVal) {
            newVal = QMLColor(newVal);
            this.dom.style.backgroundColor = newVal;
        });
        this.radiusChanged.connect(this, function(newVal) {
            this.dom.style.borderRadius = newVal + "px";
        });
        this.border.colorChanged.connect(this, function(newVal) {
            newVal = QMLColor(newVal);
            this.dom.style.borderColor = newVal;
            this.dom.style.borderStyle = this.border.width == 0 || newVal == "transparent"
                                                ? "none" : "solid";
        });
        this.border.widthChanged.connect(this, function(newVal) {
            this.dom.style.borderWidth = newVal + "px";
            this.dom.style.borderStyle = newVal == 0 || this.border.color == "transparent"
                                                ? "none" : "solid";
        });
    }

    this.color = "white";
    this.border.color = "transparent";
    this.border.width = 1;
    this.radius = 0;

    this.$drawItem = function(c) {
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

QW_INHERIT(QMLRepeater, QMLItem);
function QMLRepeater(meta) {
    QMLItem.call(this, meta);
    var self = this;

    createSimpleProperty("Component", this, "delegate");
    this.$defaultProperty = "delegate";
    createSimpleProperty("variant", this, "model");
    createSimpleProperty("int", this, "count");
    this.$completed = false;
    this.$items = []; // List of created items

    this.modelChanged.connect(applyModel);
    this.delegateChanged.connect(applyModel);
    this.parentChanged.connect(applyModel);

    this.model = 0;
    this.count = 0;

    this.itemAt = function(index) {
        return this.$items[index];
    }

    function callOnCompleted(child) {
        child.Component.completed();
        for (var i = 0; i < child.children.length; i++)
            callOnCompleted(child.children[i]);
    }
    function insertChildren(startIndex, endIndex) {
        for (var index = startIndex; index < endIndex; index++) {
            var newItem = self.delegate.createObject(self);

            createSimpleProperty("int", newItem, "index");
            newItem.index = index;

            var model = self.model instanceof QMLListModel ? self.model.$model : self.model;
            for (var i in model.roleNames) {
                createSimpleProperty("variant", newItem, model.roleNames[i]);
                newItem.$properties[model.roleNames[i]].set(model.data(index, model.roleNames[i]), QMLProperty.ReasonInit, newItem, self.model.$context);
            }
            
            self.parent.children.splice(self.parent.children.indexOf(self) - self.$items.length + index, 0, newItem);
            newItem.parent = self.parent;
            self.parent.childrenChanged();
            self.$items.splice(index, 0, newItem);
            
            // TODO debug this. Without check to Init, Completed sometimes called twice.. But is this check correct?
            if (engine.operationState !== QMLOperationState.Init && engine.operationState !== QMLOperationState.Idle) {
                // We don't call those on first creation, as they will be called
                // by the regular creation-procedures at the right time.
                engine.$initializePropertyBindings();
                callOnCompleted(newItem);
            }
        }
        for (var i = endIndex; i < self.$items.length; i++)
            self.$items[i].index = i;

        self.count = self.$items.length;
    }

    function applyModel() {
        if (!self.delegate || !self.parent)
            return;
        var model = self.model instanceof QMLListModel ? self.model.$model : self.model;
        if (model instanceof JSItemModel) {
            model.dataChanged.connect(function(startIndex, endIndex, roles) {
                if (!roles)
                    roles = model.roleNames;
                for (var index = startIndex; index <= endIndex; index++) {
                    for (var i in roles) {
                        self.$items[index].$properties[roles[i]].set(model.data(index, roles[i]), QMLProperty.ReasonInit, self.$items[index], self.model.$context);
                    }
                }
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
            // must be more elegant here.. do not delete already created models..
            //removeChildren(0, self.$items.length);
            //insertChildren(0, model);

            if (self.$items.length > model) {
               // have more than we need
               removeChildren(model,self.$items.length);
            }
            else
            {
               // need more
               insertChildren(self.$items.length,model);
            }

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
        if (engine.renderMode == QMLRenderMode.Canvas && child instanceof QMLMouseArea)
            engine.mouseAreas.splice(engine.mouseAreas.indexOf(child), 1);
        engine.completedSignals.splice(engine.completedSignals.indexOf(child.Component.completed), 1);
        for (var i = 0; i < child.children.length; i++)
            removeChildProperties(child.children[i])
    }
}

QW_INHERIT(QMLListModel, QMLBaseObject);
function QMLListModel(meta) {
    QMLBaseObject.call(this, meta);
    var self = this,
    firstItem = true;

    createSimpleProperty("int", this, "count");
    createSimpleProperty("list", this, "$items");
    this.$defaultProperty = "$items";
    this.$items = [];
    this.$model = new JSItemModel();
    this.count = 0;

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
        this.$items.splice(index, 0, dict);
        this.$itemsChanged(this.$items);
        this.$model.rowsInserted(index, index+1);
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

QW_INHERIT(QMLListElement, QMLBaseObject);
function QMLListElement(meta) {
    QMLBaseObject.call(this, meta);

    for (var i in meta.object) {
        if (i[0] != "$") {
            createSimpleProperty("variant", this, i);
        }
    }
    applyProperties(meta.object, this, this, this.$context);
}

QW_INHERIT(QMLImage, QMLItem);
function QMLImage(meta) {
    QMLItem.call(this, meta);
    var img = new Image(),
        self = this;

    if (engine.renderMode == QMLRenderMode.DOM) {
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.position = "absolute";
        this.dom.appendChild(img);
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
    createSimpleProperty("bool", this, "asynchronous");
    createSimpleProperty("bool", this, "cache");
    createSimpleProperty("bool", this, "smooth");

    createSimpleProperty("enum", this, "fillMode");
    createSimpleProperty("bool", this, "mirror");
    createSimpleProperty("real", this, "progress");
    createSimpleProperty("url", this, "source");
    createSimpleProperty("enum", this, "status");

    this.sourceSize = new QObject(this);

    createSimpleProperty("int", this.sourceSize, "width");
    createSimpleProperty("int", this.sourceSize, "height");

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

QW_INHERIT(QMLAnimatedImage, QMLImage);
function QMLAnimatedImage(meta) {
    QMLImage.call(this, meta);
}

QW_INHERIT(QMLBorderImage, QMLItem);
function QMLBorderImage(meta) {
    QMLItem.call(this, meta);
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

    createSimpleProperty("url", this, "source");
    createSimpleProperty("enum", this, "status");
    this.border = new QObject(this);
    createSimpleProperty("int", this.border, "left");
    createSimpleProperty("int", this.border, "right");
    createSimpleProperty("int", this.border, "top");
    createSimpleProperty("int", this.border, "bottom");
    createSimpleProperty("enum", this, "horizontalTileMode");
    createSimpleProperty("enum", this, "verticalTileMode");

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

QW_INHERIT(QMLMouseArea, QMLItem);
function QMLMouseArea(meta) {
    QMLItem.call(this, meta);
    var self = this;

    if (engine.renderMode == QMLRenderMode.DOM) {
        this.dom.style.pointerEvents = "all";

        // IE does not handle mouse clicks to transparent divs, so we have
        // to set a background color and make it invisible using opacity
        // as that doesn't affect the mouse handling.
        this.dom.style.backgroundColor = "white";
        this.dom.style.opacity = 0;
    }

    createSimpleProperty("variant", this, "acceptedButtons");
    createSimpleProperty("bool", this, "enabled");
    createSimpleProperty("bool", this, "hoverEnabled");
    createSimpleProperty("real", this, "mouseX");
    createSimpleProperty("real", this, "mouseY");
    createSimpleProperty("bool", this, "pressed");
    createSimpleProperty("bool", this, "containsMouse");
    this.clicked = Signal([{type: "variant", name: "mouse"}]);
    this.entered = Signal();
    this.exited = Signal();
    this.positionChanged = Signal([{type: "variant", name: "mouse"}]);

    this.acceptedButtons = Qt.LeftButton;
    this.enabled = true;
    this.hoverEnabled = false;
    this.containsMouse = false;

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

QW_INHERIT(QMLState, QMLBaseObject);
function QMLState(meta) {
    QMLBaseObject.call(this, meta);

    createSimpleProperty("string", this, "name");
    createSimpleProperty("list", this, "changes");
    this.$defaultProperty = "changes";
    createSimpleProperty("string", this, "extend");
    createSimpleProperty("bool", this, "when");
    this.changes = [];
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

QW_INHERIT(QMLPropertyChanges, QMLBaseObject);
function QMLPropertyChanges(meta) {
    QMLBaseObject.call(this, meta);

    createSimpleProperty("QtObject", this, "target");
    createSimpleProperty("bool", this, "explicit");
    createSimpleProperty("bool", this, "restoreEntryValues");

    this.explicit = false;
    this.restoreEntryValues = true;
    this.$actions = [];

    this.$setCustomData = function(propName, value) {
        this.$actions.push({
            property: propName,
            value: value
        });
    }
}

QW_INHERIT(QMLTransition, QMLBaseObject);
function QMLTransition(meta) {
    QMLBaseObject.call(this, meta);

    createSimpleProperty("list", this, "animations");
    this.$defaultProperty = "animations";
    createSimpleProperty("string", this, "from");
    createSimpleProperty("string", this, "to");
    createSimpleProperty("bool", this, "reversible");
    this.animations = [];
    this.$item = this.$parent;
    this.from = "*";
    this.to = "*";

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

QW_INHERIT(QMLTimer, QMLBaseObject);
function QMLTimer(meta) {
    QMLBaseObject.call(this, meta);
    var prevTrigger,
        self = this;

    createSimpleProperty("int", this, "interval");
    createSimpleProperty("bool", this, "repeat");
    createSimpleProperty("bool", this, "running");
    createSimpleProperty("bool", this, "triggeredOnStart");

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
        if (!self.repeat)
            // We set the value directly in order to be able to emit the runningChanged
            // signal after triggered, like Qt does it.
            self.$properties.running.val = false;

        // Trigger this.
        self.triggered();

        engine.$requestDraw();

        if (!self.repeat)
            // Emit changed signal manually after setting the value manually above.
            self.runningChanged();
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

QW_INHERIT(QMLAnimation, QMLBaseObject);
function QMLAnimation(meta) {
    QMLBaseObject.call(this, meta);

    // Exports
    this.Animation = {
        Infinite: -1
    };

    createSimpleProperty("bool", this, "alwaysRunToEnd");
    createSimpleProperty("int", this, "loops");
    createSimpleProperty("bool", this, "paused");
    createSimpleProperty("bool", this, "running");

    this.alwaysRunToEnd = false;
    this.loops = 1;
    this.paused = false;
    this.running = false;

    // Methods
    this.restart = function() {
        this.stop();
        this.start();
    };
    this.start = function() {
        this.running = true;
    }
    this.stop = function() {
        this.running = false;
    }
    this.pause = function() {
        this.paused = true;
    }
    this.resume = function() {
        this.paused = false;
    }

    // To be overridden
    this.complete = unboundMethod;
}

QW_INHERIT(QMLSequentialAnimation, QMLAnimation);
function QMLSequentialAnimation(meta) {
    QMLAnimation.call(this, meta);
    var curIndex,
        passedLoops,
        i,
        self = this;

    createSimpleProperty("list", this, "animations");
    this.$defaultProperty = "animations";
    this.animations = [];

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

QW_INHERIT(QMLParallelAnimation, QMLAnimation);
function QMLParallelAnimation(meta) {
    QMLAnimation.call(this, meta);
    var curIndex,
        passedLoops,
        i;

    this.Animation = { Infinite: Math.Infinite }
    createSimpleProperty("list", this, "animations");
    this.$defaultProperty = "animations";
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

QW_INHERIT(QMLPropertyAnimation, QMLAnimation);
function QMLPropertyAnimation(meta) {
    QMLAnimation.call(this, meta);

    createSimpleProperty("int", this, "duration");
    createSimpleProperty("real", this, "from");
    createSimpleProperty("string", this, "properties");
    createSimpleProperty("string", this, "property");
    createSimpleProperty("QtObject", this, "target");
    createSimpleProperty("list", this, "targets");
    createSimpleProperty("real", this, "to");

    this.easing = new QObject(this);
    createSimpleProperty("enum", this.easing, "type");
    createSimpleProperty("real", this.easing, "amplitude");
    createSimpleProperty("real", this.easing, "overshoot");
    createSimpleProperty("real", this.easing, "period");

    this.easing.$valueForProgress = function(t) {
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

    this.$redoActions = function() {
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

QW_INHERIT(QMLNumberAnimation, QMLPropertyAnimation);
function QMLNumberAnimation(meta) {
    QMLPropertyAnimation.call(this, meta);
    var at = 0,
        loop = 0,
        self = this;

    engine.$addTicker(ticker);

    function ticker(now, elapsed) {
        if ((self.running || loop === -1) && !self.paused) { // loop === -1 is a marker to just finish this run
            if (at == 0 && loop == 0 && !self.$actions.length)
                self.$redoActions();
            at += elapsed / self.duration;
            if (at >= 1)
                self.complete();
            else
                for (var i in self.$actions) {
                    var action = self.$actions[i],
                        value = self.easing.$valueForProgress(at) * (action.to - action.from) + action.from;
                    action.target.$properties[action.property].set(value, QMLProperty.ReasonAnimation);
                }
        }
    }

    function startLoop() {
        for (var i in this.$actions) {
            var action = this.$actions[i];
            action.from = action.from !== Undefined ? action.from : action.target[action.property];
        }
        at = 0;
    }

    this.runningChanged.connect(this, function(newVal) {
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

    this.complete = function() {
        for (var i in this.$actions) {
            var action = this.$actions[i];
            action.target.$properties[action.property].set(action.to, QMLProperty.ReasonAnimation);
        }
        engine.$requestDraw();

        if (++loop == this.loops)
            this.running = false;
        else if (!this.running)
            this.$actions = [];
        else
            startLoop.call(this);
    }
}

QW_INHERIT(QMLBehavior, QMLBaseObject);
function QMLBehavior(meta) {
    QMLBaseObject.call(this, meta);

    createSimpleProperty("Animation", this, "animation");
    this.$defaultProperty = "animation";
    createSimpleProperty("bool", this, "enabled");

    this.animationChanged.connect(this, function(newVal) {
        newVal.target = this.$parent;
        newVal.property = meta.object.$on;
        this.$parent.$properties[meta.object.$on].animation = newVal;
    });
    this.enabledChanged.connect(this, function(newVal) {
        this.$parent.$properties[meta.object.$on].animation = newVal ? this.animation : null;
    });
}


//------------DOM-only-Elements------------

QW_INHERIT(QMLTextInput, QMLItem);
function QMLTextInput(meta) {
    QMLItem.call(this, meta);

    if (engine.renderMode == QMLRenderMode.Canvas) {
        console.log("TextInput-type is only supported within the DOM-backend.");
        return;
    }

    var self = this;

    this.TextInput = {
        Normal: "text",
        Password: "password",
        NoEcho: "password", // Not supported, use password, that's nearest
        PasswordEchoOnEdit: "password" // Not supported, use password, that's nearest
    }

    this.font = new QMLFont(this);

    this.dom.innerHTML = "<input type=\"text\"/>"
    this.dom.firstChild.style.pointerEvents = "auto";
    // In some browsers text-inputs have a margin by default, which distorts
    // the positioning, so we need to manually set it to 0.
    this.dom.firstChild.style.margin = "0";
    this.dom.firstChild.style.width = "100%";

    createSimpleProperty("string", this, "text", "");
    createSimpleProperty("enum", this, "echoMode", "text");
    this.accepted = Signal();

    this.Component.completed.connect(this, function() {
        this.implicitWidth = this.dom.firstChild.offsetWidth;
        this.implicitHeight = this.dom.firstChild.offsetHeight;
    });

    this.textChanged.connect(this, function(newVal) {
        // We have to check if value actually changes. 
        // If we do not have this check, then after user updates text input following occurs:
        // user update gui text -> updateValue called -> textChanged called -> gui value updates again -> caret position moves to the right!
        if (this.dom.firstChild.value != newVal)
          this.dom.firstChild.value = newVal;
    });

    this.echoModeChanged.connect(this, function(newVal) {
        this.dom.firstChild.type = newVal;
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

QW_INHERIT(QMLButton, QMLItem);
function QMLButton(meta) {
    if (engine.renderMode == QMLRenderMode.Canvas) {
        console.log("Button-type is only supported within the DOM-backend. Use Rectangle + MouseArea instead.");
        QMLItem.call(this, meta);
        return;
    }

    this.dom = document.createElement("button");
    QMLItem.call(this, meta);
    var self = this;

    this.dom.style.pointerEvents = "auto";
    this.dom.innerHTML = "<span></span>";

    createSimpleProperty("string", this, "text");
    createSimpleProperty("bool", this, "enabled");    

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
    this.enabledChanged.connect(this, function(newVal) {
        this.dom.disabled = !newVal;
    });

    this.dom.onclick = function(e) {
        self.clicked();
    }
}

QW_INHERIT(QMLTextEdit, QMLItem);
function QMLTextEdit(meta) {
    QMLItem.call(this, meta);

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

    createSimpleProperty("string", this, "text", "");

    this.Component.completed.connect(this, function() {
        this.implicitWidth = this.dom.firstChild.offsetWidth;
        this.implicitHeight = this.dom.firstChild.offsetHeight;
        //this.dom.firstChild.style.zIndex = this.z;
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

QW_INHERIT(QMLCheckbox, QMLItem);
function QMLCheckbox(meta) {
    if (engine.renderMode == QMLRenderMode.Canvas) {
        console.log("CheckBox-type is only supported within the DOM-backend.");
        QMLItem.call(this, meta);
        return;
    }

    this.dom = document.createElement("label");
    QMLItem.call(this, meta);
    var self = this;

    this.font = new QMLFont(this);

    this.dom.innerHTML = "<input type=\"checkbox\"><span></span>";
    this.dom.style.pointerEvents = "auto";
    this.dom.firstChild.style.verticalAlign = "text-bottom";

    createSimpleProperty("string", this, "text");
    createSimpleProperty("bool", this, "checked");
    createSimpleProperty("color", this, "color");

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
        newVal = QMLColor(newVal);
        this.dom.children[1].style.color = newVal;
    });

    this.checkedChanged.connect(this, function(newVal) {
        this.dom.firstChild.checked = self.checked;
    });    

    this.dom.firstChild.onchange = function() {
        self.checked = this.checked;
    };
}

// imported from https://github.com/Plaristote/qmlweb/blob/d85942bd2fa38613f8258629a3b98d18d8dbb844/src/qtcore/qml/elements/QtMultimedia/Video.js

MediaPlayer = {
  NoError: 0, ResourceError: 1, FormatError: 2, NetworkError: 4, AccessDenied: 8, ServiceMissing: 16,
  StoppedState: 0, PlayingState: 1, PausedState: 2,
  NoMedia: 0, Loading: 1, Loaded: 2, Buffering: 4, Stalled: 8, EndOfMedia: 16, InvalidMedia: 32, UnknownStatus: 64
};

VideoOutput = {
  PreserveAspectFit: 0, PreserveAspectCrop: 1, Stretch: 2
};

QW_INHERIT(QMLVideo, QMLItem);
function QMLVideo(meta) {
    var domVideo;
    var runningEventListener = 0;
    var volumeBackup;

    QMLItem.call(this, meta);

    this.dom.innerHTML = "<video></video>";
    domVideo = this.dom.firstChild;
    this.dom.firstChild.style.width = this.dom.firstChild.style.height = "100%";
    this.dom.firstChild.style.margin = "0";

    createSimpleProperty("bool",   this, "autoPlay");
    createSimpleProperty("enum",   this, "fillMode");
    createSimpleProperty("int",    this, "duration");
    createSimpleProperty("int",    this, "position");
    createSimpleProperty("bool",   this, "muted");
    createSimpleProperty("real",   this, "playbackRate");
    createSimpleProperty("enum",   this, "playbackState");
    createSimpleProperty("string", this, "source");
    createSimpleProperty("real",   this, "volume");
    createSimpleProperty("enum",   this, "status");
    createSimpleProperty("enum",   this, "error");

    this.status = MediaPlayer.NoMedia;
    this.error = MediaPlayer.NoError;
    this.fillMode = VideoOutput.PreserveAspectFit;
    this.volume = domVideo.volume;
    this.duration = domVideo.duration;
    this.playbackState = MediaPlayer.StoppedState;
    this.muted = false;

    this.paused  = Signal();
    this.playing = Signal();
    this.stopped = Signal();


    this.autoPlayChanged.connect(this, (function(newVal) {
      domVideo.autoplay = newVal;
    }).bind(this));

    domVideo.addEventListener("play", (function() {
      this.playing();
      this.playbackState = MediaPlayer.PlayingState;
    }).bind(this));

    domVideo.addEventListener("pause", (function() {
      this.paused();
      this.playbackState = MediaPlayer.PausedState;
    }).bind(this));

    domVideo.addEventListener("timeupdate", (function() {
      runningEventListener++;
      this.position = domVideo.currentTime * 1000;
      runningEventListener--;
    }).bind(this));

    domVideo.addEventListener("ended", (function() {
      this.stopped();
      this.playbackState = MediaPlayer.StoppedState;
    }).bind(this));

    domVideo.addEventListener("progress", (function() {
      if (domVideo.buffered.length > 0) {
        this.progress = domVideo.buffered.end(0) / domVideo.duration;
        this.status   = this.progress < 1 ? MediaPlayer.Buffering : MediaPlayer.Buffered;
      }
    }).bind(this));

    domVideo.addEventListener("stalled", (function() {
      this.status = MediaPlayer.Stalled;
    }).bind(this));

    domVideo.addEventListener("canplaythrough", (function() {
      this.status = MediaPlayer.Buffered;
    }).bind(this));

    domVideo.addEventListener("loadstart", (function() {
      this.status = MediaPlayer.Loading;
    }).bind(this));

    domVideo.addEventListener("durationchanged", (function() {
      this.duration = domVideo.duration;
    }).bind(this));

    domVideo.addEventListener("volumechanged", (function() {
      runningEventListener++;
      this.volume = demoVideo.volume;
      runningEventListener--;
    }).bind(this));

    domVideo.addEventListener("suspend", (function() {
      this.error |= MediaPlayer.NetworkError;
    }).bind(this));

    domVideo.addEventListener("error", (function() {
      this.error |= MediaPlayer.ResourceError;
    }).bind(this));

    domVideo.addEventListener("ratechange", (function() {
      runningEventListener++;
      this.playbackRate = domVideo.playbackRate;
      runningEventListener--;
    }).bind(this));

    this.pause = (function() {
      domVideo.pause();
    }).bind(this);

    this.play = (function() {
      domVideo.play();
    }).bind(this);

    this.seek = (function(offset) {
      domVideo.currentTime = offset * 1000;
    }).bind(this);

    this.stop = (function() {
    }).bind(this);

    this.mimetypeFromExtension = function(extension) {
      var mimetypes = {
        ogg: 'video/ogg',
        ogv: 'video/ogg',
        ogm: 'video/ogg',
        mp4: 'video/mp4',
        webm: 'video/webm'
      };

      if (typeof mimetypes[extension] == 'undefined')
        return "";
      return mimetypes[extension];
    };

    this.sourceChanged.connect(this, (function(source) {
      var parts     = source.split('.');
      var extension = parts[parts.length - 1];

      domVideo.src = source;
      if (domVideo.canPlayType(this.mimetypeFromExtension(extension.toLowerCase())) == "")
        this.error |= MediaPlayer.FormatError;
    }).bind(this));

    this.positionChanged.connect(this, (function(currentTime) {
      if (runningEventListener == 0)
        domVideo.currentTime = currentTime / 1000;
    }).bind(this));

    this.volumeChanged.connect(this, (function(volume) {
      if (runningEventListener == 0)
        domVideo.volume = volume;
    }).bind(this));

    this.playbackRateChanged.connect(this, (function(playbackRate) {
      if (runningEventListener == 0)
        domVideo.playbackRate = playbackRate;
    }).bind(this));

    this.mutedChanged.connect(this, (function(newValue) {
      if (newValue == true) {
        volulmeBackup = domVideo.volume;
        this.volume = 0;
      } else {
        this.volume = volumeBackup;
      }
    }).bind(this));

    this.fillModeChanged.connect(this, (function(newValue) {
      switch (newValue) {
        case VideoOutput.Stretch:
          domVideo.style.objectFit = 'fill';
          break ;
        case VideoOutput.PreserveAspectFit:
          domVideo.style.objectFit = '';
          break ;
        case VideoOutput.PreserveAspectCrop:
          domVideo.style.objectFit = 'cover';
          break ;
      }
    }).bind(this));

    // ************** Patching original version

    this.dom.style.pointerEvents = "all";

    createSimpleProperty("bool",   this, "controls");        
    this.controls = false;
    this.controlsChanged.connect(this, (function(newValue) {
      domVideo.controls = newValue;
    }).bind(this));
    
    createSimpleProperty("bool",   this, "ispaused");
    this.ispaused = true;

    this.playbackStateChanged.connect(this, (function(newValue) {
      this.ispaused = (this.playbackState !== MediaPlayer.PlayingState);
    }).bind(this));
   
    
}

})();