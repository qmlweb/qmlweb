QmlWeb.registerQmlType({
  module: "QtQml.Modules",
  name: "ListModel",
  versions: /^2\./,
  baseClass: "QtQuick.ListModel",
  defaultProperty: "$items"
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);
  }
});
