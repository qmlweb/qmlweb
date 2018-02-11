// eslint-disable-next-line no-undef
class QtQml_Binding extends QtQml_QtObject {
  static properties = {
    target: { type: "QtObject", initialValue: null },
    property: { type: "string", initialValue: "" },
    value: { type: "var", initialValue: undefined },
    when: { type: "bool", initialValue: true }
  };

  constructor(meta) {
    super(meta);

    this.$property = undefined;

    this.valueChanged.connect(this, this.$onValueChanged);
    this.targetChanged.connect(this, this.$updateBinding);
    this.propertyChanged.connect(this, this.$updateBinding);
    this.whenChanged.connect(this, this.$updateBinding);
  }

  $updateBinding() {
    if (!this.when || !this.target
        || !this.target.hasOwnProperty(this.property)
        || this.value === undefined) {
      this.$property = undefined;
      return;
    }
    this.$property = this.target.$properties[this.property];
    this.$onValueChanged(this.value); // trigger value update
  }

  $onValueChanged(value) {
    if (value !== undefined && this.$property) {
      this.$property.set(value);
    }
  }
}
