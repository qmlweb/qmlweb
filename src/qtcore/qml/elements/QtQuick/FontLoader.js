registerQmlType({
    module: 'QtQuick',
    name: 'FontLoader',
    versions: /.*/,
    constructor: function QMLFontLoader(meta) {
        QMLBaseObject.call(this, meta);

        this.FontLoader = {
            Null: 0,
            Ready: 1,
            Loading: 2,
            Error: 3
        }

        createSimpleProperty("string", this, "name");
        createSimpleProperty("url", this, "source");
        createSimpleProperty("enum", this, "status");

        this.status = this.FontLoader.Null;

        var self = this,
            domStyle = document.createElement('style'),
            lastName = '',
            inTouchName = false;

        var timeouts = [20, 50, 100, 300, 500, 1000, 3000, 5000, 10000, 15000];

        function cycleTouchName(fontName, i) {
            if (lastName !== fontName)
                return;
            if (i > 0) {
                var name = self.name;
                inTouchName = true;
                self.name = 'sans-serif';
                self.name = name;
                inTouchName = false;
            }
            if (i < timeouts.length) {
                setTimeout(function () {
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
                    "fontsLoaded": function (error) {
                        if (error !== null) {
                            if ((lastName === fontName) && (error.notLoadedFontFamilies[0] === fontName)) {
                                self.name = fontName;
                                self.status = self.FontLoader.Error;
                            }
                        }
                    },
                    "fontLoaded": function (fontFamily) {
                        if ((lastName === fontName) && (fontFamily == fontName)) {
                            self.name = fontName;
                            self.status = self.FontLoader.Ready;
                        }
                    }
                }, timeouts[timeouts.length - 1]);
                FontLoader.testDiv = null;
                fontLoader.loadFonts();
            } else {
                console.warn('FontLoader.js library is not loaded.\nYou should load https://github.com/smnh/FontLoader if you want to use QtQuick FontLoader elements.')
                self.status = self.FontLoader.Error;
                self.name = fontName;
                cycleTouchName(fontName, 0)
            }
        }

        this.sourceChanged.connect(this, function (font_src) {
            var fontName = 'font_' + ((new Date()).getTime()).toString(36) + '_' + (Math.round(Math.random() * 1e15)).toString(36);
            domStyle.innerHTML = '@font-face { font-family: \'' + fontName + '\'; src: url(\'' + engine.$resolvePath(font_src) + '\'); }';
            document.getElementsByTagName('head')[0].appendChild(domStyle);
            loadFont(fontName);
        });

        this.nameChanged.connect(this, loadFont);
    }
});
