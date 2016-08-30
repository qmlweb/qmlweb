QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "FontLoader",
  versions: /.*/,
  baseClass: "QtQml.QtObject",
  enums: {
    FontLoader: { Null: 0, Ready: 1, Loading: 2, Error: 3 }
  },
  properties: {
    name: "string",
    source: "url",
    status: "enum" // FontLoader.Null
  }
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);

    this.$domStyle = document.createElement("style");
    this.$lastName = "";
    this.$inTouchName = false;

    /*
      Maximum timeout is the maximum time for a font to load. If font isn't
      loaded in this time, the status is set to Error.
      For both cases (with and without FontLoader.js) if the font takes more
      than the maximum timeout to load, dimensions recalculations for elements
      that are using this font will not be triggered or will have no effect.

      FontLoader.js uses only the last timeout. The state and name properties
      are set immediately when the font loads. If the font could not be loaded,
      the Error status will be set only when this timeout expires. If the font
      loading takes more than the timeout, the name property is set, but the
      status is set to Error.

      Fallback sets the font name immediately and touches it several times to
      trigger dimensions recalcuations. The status is set to Error and should
      not be used.
    */
    // 15 seconds maximum
    this.$timeouts = [20, 50, 100, 300, 500, 1000, 3000, 5000, 10000, 15000];

    this.sourceChanged.connect(this, this.$onSourceChanged);
    this.nameChanged.connect(this, this.$onNameChanged);
  }
  $loadFont(fontName) {
    /* global FontLoader */
    if (this.$lastName === fontName || this.$inTouchName) {
      return;
    }
    this.$lastName = fontName;

    if (!fontName) {
      this.status = this.FontLoader.Null;
      return;
    }
    this.status = this.FontLoader.Loading;
    if (typeof FontLoader === "function") {
      const fontLoader = new FontLoader([fontName], {
        fontsLoaded: error => {
          if (error !== null) {
            if (this.$lastName === fontName &&
                error.notLoadedFontFamilies[0] === fontName) {
              // Set the name for the case of font loading after the timeout.
              this.name = fontName;
              this.status = this.FontLoader.Error;
            }
          }
        },
        fontLoaded: fontFamily => {
          if (this.$lastName === fontName && fontFamily === fontName) {
            this.name = fontName;
            this.status = this.FontLoader.Ready;
          }
        }
      }, this.$timeouts[this.$timeouts.length - 1]);
      // Else I get problems loading multiple fonts (FontLoader.js bug?)
      FontLoader.testDiv = null;
      fontLoader.loadFonts();
    } else {
      console.warn(`FontLoader.js library is not loaded.
You should load FontLoader.js if you want to use QtQuick FontLoader elements.
Refs: https://github.com/smnh/FontLoader.`);
      // You should not rely on 'status' property without FontLoader.js.
      this.status = this.FontLoader.Error;
      this.name = fontName;
      this.$cycleTouchName(fontName, 0);
    }
  }
  $cycleTouchName(fontName, i) {
    if (this.$lastName !== fontName) {
      return;
    }
    if (i > 0) {
      const name = this.name;
      this.$inTouchName = true;
      // Calling this.nameChanged() is not enough, we have to actually change
      // the value to flush the bindings.
      this.name = "sans-serif";
      this.name = name;
      this.$inTouchName = false;
    }
    if (i < this.$timeouts.length) {
      setTimeout(() => {
        this.$cycleTouchName(fontName, i + 1);
      }, this.$timeouts[i] - (i > 0 ? this.$timeouts[i - 1] : 0));
    }
  }
  $onSourceChanged(font_src) {
    const rand = Math.round(Math.random() * 1e15);
    const fontName = `font_${Date.now().toString(36)}_${rand.toString(36)}`;
    this.$domStyle.innerHTML = `@font-face {
      font-family: ${fontName};
      src: url('${font_src}');
    }`;
    document.getElementsByTagName("head")[0].appendChild(this.$domStyle);
    this.$loadFont(fontName);
  }
  $onNameChanged(fontName) {
    this.$loadFont(fontName);
  }
});
