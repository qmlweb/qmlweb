QmlWeb.executionContext = null;

const modules = {
  Main: {
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
  }
};

// All object constructors
QmlWeb.constructors = modules.Main;

const dependants = {};

// Helper. Adds a type to the constructor list
function registerGlobalQmlType(name, type) {
  QmlWeb[type.name]  = type;
  QmlWeb.constructors[name] = type;
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

var importContextIds = 0;
const perImportContextConstructors = {};

function loadImports(self, imports) {
  const mergeObjects = QmlWeb.helpers.mergeObjects;
  let constructors = mergeObjects(modules.Main);
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
  self.importContextId = importContextIds++;
  perImportContextConstructors[self.importContextId] = constructors;
  QmlWeb.constructors = constructors; // TODO: why do we need this?
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
      QmlWeb.createProperty(desc.type, self, name, desc);
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

    var constructors = perImportContextConstructors[meta.context.importContextId];

    var classComponents = meta.object.$class.split(".")
    for(var ci=0; ci<classComponents.length; ++ci) {
        var c = classComponents[ci];
        constructors = constructors[c]
        if (constructors === undefined) {
            break;
        }
    }

    if (constructors !== undefined) {
        var constructor = constructors;
        meta.super = constructor;
        item = new constructor(meta);
        meta.super = undefined;
    } else {
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
        QmlWeb.executionContext = meta.context;

        if (qdirInfo) {
            // We have that component in some qmldir, load it from qmldir's url
            component = Qt.createComponent( "@" + qdirInfo.url);
        }
        else {
            var filePath;
            if (classComponents.length === 2) {
                filePath = QmlWeb.engine.qualifiedImportPath(
                    meta.context.importContextId, classComponents[0]) +
                        classComponents[1];
            } else {
                filePath = classComponents[0];
            }
            component = Qt.createComponent(filePath + ".qml");
        }

        if (component) {
            var item = component.$createObject(meta.parent);

            if (typeof item.dom != 'undefined')
                item.dom.className += " " + classComponents[classComponents.length-1] + (meta.object.id ? " " + meta.object.id : "");
            var dProp; // Handle default properties
        } else {
            throw new Error("No constructor found for " + meta.object.$class);
        }
    }

    // id
    if (meta.object.id)
      QmlWeb.setupGetterSetter(meta.context, meta.object.id, function() { return item; }, function() {});

    // keep path in item for probale use it later in Qt.resolvedUrl
    item.$context["$basePath"] = QmlWeb.engine.$basePath; //gut

    // We want to use the item's scope, but this Component's imports
    item.$context.importContextId = meta.context.importContextId;

    // Apply properties (Bindings won't get evaluated, yet)
    QmlWeb.applyProperties(meta.object, item, item, item.$context);

    return item;
}

QmlWeb.modules = modules;
QmlWeb.registerGlobalQmlType = registerGlobalQmlType;
QmlWeb.registerQmlType = registerQmlType;
QmlWeb.getConstructor = getConstructor;
QmlWeb.loadImports = loadImports;
QmlWeb.callSuper = callSuper;
QmlWeb.construct = construct;
