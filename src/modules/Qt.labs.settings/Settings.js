registerQmlType({
  module: "Qt.labs.settings",
  name: "Settings",
  versions: /.*/,
  baseClass: "QtQuick.Item",
  properties: {
    category: "string"
  }
}, class {
  constructor(meta) {
    callSuper(this, meta);

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
    for (let i = 0; i < this.$attributes.length; ++i) {
      const key = this.$getKey(this.$attributes[i]);
      this[this.$attributes[i]] = localStorage.getItem(key);
    }
  }
  $initializeProperties() {
    this.$attributes.forEach(attrName => {
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
