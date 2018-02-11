class QMLContext {
  nameForObject(obj) {
    for (const name in this) {
      if (this[name] === obj) {
        return name;
      }
    }
    return undefined;
  }
}

// eslint-disable-next-line no-undef
class QtQml_Component extends QtQml_QtObject {
  static global = true;

  constructor(meta) {
    super(meta);

    if (QmlWeb.constructors[meta.object.$class] === QtQml_Component) {
      this.$metaObject = meta.object.$children[0];
    } else {
      this.$metaObject = meta.object;
    }
    this.$context = meta.context;

    this.$jsImports = [];

    if (meta.object.$imports instanceof Array) {
      const moduleImports = [];
      const loadImport = importDesc => {
        if (/\.js$/.test(importDesc[1])) {
          this.$jsImports.push(importDesc);
        } else {
          moduleImports.push(importDesc);
        }
      };

      for (let i = 0; i < meta.object.$imports.length; ++i) {
        loadImport(meta.object.$imports[i]);
      }
      QmlWeb.loadImports(this, moduleImports);
    }

    /* If this Component does not have any imports, it is likely one that was
     * created within another Component file. It should inherit the
     * importContextId of the Component file it was created within. */
    if (this.importContextId === undefined) {
      this.importContextId = meta.context.importContextId;
    }
  }
  finalizeImports($context) {
    const engine = QmlWeb.engine;
    for (let i = 0; i < this.$jsImports.length; ++i) {
      const importDesc = this.$jsImports[i];
      const js = engine.loadJS(engine.$resolvePath(importDesc[1]));

      if (!js) {
        console.log("Component.finalizeImports: failed to import JavaScript",
          importDesc[1]);
        continue;
      }

      if (importDesc[3] !== "") {
        $context[importDesc[3]] = {};
        QmlWeb.importJavascriptInContext(js, $context[importDesc[3]]);
      } else {
        QmlWeb.importJavascriptInContext(js, $context);
      }
    }
  }
  $createObject(parent, properties = {}, context = this.$context) {
    const engine = QmlWeb.engine;
    const oldState = engine.operationState;
    engine.operationState = QmlWeb.QMLOperationState.Init;
    // change base path to current component base path
    const bp = engine.$basePath;
    engine.$basePath = this.$basePath ? this.$basePath : engine.$basePath;

    const newContext = context ? Object.create(context) : new QMLContext();

    if (this.importContextId !== undefined) {
      newContext.importContextId = this.importContextId;
    }

    const item = QmlWeb.construct({
      object: this.$metaObject,
      parent,
      context: newContext,
      isComponentRoot: true
    });

    this.finalizeImports(item.$context);

    Object.keys(properties).forEach(propname => {
      item[propname] = properties.propname;
    });

    // change base path back
    // TODO looks a bit hacky
    engine.$basePath = bp;

    engine.operationState = oldState;
    return item;
  }
  createObject(parent, properties = {}) {
    const item = this.$createObject(parent, properties);
    const QMLItem = QmlWeb.getConstructor("QtQuick", "2.0", "Item");

    if (item instanceof QMLItem) {
      item.$properties.parent.set(parent, QmlWeb.QMLProperty.ReasonInit);
    }

    return item;
  }
  static getAttachedObject() {
    // see QMLEngine.js for explanation how it is used.
    if (!this.$Component) {
      this.$Component = new QmlWeb.QObject(this);
      this.$Component.completed = QmlWeb.Signal.signal([]);
      QmlWeb.engine.completedSignals.push(this.$Component.completed);

      this.$Component.destruction = QmlWeb.Signal.signal([]);
    }
    return this.$Component;
  }
}
