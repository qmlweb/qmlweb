// eslint-disable-next-line no-undef
class QtQuick_Controls_2_AbstractButton extends QtQuick_Controls_2_Control {
  static versions = /^2\./;
  static properties = {
    action: "Action",
    autoExclusive: "bool",
    checkable: "bool",
    checked: "bool",
    display: "enum",
    // icon is defined manually
    down: "bool",
    indicator: "Item",
    pressed: "bool",
    text: "string"
  };

  constructor(meta) {
    super(meta);

    this.icon = new QmlWeb.QObject(this);
    QmlWeb.createProperties(this.icon, {
      name: "string",
      source: "url",
      width: "int",
      height: "int",
      color: "color"
    });

    // TODO
  }
}
