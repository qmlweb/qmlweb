// eslint-disable-next-line no-undef
class QtQuick_Loader extends QtQuick_Item {
  static properties = {
    active: { type: "bool", initialValue: true },
    asynchronous: "bool",
    item: "var",
    progress: "real",
    source: "url",
    sourceComponent: "Component",
    status: { type: "enum", initialValue: 1 }
  };
  static signals = {
    loaded: []
  };

  constructor(meta) {
    super(meta);

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
  $onSourceChanged(fileName) {
    // TODO
    // if (fileName == this.$sourceUrl && this.item !== undefined) return;
    if (!this.active) return;
    this.$unload();

    if (!fileName) {
      this.sourceComponent = null;
      this.$sourceUrl = fileName;
      return;
    }

    const tree = QmlWeb.engine.loadComponent(fileName);
    const QMLComponent = QmlWeb.getConstructor("QtQml", "2.0", "Component");
    const meta = { object: tree, context: this.$context, parent: this };
    const qmlComponent = new QMLComponent(meta);
    qmlComponent.$basePath = QmlWeb.engine.extractBasePath(tree.$file);
    qmlComponent.$imports = tree.$imports;
    qmlComponent.$file = tree.$file;
    QmlWeb.engine.loadImports(tree.$imports, qmlComponent.$basePath,
      qmlComponent.importContextId);
    const loadedComponent = this.$createComponentObject(qmlComponent, this);
    this.sourceComponent = loadedComponent;
    this.$sourceUrl = fileName;
  }
  $onSourceComponentChanged(newItem) {
    if (!this.active) return;
    this.$unload();

    if (!newItem) {
      this.item = null;
      return;
    }

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
}
