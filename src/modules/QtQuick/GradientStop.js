// eslint-disable-next-line no-undef
class QtQuick_GradientStop extends QtQml_QtObject {
  static properties = {
    color: { type: "color", initialValue: "black" },
    position: { type: "real", initialValue: 0.0 }
  };

  constructor(meta) {
    super(meta);

    this.$item = this.$parent;
  }

  onUpdate() {
    this.$parent.onGradientStopChanged();
  }
}
