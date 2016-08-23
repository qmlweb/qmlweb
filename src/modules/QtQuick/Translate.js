QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "Translate",
  versions: /.*/,
  baseClass: "QtQml.QtObject",
  properties: {
    x: "real",
    y: "real"
  }
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);

    this.xChanged.connect(this.$parent, this.$parent.$updateTransform);
    this.yChanged.connect(this.$parent, this.$parent.$updateTransform);
  }
});
