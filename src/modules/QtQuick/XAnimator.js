QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "XAnimator",
  versions: /^2\./,
  baseClass: "Animator"
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);
  }
});
