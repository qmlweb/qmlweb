// eslint-disable-next-line no-undef
class QtQuick_Scale extends QtQml_QtObject {
  static properties = {
    xScale: { type: "real", initialValue: 1 },
    yScale: { type: "real", initialValue: 1 }
  };

  constructor(meta) {
    super(meta);

    this.origin = new QmlWeb.QObject(this);
    QmlWeb.createProperties(this.origin, {
      x: "real",
      y: "real"
    });

    this.xScaleChanged.connect(this.$parent, this.$parent.$updateTransform);
    this.yScaleChanged.connect(this.$parent, this.$parent.$updateTransform);
    this.origin.xChanged.connect(this, this.$updateOrigin);
    this.origin.yChanged.connect(this, this.$updateOrigin);

    /* QML default origin is top-left, while CSS default origin is centre, so
     * $updateOrigin must be called to set the initial transformOrigin. */
    this.$updateOrigin();
  }
  $updateOrigin() {
    const style = this.$parent.dom.style;
    style.transformOrigin = `${this.origin.x}px ${this.origin.y}px`;
    style.webkitTransformOrigin = `${this.origin.x}px ${this.origin.y}px`;
  }
}
