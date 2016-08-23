QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "Rectangle",
  versions: /.*/,
  baseClass: "Item",
  properties: {
    color: { type: "color", initialValue: "white" },
    radius: "real"
  }
}, class {
  constructor(meta) {
    callSuper(this, meta);

    const createProperty = QmlWeb.createProperty;
    this.border = new QmlWeb.QObject(this);
    createProperty("color", this.border, "color", { initialValue: "black" });
    createProperty("int", this.border, "width", { initialValue: 1 });

    const bg = this.impl = document.createElement("div");
    bg.style.pointerEvents = "none";
    bg.style.position = "absolute";
    bg.style.left = bg.style.right = bg.style.top = bg.style.bottom = "0px";
    bg.style.borderWidth = "0px";
    bg.style.borderStyle = "solid";
    bg.style.borderColor = "black";
    bg.style.backgroundColor = "white";
    this.dom.appendChild(bg);

    this.colorChanged.connect(this, this.$onColorChanged);
    this.radiusChanged.connect(this, this.$onRadiusChanged);
    this.border.colorChanged.connect(this, this.border$onColorChanged);
    this.border.widthChanged.connect(this, this.border$onWidthChanged);
    this.widthChanged.connect(this, this.$updateBorder);
    this.heightChanged.connect(this, this.$updateBorder);
  }
  $onColorChanged(newVal) {
    this.impl.style.backgroundColor = new QmlWeb.QColor(newVal);
  }
  border$onColorChanged(newVal) {
    const style = this.impl.style;
    style.borderColor = new QmlWeb.QColor(newVal);
    if (style.borderWidth === "0px") {
      style.borderWidth = `${this.border.width}px`;
    }
    this.$updateBorder();
  }
  border$onWidthChanged(newVal) {
    // ignore negative border width
    if (newVal < 0) {
      this.impl.style.borderWidth = "0px";
      return;
    }
    this.$updateBorder();
  }
  $onRadiusChanged(newVal) {
    this.impl.style.borderRadius = `${newVal}px`;
  }
  $updateBorder() {
    const size = this.border.width;
    const style = this.impl.style;

    // ignore negative border width
    if (size < 0) {
      return;
    }

    // no Rectangle border width was set yet
    if ((size === 1 || typeof size === "undefined") &&
        style.borderWidth === "0px") {
      return;
    }

    let topBottom = typeof size === "undefined" ?
                      style.borderWidth :
                      `${size}px`;
    let leftRight = topBottom;

    style.borderTopWidth = topBottom;
    style.borderBottomWidth = topBottom;
    style.borderLeftWidth = leftRight;
    style.borderRightWidth = leftRight;

    // hide border if any of dimensions is less then one
    if (this.width <= 0 || typeof this.width === "undefined" ||
        this.height <= 0 || typeof this.height === "undefined") {
      style.borderWidth = "0px";
      return;
    }

    // check if border is not greater than Rectangle size
    // react by change of width or height of div (in css)
    if (this.height < 2 * this.border.width) {
      topBottom = `${this.height / 2}px`;
      style.height = "0px";
    } else if (this.height > 2 && this.height < 3 * this.border.width) {
      // TODO: what??
      const height = this.height % 2
                        ? -1
                        : -2 + 2 * this.height - 2 * this.border.width;
      style.height = `${height}px`;
    }

    if (this.width < 2 * this.border.width) {
      leftRight = `${this.width / 2}px`;
      style.width = "0px";
    } else if (this.width > 2 && this.width < 3 * this.border.width) {
      // TODO: what??
      const width = this.width % 2
                      ? -1
                      : -2 + 2 * this.width - 2 * this.border.width;
      style.width = `${width}px`;
    }

    style.borderTopWidth = topBottom;
    style.borderBottomWidth = topBottom;
    style.borderLeftWidth = leftRight;
    style.borderRightWidth = leftRight;
  }
});
