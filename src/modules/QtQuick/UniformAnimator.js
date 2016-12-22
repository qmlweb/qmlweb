QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "UniformAnimator",
  versions: /^2\./,
  baseClass: "Animator",
  properties: {
    uniform: "string"
  }
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);
  }
});
