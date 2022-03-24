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
        column: { type: "int", initialValue: null },
        columnSpan: { type: "int", initialValue: 1 },
        fillHeight: { type: "bool", initialValue: null },
        fillWidth: { type: "bool", initialValue: null },
        leftMargin: { type: "real", initialValue: null },
        margins: "real",
        maximumHeight: "real",
        maximumWidth: "real",
        minimumHeight: "real",
        minimumWidth: "real",
        preferredHeight: "real",
        preferredWidth: "real",
        rightMargin: { type: "real", initialValue: null },
        row: { type: "int", initialValue: null },
        rowSpan: { type: "int", initialValue: 1 },
        topMargin: { type: "real", initialValue: null }
      });
    }
    return this.$Layout;
  }
}
