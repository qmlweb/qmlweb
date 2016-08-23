QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "AnimatedImage",
  versions: /.*/,
  baseClass: "Image"
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);
  }
});
