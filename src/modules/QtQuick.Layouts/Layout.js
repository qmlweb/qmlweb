// eslint-disable-next-line no-undef
class QtQuick_Layouts_Layout extends QtQml_QtObject {
  static versions = /^1\./;

  constructor(meta) {
    super(meta);
    throw new Error("Do not create objects of type Layout");
  }
  static getAttachedObject() {
    if (!this.$Layout) {
      this.$Layout = new QmlWeb.QObject(this);
      QmlWeb.createProperties(this.$Layout, {
        alignment: "enum",
        bottomMargin: "real",
        column: "int",
        columnSpan: "int",
        fillHeight: "bool",
        fillWidth: "bool",
        leftMargin: "real",
        margins: "real",
        maximumHeight: "real",
        maximumWidth: "real",
        minimumHeight: "real",
        minimumWidth: "real",
        preferredHeight: "real",
        preferredWidth: "real",
        rightMargin: "real",
        row: "int",
        rowSpan: "int",
        topMargin: "real"
      });
    }
    return this.$Layout;
  }
}
