QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "FocusScope",
  versions: /.*/,
  baseClass: "Item",
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);

    // TODO
  }
});
