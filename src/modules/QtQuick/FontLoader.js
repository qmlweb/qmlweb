registerQmlType({
  module:   'QtQuick',
  name:     'FontLoader',
  versions: /.*/,
  baseClass: 'QtQml.QtObject',
  constructor: function QMLFontLoader(meta) {
    callSuper(this, meta);

    // Exports.
    this.FontLoader = {
        // status
        Null: 0,
        Ready: 1,
        Loading: 2,
        Error: 3
    }

    createProperty("string", this, "name");
    createProperty("url", this, "source");
    createProperty("enum", this, "status");

    this.status = this.FontLoader.Null;

    var self = this,
        domStyle = document.createElement('style'),
        lastName = '',
        inTouchName = false;

    // Maximum timeout is the maximum time for a font to load. If font isn't loaded in this time, the status is set to Error.
    // For both cases (with and without FontLoader.js) if the font takes more than the maximum timeout to load,
    // dimensions recalculations for elements that are using this font will not be triggered or will have no effect.

    // FontLoader.js uses only the last timeout. The state and name properties are set immediately when the font loads.
    // If the font could not be loaded, the Error status will be set only when this timeout expires.
    // If the font loading takes more than the timeout, the name property is set, but the status is set to Error.

    // Fallback sets the font name immediately and touches it several times to trigger dimensions recalcuations.
    // The status is set to Error and should not be used.
    var timeouts = [20, 50, 100, 300, 500, 1000, 3000, 5000, 10000, 15000]; // 15 seconds maximum

    function cycleTouchName(fontName, i) {
        if (lastName !== fontName)
            return;
        if (i > 0) {
            var name = self.name;
            inTouchName = true;
            // Calling self.nameChanged() is not enough, we have to actually change the value to flush the bindings.
            self.name = 'sans-serif';
            self.name = name;
            inTouchName = false;
        }
        if (i < timeouts.length) {
            setTimeout(function() {
                cycleTouchName(fontName, i + 1);
            }, timeouts[i] - (i > 0 ? timeouts[i - 1] : 0));
        }
    }

    function loadFont(fontName) {
        if ((lastName === fontName) || inTouchName)
           return;
        lastName = fontName;

        if (!fontName) {
            self.status = self.FontLoader.Null;
            return;
        }
        self.status = self.FontLoader.Loading;
        if (typeof FontLoader !== 'undefined') {
            var fontLoader = new FontLoader([fontName], {
                "fontsLoaded": function(error) {
                    if (error !== null) {
                        if ((lastName === fontName) && (error.notLoadedFontFamilies[0] === fontName)) {
                            self.name = fontName; // Set the name for the case of font loading after the timeout.
                            self.status = self.FontLoader.Error;
                        }
                    }
                },
                "fontLoaded": function(fontFamily) {
                    if ((lastName === fontName) && (fontFamily == fontName)) {
                        self.name = fontName;
                        self.status = self.FontLoader.Ready;
                    }
                }
            }, timeouts[timeouts.length - 1]);
            FontLoader.testDiv = null; // Else I get problems loading multiple fonts (FontLoader.js bug?)
            fontLoader.loadFonts();
        } else {
            console.warn('FontLoader.js library is not loaded.\nYou should load https://github.com/smnh/FontLoader if you want to use QtQuick FontLoader elements.')
            self.status = self.FontLoader.Error; // You should not rely on 'status' property without FontLoader.js.
            self.name = fontName;
            cycleTouchName(fontName, 0)
        }
    }

    this.sourceChanged.connect(this, function(font_src) {
        var fontName = 'font_' + ((new Date()).getTime()).toString(36) + '_' + (Math.round(Math.random() * 1e15)).toString(36);
        domStyle.innerHTML = '@font-face { font-family: \'' + fontName + '\'; src: url(\'' + engine.$resolvePath(font_src) + '\'); }';
        document.getElementsByTagName('head')[0].appendChild(domStyle);
        loadFont(fontName);
    });

    this.nameChanged.connect(this, loadFont);
  }
});
