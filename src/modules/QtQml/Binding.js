QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "Binding",
  versions: /.*/,
  baseClass: "QtQml.QtObject",
  properties: {
    target: { type: "QtObject", initialValue: null },
    property: { type: "string", initialValue: "" },
    value: { type: "var", initialValue: null },
    when: { type: "bool", initialValue: true }
  }
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);

    this.$property = undefined;
    this.$valueAssigned = false;

    this.valueChanged.connect(this, this.$onValueChanged);
    this.targetChanged.connect(this, this.$updateBinding);
    this.propertyChanged.connect(this, this.$updateBinding);
    this.whenChanged.connect(this, this.$updateBinding);
  }

  $updateBinding() {
    if (!this.when || this.target === null) {
      this.$property = undefined;
      return;
    }
    this.$property = this.target.$properties[this.property];
    if (this.$valueAssigned) {
      this.$onValueChanged(this.value); // trigger value update
    }
  }

  $onValueChanged(value) {
    if (this.$property !== undefined && this.$property.val !== value) {
      this.$property.val = value;
      this.$property.changed(value);
    }
    this.$valueAssigned = true;
  }
});
