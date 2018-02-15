// eslint-disable-next-line no-undef
class QtQuick_Image extends QtQuick_Item {
  static enums = {
    Image: {
      Stretch: 1, PreserveAspectFit: 2, PreserveAspectCrop: 3,
      Tile: 4, TileVertically: 5, TileHorizontally: 6,

      Null: 1, Ready: 2, Loading: 3, Error: 4
    }
  };
  static properties = {
    asynchronous: { type: "bool", initialValue: true },
    cache: { type: "bool", initialValue: true },
    smooth: { type: "bool", initialValue: true },
    fillMode: { type: "enum", initialValue: 1 }, // Image.Stretch
    mirror: "bool",
    progress: "real",
    source: "url",
    status: { type: "enum", initialValue: 1 } // Image.Null
  };

  constructor(meta) {
    super(meta);

    this.sourceSize = new QmlWeb.QObject(this);
    QmlWeb.createProperties(this.sourceSize, {
      width: "int",
      height: "int"
    });

    const bg = this.impl = document.createElement("div");
    bg.style.pointerEvents = "none";
    bg.style.height = "100%";
    this.dom.appendChild(bg);

    this.$img = new Image();
    this.$img.addEventListener("load", () => {
      const w = this.$img.naturalWidth;
      const h = this.$img.naturalHeight;
      this.sourceSize.width = w;
      this.sourceSize.height = h;
      this.implicitWidth = w;
      this.implicitHeight = h;
      this.progress = 1;
      this.status = this.Image.Ready;
    });
    this.$img.addEventListener("error", () => {
      this.status = this.Image.Error;
    });

    this.sourceChanged.connect(this, this.$onSourceChanged);
    this.mirrorChanged.connect(this, this.$onMirrorChanged);
    this.fillModeChanged.connect(this, this.$onFillModeChanged);
    this.smoothChanged.connect(this, this.$onSmoothChanged);
  }
  $updateFillMode(val = this.fillMode) {
    const style = this.impl.style;
    switch (val) {
      default:
      case this.Image.Stretch:
        style.backgroundRepeat = "auto";
        style.backgroundSize = "100% 100%";
        style.backgroundPosition = "auto";
        break;
      case this.Image.Tile:
        style.backgroundRepeat = "auto";
        style.backgroundSize = "auto";
        style.backgroundPosition = "center";
        break;
      case this.Image.PreserveAspectFit:
        style.backgroundRepeat = "no-repeat";
        style.backgroundSize = "contain";
        style.backgroundPosition = "center";
        break;
      case this.Image.PreserveAspectCrop:
        style.backgroundRepeat = "no-repeat";
        style.backgroundSize = "cover";
        style.backgroundPosition = "center";
        break;
      case this.Image.TileVertically:
        style.backgroundRepeat = "repeat-y";
        style.backgroundSize = "100% auto";
        style.backgroundPosition = "auto";
        break;
      case this.Image.TileHorizontally:
        style.backgroundRepeat = "repeat-x";
        style.backgroundSize = "auto 100%";
        style.backgroundPosition = "auto";
        break;
    }
  }
  $onSourceChanged(source) {
    this.progress = 0;
    this.status = this.Image.Loading;
    const imageURL = QmlWeb.engine.$resolveImageURL(source);
    this.impl.style.backgroundImage = `url("${imageURL}")`;
    this.$img.src = imageURL;
    if (this.$img.complete) {
      setTimeout(() => {
        this.progress = 1;
        this.status = this.Image.Ready;
      }, 0);
    }
    this.$updateFillMode();
  }
  $onMirrorChanged(val) {
    const transformRule = "scale(-1,1)";
    if (!val) {
      const index = this.transform.indexOf(transformRule);
      if (index >= 0) {
        this.transform.splice(index, 1);
      }
    } else {
      this.transform.push(transformRule);
    }
    this.$updateTransform();
  }
  $onFillModeChanged(val) {
    this.$updateFillMode(val);
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
