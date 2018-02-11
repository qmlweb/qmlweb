// eslint-disable-next-line no-undef
class QtQuick_ListElement extends QtQml_QtObject {
  constructor(meta) {
    super(meta);

    for (const i in meta.object) {
      if (i[0] !== "$") {
        QmlWeb.createProperty("variant", this, i);
      }
    }
    QmlWeb.applyProperties(meta.object, this, this, this.$context);
  }
}
