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
        bottomMargin: { type: "real", initialValue: null },
        column: "int",
        columnSpan: { type: "int", initialValue: 1 },
        fillHeight: "bool",
        fillWidth: "bool",
        leftMargin: { type: "real", initialValue: null },
        margins: "real",
        maximumHeight: "real",
        maximumWidth: "real",
        minimumHeight: "real",
        minimumWidth: "real",
        preferredHeight: "real",
        preferredWidth: "real",
        rightMargin: { type: "real", initialValue: null },
        row: "int",
        rowSpan: { type: "int", initialValue: 1 },
        topMargin: { type: "real", initialValue: null }
      });
    }
    return this.$Layout;
  }
}
