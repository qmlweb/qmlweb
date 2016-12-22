QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "ListElement",
  versions: /.*/,
  baseClass: "QtQml.QtObject"
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);

    for (const i in meta.object) {
      if (i[0] !== "$") {
        QmlWeb.createProperty("variant", this, i);
      }
    }
    QmlWeb.applyProperties(meta.object, this, this, this.$context);
  }
});
