QmlWeb.registerQmlType({
  module: "Qt.labs.settings",
  name: "Settings",
  versions: /.*/,
  baseClass: "QtQuick.Item",
  properties: {
    category: "string"
  }
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);

    if (typeof window.localStorage === "undefined") {
      return;
    }

    this.Component.completed.connect(this, this.Component$onCompleted);
  }
  Component$onCompleted() {
    this.$loadProperties();
    this.$initializeProperties();
  }
  $getKey(attrName) {
    return `${this.category}/${attrName}`;
  }
  $loadProperties() {
    this.$attributes.forEach(attrName => {
      if (!this.$properties[attrName]) return;

      const key = this.$getKey(attrName);
      this[attrName] = localStorage.getItem(key);
    });
  }
  $initializeProperties() {
    this.$attributes.forEach(attrName => {
      if (!this.$properties[attrName]) return;

      let emitter = this;
      let signalName = `${attrName}Changed`;

      if (this.$properties[attrName].type === "alias") {
        emitter = this.$context[this.$properties[attrName].val.objectName];
        signalName = `${this.$properties[attrName].val.propertyName}Changed`;
      }

      emitter[signalName].connect(this, () => {
        localStorage.setItem(this.$getKey(attrName), this[attrName]);
      });
    });
  }
});
