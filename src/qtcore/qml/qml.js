var GETTER = "__defineGetter__",
    SETTER = "__defineSetter__",
    // Property that is currently beeing evaluated. Used to get the information
    // which property called the getter of a certain other property for
    // evaluation and is thus dependant on it.
    evaluatingProperty = undefined,
    // All object constructors
    constructors = {
      int:         QMLInteger,
      real:        Number,
      double:      Number,
      string:      String,
      bool:        Boolean,
      list:        QMLList,
      color:       QMLColor,
      enum:        Number,
      url:         String,
      variant:     QMLVariant,
      'var':       QMLVariant,
      QMLDocument: QMLComponent
    };
var modules = {
    Main: constructors
  };

// Helper. Adds a type to the constructor list
global.registerGlobalQmlType = function (name, type) {
  global[type.name]  = type;
  constructors[name] = type;
  modules.Main[name] = type;
};

// Helper. Register a type to a module
global.registerQmlType = function(options) {
  if (typeof options != 'object') {
    registerGlobalQmlType(arguments[0], arguments[1]);
  } else {
    var moduleDescriptor = {
      name:        options.name,
      versions:    options.versions,
      constructor: options.constructor
    };

    if (typeof modules[options.module] == 'undefined')
      modules[options.module] = [];
    modules[options.module].push(moduleDescriptor);

    if (typeof options.baseClass !== 'undefined') {
      inherit(options.constructor, options.baseClass);
    }
  }
};

global.getConstructor = function (moduleName, version, name) {
  if (typeof modules[moduleName] != 'undefined') {
    for (var i = 0 ; i < modules[moduleName].length ; ++i) {
      var type = modules[moduleName][i];

      if (type.name == name && type.versions.test(version))
        return type.constructor;
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
  for (var i = 0 ; i < modules[moduleName].length ; ++i) {
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
    for (var key in obj1) { mergedObject[key] = obj1[key]; }
  }
  if (typeof obj2 != 'undefined' && obj2 != null) {
    for (var key in obj2) { mergedObject[key] = obj2[key]; }
  }
  return mergedObject;
}

global.perContextConstructors = {};

global.loadImports = function (self, imports) {
  constructors = mergeObjects(modules.Main, null);
  for (var i = 0 ; i < imports.length ; ++i) {
    var moduleName = imports[i][1],
        moduleVersion = imports[i][2],
        moduleAlias = imports[i][3],
        moduleConstructors = collectConstructorsForModule(moduleName, moduleVersion);

    if (moduleAlias !== "")
      constructors[moduleAlias] = mergeObjects(constructors[moduleAlias], moduleConstructors);
    else
      constructors = mergeObjects(constructors, moduleConstructors);
  }
  perContextConstructors[self.objectId] = constructors;
}

global.inherit = function(constructor, baseClass) {
  var oldProto = constructor.prototype;
  constructor.prototype = Object.create(baseClass.prototype);
  Object.keys(oldProto).forEach(function(prop) {
    constructor.prototype[prop] = oldProto[prop];
  });
  constructor.prototype.constructor = baseClass;
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
        var qdirInfo = engine.qmldirs[meta.object.$class]; // Are we have info on that component in some imported qmldir files?
        if (qdirInfo) {
            // We have that component in some qmldir, load it from qmldir's url
            component = Qt.createComponent( "@" + qdirInfo.url, meta.context);
        }
        else
            component = Qt.createComponent(meta.object.$class + ".qml", meta.context);

        if (component) {
            var item = component.createObject(meta.parent);

            if (typeof item.dom != 'undefined')
                item.dom.className += " " + meta.object.$class + (meta.object.id ? " " + meta.object.id : "");
            var dProp; // Handle default properties
        } else {
            console.log("No constructor found for " + meta.object.$class);
            return;
        }
    }

    // id
    if (meta.object.id)
        meta.context[meta.object.id] = item;

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
function createSimpleProperty(type, obj, propName, options) {
    var prop = new QMLProperty(type, obj, propName);
    var getter, setter;

    if (typeof options == 'undefined')
      options = {};
    else if (typeof options != 'object')
      options = { default: options }

    obj[propName + "Changed"] = prop.changed;
    obj.$properties[propName] = prop;
    obj.$properties[propName].set(options.default);
    getter = function()       { return obj.$properties[propName].get(); };
    if (!options.readOnly)
      setter = function(newVal) { return obj.$properties[propName].set(newVal); };
    else {
      setter = function(newVal) {
        if (obj.$canEditReadOnlyProperties != true)
          throw "property '" + propName + "' has read only access";
        return obj.$properties[propName].set(newVal);
      }
    }
    setupGetterSetter(obj, propName, getter, setter);
    if (obj.$isComponentRoot)
        setupGetterSetter(obj.$context, propName, getter, setter);
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
            else if (typeof item[signalName].connect != 'function') {
                console.warn(signalName + " is not a signal!");
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
                    componentScope[i] = item[i];
                continue;
            } else if (value instanceof QMLMethod) {
                value.compile();
                item[i] = value.eval(objectScope, componentScope);
                if (item.$isComponentRoot)
                    componentScope[i] = item[i];
                continue;
            } else if (value instanceof QMLAliasDefinition) {
                createSimpleProperty("alias", item, i);
                item.$properties[i].componentScope = componentScope;
                item.$properties[i].val = value;
                item.$properties[i].get = function() {
                    var obj = this.componentScope[this.val.objectName];
                    return this.val.propertyName ? obj.$properties[this.val.propertyName].get() : obj;
                }
                item.$properties[i].set = function(newVal, fromAnimation, objectScope, componentScope) {
                    if (!this.val.propertyName)
                        throw "Cannot set alias property pointing to an QML object.";
                    this.componentScope[this.val.objectName].$properties[this.val.propertyName].set(newVal, fromAnimation, objectScope, componentScope);
                }
                continue;
            } else if (value instanceof QMLPropertyDefinition) {
                createSimpleProperty(value.type, item, i);
                item.$properties[i].set(value.value, true, objectScope, componentScope);
                continue;
            } else if (item[i] && value instanceof QMLMetaPropertyGroup) {
                // Apply properties one by one, otherwise apply at once
                applyProperties(value, item[i], objectScope, componentScope);
                continue;
            }
        }
        if (item.$properties && i in item.$properties)
            item.$properties[i].set(value, true, objectScope, componentScope);
        else if (i in item)
            item[i] = value;
        else if (item.$setCustomData)
            item.$setCustomData(i, value);
        else
            console.warn("Cannot assign to non-existent property \"" + i + "\". Ignoring assignment.");
    }
    if (metaObject.$children && metaObject.$children.length !== 0) {
        if (item.$defaultProperty)
            item.$properties[item.$defaultProperty].set(metaObject.$children, true, objectScope, componentScope);
        else
            throw "Cannot assign to unexistant default property";
    }
    // We purposefully set the default property AFTER using it, in order to only have it applied for
    // instanciations of this component, but not for its internal children
    if (metaObject.$defaultProperty)
        item.$defaultProperty = metaObject.$defaultProperty;
    if (typeof item.completed != 'undefined' && item.completedAlreadyCalled == false) {
      item.completedAlreadyCalled = true;
      item.completed();
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
