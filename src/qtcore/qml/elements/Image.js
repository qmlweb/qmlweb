function QMLImage(meta) {
    QMLItem.call(this, meta);
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
    createSimpleProperty("bool", this, "asynchronous");
    createSimpleProperty("bool", this, "cache");
    createSimpleProperty("bool", this, "smooth");

    createSimpleProperty("enum", this, "fillMode");
    createSimpleProperty("bool", this, "mirror");
    createSimpleProperty("real", this, "progress");
    createSimpleProperty("url", this, "source");
    createSimpleProperty("enum", this, "status");

    this.sourceSize = new QObject(this);

    createSimpleProperty("int", this.sourceSize, "width");
    createSimpleProperty("int", this.sourceSize, "height");

    this.asynchronous = true;
    this.cache = true;
    this.smooth = true;
    this.fillMode = this.Image.Stretch;
    this.mirror = false;
    this.progress = 0;
    this.source = "";
    this.status = this.Image.Null;
    this.sourceSize.width = 0;
    this.sourceSize.height = 0;

    // Bind status to img element
    img.onload = function() {
        self.progress = 1;
        self.status = self.Image.Ready;

        var w = img.naturalWidth;
        var h = img.naturalHeight;
        self.sourceSize.width = w;
        self.sourceSize.height = h;
        self.implicitWidth = w;
        self.implicitHeight = h;
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

    this.sourceChanged.connect(this, function(val) {
        this.progress = 0;
        this.status = this.Image.Loading;
        this.dom.style.backgroundImage="url('" + engine.$resolvePath(val) + "')";
        img.src = engine.$resolvePath(val);
        updateFillMode();
    });

    this.fillModeChanged.connect(this, updateFillMode);
    this.$drawItem = function(c) {
        //descr("draw image", this, ["left", "top", "width", "height", "source"]);

        updateFillMode();

        if (this.status == this.Image.Ready) {
            c.save();
            c.drawImage(img, this.left, this.top, this.width, this.height);
            c.restore();
        } else {
            console.log("Waiting for image to load");
        }
    }
}

registerQmlType('Image', QMLImage);
