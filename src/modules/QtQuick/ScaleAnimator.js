QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "ScaleAnimator",
  versions: /^2\./,
  baseClass: "Animator"
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);
  }
});
