function QMLImage(meta) {
    callSuper(this, meta);
    var img = new Image(),
        self = this;

    // Exports.
    this.Image = {
        // fillMode
        Stretch: 1,
        PreserveAspectFit: 2,
        PreserveAspectCrop: 3,
        Tile: 4,
        TileVertically: 5,
        TileHorizontally: 6,
        // status
        Null: 1,
        Ready: 2,
        Loading: 3,
        Error: 4
    }

    // no-op properties
    createProperty("bool", this, "asynchronous", {initialValue: true});
    createProperty("bool", this, "cache", {initialValue: true});
    createProperty("bool", this, "smooth", {initialValue: true});

    createProperty("enum", this, "fillMode", {initialValue: this.Image.Stretch});
    createProperty("bool", this, "mirror");
    createProperty("real", this, "progress");
    createProperty("url", this, "source");
    createProperty("enum", this, "status", {initialValue: this.Image.Null});

    this.sourceSize = new QObject(this);

    createProperty("int", this.sourceSize, "width");
    createProperty("int", this.sourceSize, "height");

    const bg = this.impl = document.createElement('div');
    bg.style.pointerEvents = 'none';
    bg.style.height = '100%';
    this.dom.appendChild(bg);

    // Bind status to img element
    img.onload = function() {
        var w = img.naturalWidth;
        var h = img.naturalHeight;
        self.sourceSize.width = w;
        self.sourceSize.height = h;
        self.implicitWidth = w;
        self.implicitHeight = h;

        self.progress = 1;
        self.status = self.Image.Ready;
    }
    img.onerror = function() {
        self.status = self.Image.Error;
    }

    var updateFillMode = function(val) {
      if (typeof val == 'undefined')
        val = this.fillMode;
      switch (val) {
        default:
        case this.Image.Stretch:
          bg.style.backgroundRepeat   = 'auto';
          bg.style.backgroundSize     = '100% 100%';
          bg.style.backgroundPosition = 'auto';
          break ;
        case this.Image.Tile:
          bg.style.backgroundRepeat   = 'auto';
          bg.style.backgroundSize     = 'auto';
          bg.style.backgroundPosition = 'auto';
          break ;
        case this.Image.PreserveAspectFit:
          bg.style.backgroundRepeat   = 'no-repeat';
          bg.style.backgroundSize     = 'contain';
          bg.style.backgroundPosition = 'center';
          break ;
        case this.Image.PreserveAspectCrop:
          bg.style.backgroundRepeat   = 'no-repeat';
          bg.style.backgroundSize     = 'cover';
          bg.style.backgroundPosition = 'center';
          break ;
        case this.Image.TileVertically:
          bg.style.backgroundRepeat   = 'repeat-y';
          bg.style.backgroundSize     = '100% auto';
          bg.style.backgroundPosition = 'auto';
          break ;
        case this.Image.TileHorizontally:
          bg.style.backgroundRepeat   = 'repeat-x';
          bg.style.backgroundSize     = 'auto 100%';
          bg.style.backgroundPosition = 'auto';
          break ;
      }
    }
    updateFillMode = updateFillMode.bind(this);

    var updateMirroring = (function(val) {
      var transformRule = 'scale(-1,1)';
      if (!val)
      {
        var index = this.transform.indexOf(transformRule);

        if (index >= 0)
          this.transform.splice(index, 1);
      }
      else
        this.transform.push(transformRule);
      this.$updateTransform();
    }).bind(this);

    this.sourceChanged.connect(this, function(val) {
        this.progress = 0;
        this.status = this.Image.Loading;
        bg.style.backgroundImage="url('" + engine.$resolvePath(val) + "')";
        img.src = engine.$resolvePath(val);
        if (img.complete)
          this.status = this.Image.Ready;
        updateFillMode();
    });

    this.mirrorChanged.connect  (this, updateMirroring);
    this.fillModeChanged.connect(this, updateFillMode);
}

registerQmlType({
  module: 'QtQuick',
  name:   'Image',
  versions: /.*/,
  baseClass: 'Item',
  constructor: QMLImage
});
