QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "Image",
  versions: /.*/,
  baseClass: "Item",
  enums: {
    Image: {
      Stretch: 1, PreserveAspectFit: 2, PreserveAspectCrop: 3,
      Tile: 4, TileVertically: 5, TileHorizontally: 6,

      Null: 1, Ready: 2, Loading: 3, Error: 4
    }
  },
  properties: {
    asynchronous: { type: "bool", initialValue: true },
    cache: { type: "bool", initialValue: true },
    smooth: { type: "bool", initialValue: true },
    fillMode: { type: "enum", initialValue: 1 }, // Image.Stretch
    mirror: "bool",
    progress: "real",
    source: "url",
    status: { type: "enum", initialValue: 1 } // Image.Null
  }
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);

    const createProperty = QmlWeb.createProperty;

    this.sourceSize = new QmlWeb.QObject(this);
    createProperty("int", this.sourceSize, "width");
    createProperty("int", this.sourceSize, "height");

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
        style.backgroundPosition = "auto";
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
  $onSourceChanged(val) {
    this.progress = 0;
    this.status = this.Image.Loading;
    const path = QmlWeb.engine.$resolvePath(val);
    this.impl.style.backgroundImage = `url('${path}')`;
    this.$img.src = path;
    if (this.$img.complete) {
      this.status = this.Image.Ready;
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
});
