QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "ListElement",
  versions: /.*/,
  baseClass: "QtQml.QtObject"
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);

    const createProperty = QmlWeb.createProperty;
    for (const i in meta.object) {
      if (i[0] !== "$") {
        createProperty("variant", this, i);
      }
    }
    QmlWeb.applyProperties(meta.object, this, this, this.$context);
  }
});
