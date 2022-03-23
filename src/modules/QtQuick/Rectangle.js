// eslint-disable-next-line no-undef
class QtQuick_Rectangle extends QtQuick_Item {
  static properties = {
    color: { type: "color", initialValue: "white" },
    radius: "real",
    gradient: "gradient"
  };

  constructor(meta) {
    super(meta);

    this.border = new QmlWeb.QObject(this);
    QmlWeb.createProperties(this.border, {
      color: { type: "color", initialValue: "black" },
      width: { type: "int", initialValue: 1 }
    });
    this.$borderActive = false;

    const bg = this.impl = document.createElement("div");
    bg.style.pointerEvents = "none";
    bg.style.position = "absolute";
    bg.style.left = bg.style.right = bg.style.top = bg.style.bottom = "0px";
    bg.style.borderWidth = "0px";
    bg.style.borderStyle = "solid";
    bg.style.borderColor = this.border.color.$css;
    bg.style.backgroundColor = this.color.$css;
    this.dom.appendChild(bg);

    this.colorChanged.connect(this, this.$onColorChanged);
    this.radiusChanged.connect(this, this.$onRadiusChanged);
    this.border.colorChanged.connect(this, this.border$onColorChanged);
    this.border.widthChanged.connect(this, this.border$onWidthChanged);
    this.widthChanged.connect(this, this.$updateBorder);
    this.heightChanged.connect(this, this.$updateBorder);
  }
  $onColorChanged(newVal) {
    this.impl.style.backgroundColor = newVal.$css;
  }
  border$onColorChanged(newVal) {
    this.$borderActive = true;
    this.impl.style.borderColor = newVal.$css;
    this.$updateBorder();
  }
  border$onWidthChanged() {
    this.$borderActive = true;
    this.$updateBorder();
  }
  $onRadiusChanged(newVal) {
    this.impl.style.borderRadius = `${newVal}px`;
  }
  $updateBorder() {
    const border = this.$borderActive ? Math.max(0, this.border.width) : 0;
    const style = this.impl.style;
    if (border * 2 > this.width || border * 2 > this.height) {
      // Border is covering the whole background
      style.borderWidth = "0px";
      style.borderTopWidth = `${this.height}px`;
    } else {
      style.borderWidth = `${border}px`;
    }
  }
}
