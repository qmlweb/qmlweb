// eslint-disable-next-line no-undef
class QtQuick_Rotation extends QtQml_QtObject {
  static properties = {
    angle: "real"
  };

  constructor(meta) {
    super(meta);

    this.axis = new QmlWeb.QObject(this);
    QmlWeb.createProperties(this.axis, {
      x: "real",
      y: "real",
      z: { type: "real", initialValue: 1 }
    });

    this.origin = new QmlWeb.QObject(this);
    QmlWeb.createProperties(this.origin, {
      x: "real",
      y: "real"
    });

    this.angleChanged.connect(this.$parent, this.$parent.$updateTransform);
    this.axis.xChanged.connect(this.$parent, this.$parent.$updateTransform);
    this.axis.yChanged.connect(this.$parent, this.$parent.$updateTransform);
    this.axis.zChanged.connect(this.$parent, this.$parent.$updateTransform);
    this.origin.xChanged.connect(this, this.$updateOrigin);
    this.origin.yChanged.connect(this, this.$updateOrigin);
    this.$parent.$updateTransform();
  }
  $updateOrigin() {
    const style = this.$parent.dom.style;
    style.transformOrigin = `${this.origin.x}px ${this.origin.y}px`;
    style.webkitTransformOrigin = `${this.origin.x}px ${this.origin.y}px`;
  }
}
