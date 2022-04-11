// Base object for all qml elements
class QtQml_QtObject extends QmlWeb.QObject {
  $Signals = {};

  static properties = {
    data: "list"
  };
  static defaultProperty = "data";

  constructor(meta) {
    super(meta.parent);

    this.$isComponentRoot = meta.isComponentRoot;
    this.$context = meta.context;

    // Component get own properties
    this.$attributes = [];
    for (const key in meta.object) {
      if (!meta.object.hasOwnProperty(key) || !meta.object[key]) {
        continue;
      }
      const name = meta.object[key].__proto__.constructor.name;
      if (name === "QMLPropertyDefinition" || name === "QMLAliasDefinition") {
        this.$attributes.push(key);
      }
    }

    // Initialize properties, signals, etc.
    const types = [];
    let type = meta.super;
    while (type) {
      types.unshift(type);
      type = Object.getPrototypeOf(type);
    }
    types.forEach(entry => {
      if (!entry.hasOwnProperty("$qmlTypeInfo")) return;
      const info = entry.$qmlTypeInfo || {};

      Object.keys(info.enums).forEach(name => {
        // TODO: not exported to the whole file scope yet
        this[name] = info.enums[name];

        if (!global[name]) {
          global[name] = this[name]; // HACK
        }
      });

      QmlWeb.createProperties(this, info.properties);

      Object.keys(info.signals).forEach(name => {
        const params = info.signals[name];
        this.$Signals[name] = QmlWeb.Signal.signal(params);
        if (!(name in this)) this[name] = this.$Signals[name];
      });

      if (info.defaultProperty) {
        this.$defaultProperty = info.defaultProperty;
      }
    });
    meta.initialized = true;
  }
  getAttributes() {
    return this.$attributes;
  }
}
