// eslint-disable-next-line no-undef
class QtQuick_BorderImage extends QtQuick_Item {
  static enums = {
    BorderImage: {
      Stretch: "stretch", Repeat: "repeat", Round: "round",
      Null: 1, Ready: 2, Loading: 3, Error: 4
    }
  };
  static properties = {
    source: "url",
    smooth: { type: "bool", initialValue: true },
    // BorderImage.Stretch
    horizontalTileMode: { type: "enum", initialValue: "stretch" },
    // BorderImage.Stretch
    verticalTileMode: { type: "enum", initialValue: "stretch" },
    progress: "real",
    status: { type: "enum", initialValue: 1 } // BorderImage.Null
  };

  constructor(meta) {
    super(meta);

    this.border = new QmlWeb.QObject(this);
    QmlWeb.createProperties(this.border, {
      left: "int",
      right: "int",
      top: "int",
      bottom: "int"
    });

    const bg = this.impl = document.createElement("div");
    bg.style.pointerEvents = "none";
    bg.style.height = "100%";
    bg.style.boxSizing = "border-box";
    this.dom.appendChild(bg);

    this.$img = new Image();
    this.$img.addEventListener("load", () => {
      this.progress = 1;
      this.status = this.BorderImage.Ready;
    });
    this.$img.addEventListener("error", () => {
      this.status = this.BorderImage.Error;
    });

    this.sourceChanged.connect(this, this.$onSourceChanged);
    this.border.leftChanged.connect(this, this.$updateBorder);
    this.border.rightChanged.connect(this, this.$updateBorder);
    this.border.topChanged.connect(this, this.$updateBorder);
    this.border.bottomChanged.connect(this, this.$updateBorder);
    this.horizontalTileModeChanged.connect(this, this.$updateBorder);
    this.verticalTileModeChanged.connect(this, this.$updateBorder);
    this.smoothChanged.connect(this, this.$onSmoothChanged);
  }
  $onSourceChanged(source) {
    this.progress = 0;
    this.status = this.BorderImage.Loading;
    const style = this.impl.style;
    const imageURL = QmlWeb.engine.$resolveImageURL(source);
    style.OBorderImageSource = `url("${imageURL}")`;
    style.borderImageSource = `url("${imageURL}")`;
    this.$img.src = imageURL;
    if (this.$img.complete) {
      this.progress = 1;
      this.status = this.BorderImage.Ready;
    }
  }
  $updateBorder() {
    const style = this.impl.style;
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
  $onSmoothChanged(val) {
    const style = this.impl.style;
    if (val) {
      style.imageRendering = "auto";
    } else {
      style.imageRendering = "-webkit-optimize-contrast";
      style.imageRendering = "-moz-crisp-edges";
      style.imageRendering = "crisp-edges";
      style.imageRendering = "pixelated";
    }
  }
}
