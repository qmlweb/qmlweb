QmlWeb.registerQmlType({
  module: "QtQuick.Particles",
  name: "Direction",
  versions: /^2\./,
  baseClass: "QtQml.QtObject"
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);
  }
});
