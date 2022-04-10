// eslint-disable-next-line no-undef
class QtQuick_ListElement extends QtQml_QtObject {
  $setCustomData(propName, value) {
    QmlWeb.createProperty("variant", this, propName, {
      initialValue: value
    });
  }
}
