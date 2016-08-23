QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "Rotation",
  versions: /.*/,
  baseClass: "QtQml.QtObject",
  properties: {
    angle: "real"
  }
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);

    const createProperty = QmlWeb.createProperty;

    this.axis = new QmlWeb.QObject(this);
    createProperty("real", this.axis, "x");
    createProperty("real", this.axis, "y");
    createProperty("real", this.axis, "z", { initialValue: 1 });

    this.origin = new QmlWeb.QObject(this);
    createProperty("real", this.origin, "x");
    createProperty("real", this.origin, "y");

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
});
