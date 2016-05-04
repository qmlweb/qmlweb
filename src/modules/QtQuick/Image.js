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
          this.dom.style.backgroundRepeat   = 'auto';
          this.dom.style.backgroundSize     = '100% 100%';
          this.dom.style.backgroundPosition = 'auto';
          break ;
        case this.Image.Tile:
          this.dom.style.backgroundRepeat   = 'auto';
          this.dom.style.backgroundSize     = 'auto';
          this.dom.style.backgroundPosition = 'auto';
          break ;
        case this.Image.PreserveAspectFit:
          this.dom.style.backgroundRepeat   = 'no-repeat';
          this.dom.style.backgroundSize     = 'contain';
          this.dom.style.backgroundPosition = 'center';
          break ;
        case this.Image.PreserveAspectCrop:
          this.dom.style.backgroundRepeat   = 'no-repeat';
          this.dom.style.backgroundSize     = 'cover';
          this.dom.style.backgroundPosition = 'center';
          break ;
        case this.Image.TileVertically:
          this.dom.style.backgroundRepeat   = 'repeat-y';
          this.dom.style.backgroundSize     = '100% auto';
          this.dom.style.backgroundPosition = 'auto';
          break ;
        case this.Image.TileHorizontally:
          this.dom.style.backgroundRepeat   = 'repeat-x';
          this.dom.style.backgroundSize     = 'auto 100%';
          this.dom.style.backgroundPosition = 'auto';
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
        this.dom.style.backgroundImage="url('" + engine.$resolvePath(val) + "')";
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
