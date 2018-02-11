// eslint-disable-next-line no-undef
class QtQuick_Translate extends QtQml_QtObject {
  static properties = {
    x: "real",
    y: "real"
  };

  constructor(meta) {
    super(meta);

    this.xChanged.connect(this.$parent, this.$parent.$updateTransform);
    this.yChanged.connect(this.$parent, this.$parent.$updateTransform);
  }
}
