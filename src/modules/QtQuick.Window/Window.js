// eslint-disable-next-line no-undef
class QtQuick_Window_Window extends QtQuick_Item {
  static versions = /^2\./;
  static properties = {
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
  };
  static signals = {
    closing: [{ type: "CloseEvent", name: "close" }]
  };

  constructor(meta) {
    super(meta);

    this.colorChanged.connect(this, this.$onColorChanged);
  }
  $onColorChanged(newVal) {
    this.dom.style.backgroundColor = newVal.$css;
  }
}
