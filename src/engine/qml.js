var _executionContext = null;

// All object constructors
var constructors = {
  int: QmlWeb.qmlInteger,
  real: QmlWeb.qmlNumber,
  double: QmlWeb.qmlNumber,
  string: QmlWeb.qmlString,
  bool: QmlWeb.qmlBoolean,
  list: QmlWeb.qmlList,
  color: QmlWeb.QColor,
  enum: QmlWeb.qmlNumber,
  url: QmlWeb.qmlString,
  variant: QmlWeb.qmlVariant,
  var: QmlWeb.qmlVariant
};

const modules = {
  Main: constructors
};

const dependants = {};

// Helper. Adds a type to the constructor list
function registerGlobalQmlType(name, type) {
  QmlWeb[type.name]  = type;
  constructors[name] = type;
  modules.Main[name] = type;
};

// Helper. Register a type to a module
function registerQmlType(options, constructor) {
  if (constructor !== undefined) {
    options.constructor = constructor;
  }

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

  if (typeof options === 'function') {
    options = {
      module: options.module,
      name: options.element,
      versions: options.versions,
      baseClass: options.baseClass,
      enums: options.enums,
      signals: options.signals,
      defaultProperty: options.defaultProperty,
      properties: options.properties,
      constructor: options
    }
  };

  options.constructor.$qmlTypeInfo = {
    enums: options.enums,
    signals: options.signals,
    defaultProperty: options.defaultProperty,
    properties: options.properties
  };

  if (options.global) {
    registerGlobalQmlType(options.name, options.constructor);
  }

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

  const id = [options.module, options.name].join('.');
  if (dependants.hasOwnProperty(id)) {
    dependants[id].forEach(opt => registerQmlType(opt));
    dependants[id].length = 0;
  }
};

function getConstructor(moduleName, version, name) {
  if (typeof modules[moduleName] != 'undefined') {
    for (var i = 0 ; i < modules[moduleName].length ; ++i) {
      var type = modules[moduleName][i];

      if (type.name == name && type.versions.test(version))
        return type.constructor;
    }
  }
  return null;
};

function collectConstructorsForModule(moduleName, version) {
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

function mergeObjects(obj1, obj2) {
  var mergedObject = {};

  if (typeof obj1 != 'undefined' && obj1 != null) {
    for (var key in obj1) { mergedObject[key] = obj1[key]; }
  }
  if (typeof obj2 != 'undefined' && obj2 != null) {
    for (var key in obj2) { mergedObject[key] = obj2[key]; }
  }
  return mergedObject;
}

const perContextConstructors = {};

function loadImports(self, imports) {
  constructors = mergeObjects(modules.Main, null);
  if (imports.filter(row => row[1] === 'QtQml').length === 0 &&
      imports.filter(row => row[1] === 'QtQuick').length === 1) {
    imports.push(['qmlimport', 'QtQml', 2, '', true]);
  }
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

function inherit(constructor, baseClass) {
  var oldProto = constructor.prototype;
  constructor.prototype = Object.create(baseClass.prototype);
  Object.getOwnPropertyNames(oldProto).forEach(prop => {
    constructor.prototype[prop] = oldProto[prop];
  });
  constructor.prototype.constructor = baseClass;
}

function callSuper(self, meta) {
  const info = meta.super.$qmlTypeInfo || {};
  meta.super = meta.super.prototype.constructor;
  meta.super.call(self, meta);

  if (info.enums) {
    // TODO: not exported to the whole file scope yet
    Object.keys(info.enums).forEach(name => {
      self[name] = info.enums[name];

      if (!global[name]) {
        global[name] = self[name]; // HACK
      }
    });
  }
  if (info.properties) {
    Object.keys(info.properties).forEach(name => {
      let desc = info.properties[name];
      if (typeof desc === 'string') {
        desc = {type: desc};
      }
      createProperty(desc.type, self, name, desc);
    });
  }
  if (info.signals) {
    Object.keys(info.signals).forEach(name => {
      const params = info.signals[name];
      self[name] = Signal.signal(params);
    });
  }
  if (info.defaultProperty) {
    self.$defaultProperty = info.defaultProperty;
  }
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
        var qdirInfo = QmlWeb.engine.qmldirs[meta.object.$class]; // Are we have info on that component in some imported qmldir files?

        /* This will also be set in applyProperties, but needs to be set here
         * for Qt.createComponent to have the correct context. */
        _executionContext = meta.context;

        if (qdirInfo) {
            // We have that component in some qmldir, load it from qmldir's url
            component = Qt.createComponent( "@" + qdirInfo.url);
        }
        else
            component = Qt.createComponent(meta.object.$class + ".qml");

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
        setupGetterSetter(meta.context, meta.object.id, function() { return item; }, function() {});

    // keep path in item for probale use it later in Qt.resolvedUrl
    item.$context["$basePath"] = QmlWeb.engine.$basePath; //gut

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

function connectSignal(item, signalName, value, objectScope, componentScope) {
    if (!item[signalName]) {
        console.warn("No signal called " + signalName + " found!");
        return;
    }
    else if (typeof item[signalName].connect != 'function') {
        console.warn(signalName + " is not a signal!");
        return;
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
    var slot = value.eval(objectScope, componentScope);
    item[signalName].connect(item, slot);
    return slot;
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

    for (i in metaObject) {
        var value = metaObject[i];
        if (i == "id" || i == "$class") { // keep them
          item[i] = value;
          continue;
        }

        // skip global id's and internal values
        if (i == "id" || i[0] == "$") {
            continue;
        }
        // slots
        if (i.indexOf("on") == 0 && i[2].toUpperCase() == i[2]) {
            var signalName =  i[2].toLowerCase() + i.slice(3);
            if (!connectSignal(item, signalName, value, objectScope, componentScope)) {
                if (item.$setCustomSlot) {
                    item.$setCustomSlot(signalName, value, objectScope, componentScope);
                }
            }
            continue;
        }

        if (value instanceof Object) {
            if (value instanceof QMLSignalDefinition) {
                item[i] = Signal.signal(value.parameters);
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
                  QmlWeb.engine.pendingOperations.push( [con,item.$properties[i]] );
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
}

QmlWeb.registerGlobalQmlType = registerGlobalQmlType;
QmlWeb.registerQmlType = registerQmlType;
QmlWeb.getConstructor = getConstructor;
QmlWeb.loadImports = loadImports;
QmlWeb.callSuper = callSuper;
QmlWeb.createProperty = createProperty;
