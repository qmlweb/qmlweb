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
    font: QmlWeb.QFont,
    keysequence: QmlWeb.QKeySequence,
    size: QmlWeb.QSizeF,
    point: QmlWeb.QPointF,
    rect: QmlWeb.QRectF,
    vector2d: QmlWeb.QVector2D,
    vector3d: QmlWeb.QVector3D,
    vector4d: QmlWeb.QVector4D,
    quaternion: QmlWeb.QQuaternion,
    matrix4x4: QmlWeb.QMatrix4x4,
    enum: QmlWeb.qmlNumber,
    url: QmlWeb.qmlUrl,
    variant: QmlWeb.qmlVariant,
    var: QmlWeb.qmlVariant
  }
};

// All object constructors
QmlWeb.constructors = modules.Main;

const perImportContextConstructors = {};
let importContextIds = 0;

// Helper. Adds a type to the constructor list
function registerGlobalQmlType(name, type) {
  QmlWeb[type.name] = type;
  QmlWeb.constructors[name] = type;
  modules.Main[name] = type;
}

// Helper. Register a type to a module
function registerQmlType(spec) {
  if (!/.*_.*/.test(spec.name)) {
    throw new Error(`Invalid class name: ${spec.name}`);
  }

  const name = spec.name.replace(/.*_/, "");
  const module = spec.name.replace(/(_[0-9]+)?_[^_]+$/, "").replace(/_/g, ".");

  spec.$qmlTypeInfo = {
    enums: spec.hasOwnProperty("enums") ? spec.enums : {},
    signals: spec.hasOwnProperty("signals") ? spec.signals : {},
    properties: spec.hasOwnProperty("properties") ? spec.properties : {},
    defaultProperty: spec.defaultProperty
  };

  if (spec.hasOwnProperty("global") && spec.global) {
    registerGlobalQmlType(name, spec);
  }

  const moduleDescriptor = {
    name,
    versions: spec.hasOwnProperty("versions") ? spec.versions : /.*/,
    constructor: spec
  };
  if (!modules.hasOwnProperty(module)) {
    modules[module] = [];
  }
  modules[module].push(moduleDescriptor);

  // TODO: Move to module initialization?
  /*
    http://doc.qt.io/qt-5/qtqml-syntax-objectattributes.html#attached-properties-and-attached-signal-handlers

    Some object treated as Attached. For example, Component.
    Here, we set property to object `QMLBaseObject.prototype` with name of that
    object, and with specific getter func.
    E.g., we create "someitem.Component" here.
    Later, if somebody will read that property, the getter will be invoked.
    Here all getters are set to `getAttachedObject` only, which is actually
    dedicated for Component attached object.
    The code of `getAttachedObject` checks whether $Component internal
    variable exist, and creates it if it absent.
    Then, `getAttachedObject` adds self "completed" signal to global
    `engine.completedSignals`.
    That is how completed handlers gathered into global list. This list then
    is called by `engine.callCompletedSignals`.

    p.s. At the moment, Repeater and Loader manually call
    `Component.completed` signals on objects they create.
    At the same time, those signals are still pushed to
    `engine.completedSignals` by getAttachedObject.
  */
  if (spec.getAttachedObject) {
    const QMLBaseObject = QmlWeb.getConstructor("QtQml", "2.0", "QtObject");
    QmlWeb.setupGetter(QMLBaseObject.prototype, name, spec.getAttachedObject);
  }
}

function getConstructor(moduleName, version, name) {
  if (typeof modules[moduleName] !== "undefined") {
    for (let i = 0; i < modules[moduleName].length; ++i) {
      const type = modules[moduleName][i];
      if (type.name === name && type.versions.test(version)) {
        return type.constructor;
      }
    }
  }
  return null;
}

function getModuleConstructors(moduleName, version) {
  const constructors = {};
  if (typeof modules[moduleName] === "undefined") {
    console.warn(`module "${moduleName}" not found`);
    return constructors;
  }
  for (let i = 0; i < modules[moduleName].length; ++i) {
    const module = modules[moduleName][i];
    if (module.versions.test(version)) {
      constructors[module.name] = module.constructor;
    }
  }
  return constructors;
}

function getDirectoryConstructorsAt(path) {
  const keys = Object.keys(QmlWeb.qrc).filter(key => key.startsWith(path)
    && key.match(/\.qml$/i));
  const constructors = [];
  const QMLComponent = QmlWeb.getConstructor("QtQml", "2.0", "Component");

  keys.forEach(key => {
    const parts = key.split("/");
    const name = parts[parts.length - 1].replace(/\.qml/i, "");
    // eslint-disable-next-line no-undef
    const engine = convertToEngine(QmlWeb.qrc[key]);
    constructors[name] = meta => {
      const delegate = new QMLComponent({
        context: meta.$context,
        parent: meta.parent,
        object: engine,
        super: meta.super
      });
      return delegate.createObject(meta.parent);
    };
  });
  return constructors;
}

function getDirectoryConstructors(moduleName, object) {
  const schemeRegex = /^qrc:\/+/i;
  if (moduleName.match(schemeRegex)) {
    return getDirectoryConstructorsAt(
      QmlWeb.helpers.reduceUri(moduleName.replace(schemeRegex, ""))
    );
  } else if (object.$context && object.$context.$basePath &&
    object.$context.$basePath.match(schemeRegex)) {
    const tmp = object.$context.$basePath.replace(schemeRegex, "");
    const path = `${tmp}/${moduleName}`;

    return getDirectoryConstructorsAt(QmlWeb.helpers.reduceUri(path));
  }
  console.warn("Directory import only supported with qrc scheme");
  return null;
}

function loadImports(self, imports) {
  const mergeObjects = QmlWeb.helpers.mergeObjects;
  let constructors = mergeObjects(modules.Main);
  if (imports.filter(row => row[1] === "QtQml").length === 0 &&
      imports.filter(row => row[1] === "QtQuick").length === 1) {
    imports.push(["qmlimport", "QtQml", 2, "", true]);
  }
  for (let i = 0; i < imports.length; ++i) {
    const [, moduleName, moduleVersion, moduleAlias] = imports[i];
    let addedConstructors;
    if (typeof moduleVersion === "number") {
      const versionString = moduleVersion % 1 === 0 ?
                              moduleVersion.toFixed(1) :
                              moduleVersion.toString();
      addedConstructors = getModuleConstructors(moduleName, versionString);
    } else {
      addedConstructors = getDirectoryConstructors(moduleName, self);
    }
    if (!addedConstructors) continue;

    if (moduleAlias !== "") {
      constructors[moduleAlias] = mergeObjects(
        constructors[moduleAlias],
        addedConstructors
      );
    } else {
      constructors = mergeObjects(constructors, addedConstructors);
    }
  }
  self.importContextId = importContextIds++;
  perImportContextConstructors[self.importContextId] = constructors;
  QmlWeb.constructors = constructors; // TODO: why do we need this?
}

/**
 * QML Object constructor.
 * @param {Object} meta Meta information about the object and the creation
 *                      context
 * @return {Object} New qml object
 */
function construct(meta) {
  let item;

  let constructors = perImportContextConstructors[meta.context.importContextId];

  const classComponents = meta.object.$class.split(".");
  for (let ci = 0; ci < classComponents.length; ++ci) {
    const c = classComponents[ci];
    constructors = constructors[c];
    if (constructors === undefined) {
      break;
    }
  }

  if (constructors !== undefined) {
    const constructor = constructors;
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
    // TODO: engine.qmldirs is global for all loaded components.
    //       That's not qml's original behaviour.
    const qdirInfo = QmlWeb.engine.qmldirs[meta.object.$class];
    // Are we have info on that component in some imported qmldir files?

    /* This will also be set in applyProperties, but needs to be set here
     * for Qt.createComponent to have the correct context. */
    QmlWeb.executionContext = meta.context;

    let filePath;
    if (qdirInfo) {
      filePath = qdirInfo.url;
    } else if (classComponents.length === 2) {
      const qualified = QmlWeb.engine.qualifiedImportPath(
        meta.context.importContextId, classComponents[0]
      );
      filePath = `${qualified}${classComponents[1]}.qml`;
    } else {
      filePath = `${classComponents[0]}.qml`;
    }

    const component = QmlWeb.Qt.createComponent(filePath);

    if (!component) {
      throw new Error(`No constructor found for ${meta.object.$class}`);
    }

    item = component.$createObject(meta.parent);
    if (typeof item.dom !== "undefined") {
      item.dom.className += ` ${classComponents[classComponents.length - 1]}`;
      if (meta.object.id) {
        item.dom.className += `  ${meta.object.id}`;
      }
    }
    // Handle default properties
  }

  // id
  if (meta.object.id) {
    QmlWeb.setupGetterSetter(
      meta.context, meta.object.id,
      () => item,
      () => {}
    );
  }

  // keep path in item for probale use it later in Qt.resolvedUrl
  item.$context.$basePath = QmlWeb.engine.$basePath; //gut

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
QmlWeb.construct = construct;
