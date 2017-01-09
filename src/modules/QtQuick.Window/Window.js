QmlWeb.registerQmlType({
  module: "QtQuick.Window",
  name: "Window",
  versions: /^2\./,
  baseClass: "QtQuick.Item",
  properties: {
    active: "bool",
    activeFocusItem: "Item",
    color: { type: "color", initialValue: "#ffffff" },
    //contentItem: "Item", // TODO
    contentOrientation: "enum",
    flags: "int",
    maximumHeight: "int",
    maximumWidth: "int",
    minimumHeight: "int",
    minimumWidth: "int",
    modality: "enum",
    title: "string",
    visibility: "enum"
  },
  signals: {
    closing: [{ type: "CloseEvent", name: "close" }]
  }
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);

    this.colorChanged.connect(this, this.$onColorChanged);
  }
  $onColorChanged(newVal) {
    this.dom.style.backgroundColor = newVal.$css;
  }
});
