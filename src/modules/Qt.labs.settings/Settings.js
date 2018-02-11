// eslint-disable-next-line no-undef
class Qt_labs_settings_Settings extends QtQuick_Item {
  static properties = {
    category: "string"
  };

  constructor(meta) {
    super(meta);

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
}
