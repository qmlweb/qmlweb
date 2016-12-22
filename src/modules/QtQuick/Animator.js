QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "Animator",
  versions: /^2\./,
  baseClass: "QtQml.QtObject",
  enums: {
    Easing: QmlWeb.Easing
  },
  properties: {
    duration: { type: "int", initialValue: 250 },
    from: "real",
    target: "Item",
    to: "real"
  }
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);
  }
});
