QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "BorderImage",
  versions: /.*/,
  baseClass: "Item",
  enums: {
    BorderImage: {
      Stretch: "stretch", Repeat: "repeat", Round: "round",
      Null: 1, Ready: 2, Loading: 3, Error: 4
    }
  },
  properties: {
    source: "url",
    // BorderImage.Stretch
    horizontalTileMode: { type: "enum", initialValue: "stretch" },
    // BorderImage.Stretch
    verticalTileMode: { type: "enum", initialValue: "stretch" },
    status: { type: "enum", initialValue: 1 } // BorderImage.Null
  }
}, class {
  constructor(meta) {
    callSuper(this, meta);

    const createProperty = QmlWeb.createProperty;
    this.border = new QmlWeb.QObject(this);
    createProperty("int", this.border, "left");
    createProperty("int", this.border, "right");
    createProperty("int", this.border, "top");
    createProperty("int", this.border, "bottom");

    this.sourceChanged.connect(this, this.$onSourceChanged);
    this.border.leftChanged.connect(this, this.$updateBorder);
    this.border.rightChanged.connect(this, this.$updateBorder);
    this.border.topChanged.connect(this, this.$updateBorder);
    this.border.bottomChanged.connect(this, this.$updateBorder);
    this.horizontalTileModeChanged.connect(this, this.$updateBorder);
    this.verticalTileModeChanged.connect(this, this.$updateBorder);
  }
  $onSourceChanged() {
    const style = this.dom.style;
    const path = QmlWeb.engine.$resolvePath(this.source);
    style.OBorderImageSource = `url(${path})`;
    style.borderImageSource = `url(${path})`;
  }
  $updateBorder() {
    const style = this.dom.style;
    const { right, left, top, bottom } = this.border;
    const slice = `${top} ${right} ${bottom} ${left} fill`;
    const width = `${top}px ${right}px ${bottom}px ${left}px`;
    const repeat = `${this.horizontalTileMode} ${this.verticalTileMode}`;
    style.OBorderImageSlice = slice;
    style.OBorderImageRepeat = repeat;
    style.OBorderImageWidth = width;
    style.borderImageSlice = slice;
    style.borderImageRepeat = repeat;
    style.borderImageWidth = width;
  }
});
