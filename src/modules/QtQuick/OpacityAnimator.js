QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "OpacityAnimator",
  versions: /^2\./,
  baseClass: "Animator"
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);
  }
});
