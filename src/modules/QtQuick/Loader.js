QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "Loader",
  versions: /.*/,
  baseClass: "Item",
  properties: {
    active: { type: "bool", initialValue: true },
    asynchronous: "bool",
    item: "var",
    progress: "real",
    source: "url",
    sourceComponent: "Component",
    status: { type: "enum", initialValue: 1 }
  },
  signals: {
    loaded: []
  },
}, class {
  constructor(meta) {
    callSuper(this, meta);

    this.$sourceUrl = "";

    this.activeChanged.connect(this, this.$onActiveChanged);
    this.sourceChanged.connect(this, this.$onSourceChanged);
    this.sourceComponentChanged.connect(this, this.$onSourceComponentChanged);
    this.widthChanged.connect(this, this.$updateGeometry);
    this.heightChanged.connect(this, this.$updateGeometry);
  }
  $onActiveChanged() {
    if (!this.active) {
      this.$unload();
      return;
    }
    if (this.source) {
      this.$onSourceChanged(this.source);
    } else if (this.sourceComponent) {
      this.$onSourceComponentChanged(this.sourceComponent);
    }
  }
  $onSourceChanged(newVal) {
    // if (newVal == this.$sourceUrl && this.item !== undefined) return; // TODO
    if (!this.active) return;
    this.$unload();

    // TODO: we require ".qml" for now, that should be fixed
    if (newVal.length <= 4) return;
    if (newVal.substr(newVal.length - 4, 4) !== ".qml") return;
    const fileName = newVal.substring(0, newVal.length - 4);

    const tree = QmlWeb.engine.loadComponent(fileName);
    const QMLComponent = QmlWeb.getConstructor("QtQml", "2.0", "Component");
    const meta = { object: tree, context: this, parent: this };
    const qmlComponent = new QMLComponent(meta);
    qmlComponent.$basePath = QmlWeb.engine.extractBasePath(tree.$file);
    qmlComponent.$imports = tree.$imports;
    qmlComponent.$file = tree.$file;
    QmlWeb.engine.loadImports(tree.$imports, qmlComponent.$basePath,
      qmlComponent.importContextId);
    const loadedComponent = this.$createComponentObject(qmlComponent, this);
    this.sourceComponent = loadedComponent;
    this.$sourceUrl = newVal;
  }
  $onSourceComponentChanged(newItem) {
    if (!this.active) return;
    this.$unload();
    const QMLComponent = QmlWeb.getConstructor("QtQml", "2.0", "Component");
    let qmlComponent = newItem;
    if (newItem instanceof QMLComponent) {
      qmlComponent = newItem.$createObject(this, {}, this);
    }
    qmlComponent.parent = this;
    this.item = qmlComponent;
    this.$updateGeometry();
    if (this.item) {
      this.loaded();
    }
  }
  setSource(url, options) {
    this.$sourceUrl = url;
    this.props = options;
    this.source = url;
  }
  $unload() {
    if (!this.item) return;
    this.item.$delete();
    this.item.parent = undefined;
    this.item = undefined;
  }
  $callOnCompleted(child) {
    child.Component.completed();
    const QMLBaseObject = QmlWeb.getConstructor("QtQml", "2.0", "QtObject");
    for (let i = 0; i < child.$tidyupList.length; i++) {
      if (child.$tidyupList[i] instanceof QMLBaseObject) {
        this.$callOnCompleted(child.$tidyupList[i]);
      }
    }
  }
  $createComponentObject(qmlComponent, parent) {
    const newComponent = qmlComponent.createObject(parent);
    qmlComponent.finalizeImports();
    if (QmlWeb.engine.operationState !== QmlWeb.QMLOperationState.Init) {
      // We don't call those on first creation, as they will be called
      // by the regular creation-procedures at the right time.
      QmlWeb.engine.$initializePropertyBindings();
      this.$callOnCompleted(newComponent);
    }
    return newComponent;
  }
  $updateGeometry() {
    // Loader size doesn't exist
    if (!this.width) {
      this.width = this.item ? this.item.width : 0;
    } else if (this.item) {
      // Loader size exists
      this.item.width = this.width;
    }

    if (!this.height) {
      this.height = this.item ? this.item.height : 0;
    } else if (this.item) {
      // Loader size exists
      this.item.height = this.height;
    }
  }
});
