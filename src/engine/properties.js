/**
 * Create property getters and setters for object.
 * @param {Object} obj Object for which gsetters will be set
 * @param {String} propName Property name
 * @param {Object} [options] Options that allow finetuning of the property
 */
function createProperty(type, obj, propName, options = {}) {
  const QMLProperty = QmlWeb.QMLProperty;
  const prop = new QMLProperty(type, obj, propName);
  obj[`${propName}Changed`] = prop.changed;
  obj.$properties[propName] = prop;
  obj.$properties[propName].set(options.initialValue, QMLProperty.ReasonInit);

  const getter = () => obj.$properties[propName].get();
  let setter;
  if (options.readOnly) {
    setter = function(newVal) {
      if (!obj.$canEditReadOnlyProperties) {
        throw new Error(`property '${propName}' has read only access`);
      }
      obj.$properties[propName].set(newVal, QMLProperty.ReasonUser);
    };
  } else {
    setter = function(newVal) {
      obj.$properties[propName].set(newVal, QMLProperty.ReasonUser);
    };
  }
  QmlWeb.setupGetterSetter(obj, propName, getter, setter);
  if (obj.$isComponentRoot) {
    let skip = false;
    if (options.noContextOverride) {
      // Don't override context properties if options.noContextOverride is on
      const descr = Object.getOwnPropertyDescriptor(obj.$context, propName);
      skip = descr && (descr.get || descr.set);
    }
    if (!skip) {
      QmlWeb.setupGetterSetter(obj.$context, propName, getter, setter);
    }
  }
}

/**
 * Create property getters and setters for object.
 * @param {Object} obj Object for which gsetters will be set
 * @param {Object} properties An object containing properties descriptors
 */
function createProperties(obj, properties) {
  Object.keys(properties).forEach(name => {
    let desc = properties[name];
    if (typeof desc === "string") {
      desc = { type: desc };
    }
    createProperty(desc.type, obj, name, desc);
  });
}

/**
 * Apply properties from metaObject to item.
 * @param {Object} metaObject Source of properties
 * @param {Object} item Target of property apply
 * @param {Object} objectScope Scope in which properties should be evaluated
 * @param {Object} componentScope Component scope in which properties should be
 *                 evaluated
 */
function applyProperties(metaObject, item, objectScopeIn, componentScope) {
  const QMLProperty = QmlWeb.QMLProperty;
  const objectScope = objectScopeIn || item;
  QmlWeb.executionContext = componentScope;

  const children = metaObject.$children;
  if (children && children.length > 0) {
    if (item.$defaultProperty) {
      // TODO: detect based on property type, not children count?
      const value = children.length === 1 ? children[0] : children;
      item.$properties[item.$defaultProperty].set(
        value,
        QMLProperty.ReasonInit,
        objectScope, componentScope
      );
    } else {
      throw new Error("Cannot assign to unexistant default property");
    }
  }
  // We purposefully set the default property AFTER using it, in order to only
  // have it applied for instanciations of this component, but not for its
  // internal children
  if (metaObject.$defaultProperty) {
    item.$defaultProperty = metaObject.$defaultProperty;
  }

  for (const i in metaObject) {
    const value = metaObject[i];
    if (i === "id" || i === "$class") { // keep them
      item[i] = value;
      continue;
    }

    // skip global id's and internal values
    if (i === "id" || i[0] === "$") { // TODO: what? See above.
      continue;
    }

    // slots
    if (i.indexOf("on") === 0 && i.length > 2 && /[A-Z]/.test(i[2])) {
      const signalName = i[2].toLowerCase() + i.slice(3);
      if (connectSignal(item, signalName, value, objectScope, componentScope)) {
        continue;
      }
      if (item.$setCustomSlot) {
        item.$setCustomSlot(signalName, value, objectScope, componentScope);
        continue;
      }
    }

    if (value instanceof Object) {
      if (applyProperty(item, i, value, objectScope, componentScope)) {
        continue;
      }
    }

    if (item.$properties && i in item.$properties) {
      item.$properties[i].set(value, QMLProperty.ReasonInit, objectScope,
                                                             componentScope);
    } else if (i in item) {
      item[i] = value;
    } else if (item.$setCustomData) {
      item.$setCustomData(i, value);
    } else {
      console.warn(
        `Cannot assign to non-existent property "${i}". Ignoring assignment.`
      );
    }
  }
}

function applyProperty(item, i, value, objectScope, componentScope) {
  const QMLProperty = QmlWeb.QMLProperty;

  if (value instanceof QmlWeb.QMLSignalDefinition) {
    item.$Signals[i] = QmlWeb.Signal.signal(value.parameters);
    if (!(i in item)) {
      item[i] = item.$Signals[i];
      if (item.$isComponentRoot) {
        componentScope[i] = item[i];
      }
    }
    return true;
  }

  if (value instanceof QmlWeb.QMLMethod) {
    value.compile();
    item[i] = value.eval(objectScope, componentScope,
      componentScope.$basePath);
    if (item.$isComponentRoot) {
      componentScope[i] = item[i];
    }
    return true;
  }

  if (value instanceof QmlWeb.QMLAliasDefinition) {
    // TODO
    // 1. Alias must be able to point to prop or id of local object,
    //    eg: property alias q: t
    // 2. Alias may have same name as id it points to: property alias
    //    someid: someid
    // 3. Alias proxy (or property proxy) to proxy prop access to selected
    //    incapsulated object. (think twice).
    createProperty("alias", item, i, { noContextOverride: true });
    item.$properties[i].componentScope = componentScope;
    item.$properties[i].componentScopeBasePath = componentScope.$basePath;
    item.$properties[i].val = value;
    item.$properties[i].get = function() {
      const obj = this.componentScope[this.val.objectName];
      const propertyName = this.val.propertyName;
      return propertyName ? obj.$properties[propertyName].get() : obj;
    };
    item.$properties[i].set = function(newVal, reason, _objectScope,
                                       _componentScope) {
      if (!this.val.propertyName) {
        throw new Error("Cannot set alias property pointing to an QML object.");
      }
      const obj = this.componentScope[this.val.objectName];
      const prop = obj.$properties[this.val.propertyName];
      prop.set(newVal, reason, _objectScope, _componentScope);
    };

    if (value.propertyName) {
      const con = prop => {
        const obj = prop.componentScope[prop.val.objectName];
        if (!obj) {
          console.error("qtcore: target object ", prop.val.objectName,
                        " not found for alias ", prop);
          return;
        }
        const targetProp = obj.$properties[prop.val.propertyName];
        if (!targetProp) {
          console.error(
            "qtcore: target property [", prop.val.objectName, "].",
            prop.val.propertyName, " not found for alias ", prop.name
          );
          return;
        }
        // targetProp.changed.connect( prop.changed );
        // it is not sufficient to connect to `changed` of source property
        // we have to propagate own changed to it too
        // seems the best way to do this is to make them identical?..
        // prop.changed = targetProp.changed;
        // obj[`${i}Changed`] = prop.changed;
        // no. because those object might be destroyed later.
        let loopWatchdog = false;
        targetProp.changed.connect(item, (...args) => {
          if (loopWatchdog) return;
          loopWatchdog = true;
          prop.changed.apply(item, args);
          loopWatchdog = false;
        });
        prop.changed.connect(obj, (...args) => {
          if (loopWatchdog) return;
          loopWatchdog = true;
          targetProp.changed.apply(obj, args);
          loopWatchdog = false;
        });
      };
      QmlWeb.engine.pendingOperations.push([con, item.$properties[i]]);
    }
    return true;
  }

  if (value instanceof QmlWeb.QMLPropertyDefinition) {
    createProperty(value.type, item, i);
    item.$properties[i].set(value.value, QMLProperty.ReasonInit,
                            objectScope, componentScope);
    return true;
  }

  if (item[i] && value instanceof QmlWeb.QMLMetaPropertyGroup) {
    // Apply properties one by one, otherwise apply at once
    applyProperties(value, item[i], objectScope, componentScope);
    return true;
  }

  return false;
}

function connectSignal(item, signalName, value, objectScope, componentScope) {
  const signal = item.$Signals && item.$Signals[signalName] || item[signalName];
  if (!signal) {
    console.warn(`No signal called ${signalName} found!`);
    return undefined;
  } else if (typeof signal.connect !== "function") {
    console.warn(`${signalName} is not a signal!`);
    return undefined;
  }

  if (!value.compiled) {
    const params = [];
    for (const j in signal.parameters) {
      params.push(signal.parameters[j].name);
    }
    // Wrap value.src in IIFE in case it includes a "return"
    value.src = `(
      function(${params.join(", ")}) {
        QmlWeb.executionContext = __executionContext;
        const bp = QmlWeb.engine.$basePath;
        QmlWeb.engine.$basePath = "${componentScope.$basePath}";
        try {
          (function() {
            ${value.src}
          })();
        } finally {
          QmlWeb.engine.$basePath = bp;
        }
      }
    )`;
    value.isFunction = false;
    value.compile();
  }
  // Don't pass in __basePath argument, as QMLEngine.$basePath is set in the
  // value.src, as we need it set at the time the slot is called.
  const slot = value.eval(objectScope, componentScope);
  signal.connect(item, slot);
  return slot;
}

QmlWeb.createProperty = createProperty;
QmlWeb.createProperties = createProperties;
QmlWeb.applyProperties = applyProperties;
QmlWeb.connectSignal = connectSignal;
