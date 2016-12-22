QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "RotationAnimator",
  versions: /^2\./,
  baseClass: "Animator"
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);
  }
});
