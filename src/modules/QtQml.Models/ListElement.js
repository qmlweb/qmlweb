QmlWeb.registerQmlType({
  module: "QtQml.Models",
  name: "ListElement",
  versions: /^2\./,
  baseClass: "QtQuick.ListElement"
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);
  }
});
