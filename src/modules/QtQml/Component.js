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

class QMLComponent {
  constructor(meta) {
    if (constructors[meta.object.$class] === QMLComponent) {
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
      loadImports(this, moduleImports);
      if (this.$context) {
        this.finalizeImports(this.$context);
      }
    }
  }
  finalizeImports($context) {
    for (let i = 0; i < this.$jsImports.length; ++i) {
      const importDesc = this.$jsImports[i];
      let src = importDesc[1];
      let js;

      if (typeof engine.$basePath !== "undefined") {
        src = engine.$basePath + src;
      }
      if (typeof qrc[src] !== "undefined") {
        js = qrc[src];
      } else {
        loadParser();
        js = QmlWeb.jsparse(getUrlContents(src));
      }
      if (importDesc[3] !== "") {
        $context[importDesc[3]] = {};
        importJavascriptInContext(js, $context[importDesc[3]]);
      } else {
        importJavascriptInContext(js, $context);
      }
    }
  }
  createObject(parent, properties = {}) {
    const oldState = engine.operationState;
    engine.operationState = QMLOperationState.Init;
    // change base path to current component base path
    const bp = engine.$basePath;
    engine.$basePath = this.$basePath ? this.$basePath : engine.$basePath;

    const item = construct({
      object: this.$metaObject,
      parent,
      context: this.$context ? Object.create(this.$context) : new QMLContext(),
      isComponentRoot: true
    });

    Object.keys(properties).forEach(propname => {
      item[propname] = properties.propname;
    });

    // change base path back
    // TODO looks a bit hacky
    engine.$basePath = bp;

    engine.operationState = oldState;
    return item;
  }
  static getAttachedObject() {
    if (!this.$Component) {
      this.$Component = new QObject(this);
      this.$Component.completed = Signal.signal([]);
      engine.completedSignals.push(this.$Component.completed);

      this.$Component.destruction = Signal.signal([]);
    }
    return this.$Component;
  }
}

registerQmlType({
  global: true,
  module: "QtQml",
  name: "Component",
  versions: /.*/,
  baseClass: "QtObject",
  constructor: QMLComponent
});
