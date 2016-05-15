// Property that is currently beeing evaluated. Used to get the information
// which property called the getter of a certain other property for
// evaluation and is thus dependant on it.
var evaluatingProperty;

var _executionContext = null;

// All object constructors
var constructors = {
  'int': QMLInteger,
  real: Number,
  'double': Number,
  string: String,
  'bool': Boolean,
  list: QMLList,
  color: QMLColor,
  'enum': Number,
  url: String,
  variant: QMLVariant,
  'var': QMLVariant
};

const modules = {
  Main: constructors
};

const dependants = {};

// Helper. Adds a type to the constructor list
global.registerGlobalQmlType = function (name, type) {
  global[type.name]  = type;
  constructors[name] = type;
  modules.Main[name] = type;
};

// Helper. Register a type to a module
global.registerQmlType = function(options) {
  if (typeof options.baseClass === 'string') {
    // TODO: Does not support version specification (yet?)
    var baseModule, baseName;
    const dot = options.baseClass.lastIndexOf('.');
    if (dot === -1) {
      baseModule = options.module;
      baseName = options.baseClass;
    } else {
      baseModule = options.baseClass.substring(0, dot);
      baseName = options.baseClass.substring(dot + 1);
    }
    const found = (modules[baseModule] || [])
                    .filter(descr => descr.name === baseName);
    if (found.length > 0) {
      // Ok, we found our base class
      options.baseClass = found[0].constructor;
    } else {
      // Base class not found, delay the loading
      const baseId = [baseModule, baseName].join('.');
      if (!dependants.hasOwnProperty(baseId)) {
        dependants[baseId] = [];
      }
      dependants[baseId].push(options);
      return;
    }
  }

  if (options.global) {
    registerGlobalQmlType(options.name, options.constructor);
  } else {
    var moduleDescriptor = {
      name:        options.name,
      versions:    options.versions,
      constructor: options.constructor
    };

    if (typeof modules[options.module] == 'undefined')
      modules[options.module] = [];
    modules[options.module].push(moduleDescriptor);
  }

    if (typeof options.baseClass !== 'undefined') {
      inherit(options.constructor, options.baseClass);
    }

  const id = [options.module, options.name].join('.');
  if (dependants.hasOwnProperty(id)) {
    dependants[id].forEach(opt => global.registerQmlType(opt));
    dependants[id].length = 0;
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

function callSuper(self, meta) {
  meta.super = meta.super.prototype.constructor;
  meta.super.call(self, meta);
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
        meta.super = constructors[meta.object.$class];
        item = new constructors[meta.object.$class](meta);
        meta.super = undefined;
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
            throw new Error("No constructor found for " + meta.object.$class);
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
function createProperty(type, obj, propName, options = {}) {
    var prop = new QMLProperty(type, obj, propName);
    var getter, setter;

    obj[propName + "Changed"] = prop.changed;
    obj.$properties[propName] = prop;
    obj.$properties[propName].set(options.initialValue, QMLProperty.ReasonInit);
    getter = function()       { return obj.$properties[propName].get(); };
    if (!options.readOnly)
      setter = function(newVal) { obj.$properties[propName].set(newVal, QMLProperty.ReasonUser); };
    else {
      setter = function(newVal) {
        if (obj.$canEditReadOnlyProperties != true)
          throw "property '" + propName + "' has read only access";
        obj.$properties[propName].set(newVal, QMLProperty.ReasonUser);
      }
    }
    setupGetterSetter(obj, propName, getter, setter);
    if (obj.$isComponentRoot)
        setupGetterSetter(obj.$context, propName, getter, setter);
}

/**
 * Set up simple getter function for property
 */

function setupGetter(obj, propName, func) {
  Object.defineProperty(obj, propName, {
    get: func,
    configurable: true,
    enumerable: true
  });
}

function setupSetter(obj, propName, func) {
  Object.defineProperty(obj, propName, {
    set: func,
    configurable: true,
    enumerable: false
  });
}

function setupGetterSetter(obj, propName, getter, setter) {
  Object.defineProperty(obj, propName, {
    get: getter,
    set: setter,
    configurable: true,
    enumerable: false
  });
}

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
                value.src = "(function(" + params + ") { _executionContext = __executionContext;" + value.src + "})";
                value.isFunction = false;
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
                // TODO: 1. Alias must be able to point to prop or id of local object,eg: property alias q: t
                //       2. Alias may have same name as id it points to: property alias someid: someid
                //       3. Alias proxy (or property proxy) to proxy prop access to selected incapsulated object. (think twice).
                createProperty("alias", item, i);
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
                    } else {
                      var targetProp = obj.$properties[prop.val.propertyName];
                      if (!targetProp) {
                        console.error("qtcore: target property [",prop.val.objectName,"].",prop.val.propertyName," not found for alias ",prop.name );
                      } else {
                        // targetProp.changed.connect( prop.changed );
                        // it is not sufficient to connect to `changed` of source property
                        // we have to propagate own changed to it too
                        // seems the best way to do this is to make them identical?..
                        // prop.changed = targetProp.changed;
                        // obj[i + "Changed"] = prop.changed;
                        // no. because those object might be destroyed later.
                        ( function() {
                          var loopWatchdog = false;
                          targetProp.changed.connect( item, function() {
                              if (loopWatchdog) return; loopWatchdog = true;
                              prop.changed.apply( item,arguments );
                              loopWatchdog = false;
                          } );
                          prop.changed.connect( obj, function() {
                              if (loopWatchdog) return; loopWatchdog = true;
                              targetProp.changed.apply( obj, arguments );
                              loopWatchdog = false;
                          } );
                        } ) ();
                      }
                    }
                  }
                  engine.pendingOperations.push( [con,item.$properties[i]] );
                }

                continue;
            } else if (value instanceof QMLPropertyDefinition) {
                createProperty(value.type, item, i);
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
