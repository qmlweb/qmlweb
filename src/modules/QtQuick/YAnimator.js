QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "YAnimator",
  versions: /^2\./,
  baseClass: "Animator"
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);
  }
});
