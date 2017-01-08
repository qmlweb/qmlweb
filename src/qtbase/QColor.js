/**RGBA of named colors */
const COLORS = {
  transparent: [0, 0, 0, 0],
  unknown: [0, 0, 0, 1],
};

const parseColorToArray = (function() {
  const COLOR_STRING_PARSER = [{
    re: /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d?(?:\.\d+)?)\s*)?\)/, // eslint-disable-line max-len
    parse(execResult) {
      return [
        execResult[1],
        execResult[2],
        execResult[3],
        execResult[4]
      ];
    }
  }, {
    re: /rgba?\(\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d?(?:\.\d+)?)\s*)?\)/, // eslint-disable-line max-len, no-useless-escape
    parse(execResult) {
      return [
        execResult[1] * 2.55,
        execResult[2] * 2.55,
        execResult[3] * 2.55,
        execResult[4]
      ];
    }
  }, {
    // hex with alpha
    // this regex ignores A-F , an already lowercased string
    re: /#([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})/,
    parse(execResult) {
      return [
        parseInt(execResult[2], 16),
        parseInt(execResult[3], 16),
        parseInt(execResult[4], 16),
        parseInt(execResult[1], 16) / 255
      ];
    }
  }, {
    re: /#([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})/,
    parse(execResult) {
      return [
        parseInt(execResult[1], 16),
        parseInt(execResult[2], 16),
        parseInt(execResult[3], 16),
        1
      ];
    }
  }, {
    re: /#([a-f0-9])([a-f0-9])([a-f0-9])/,
    parse(execResult) {
      return [
        parseInt(execResult[1] + execResult[1], 16),
        parseInt(execResult[2] + execResult[2], 16),
        parseInt(execResult[3] + execResult[3], 16),
        1
      ];
    }
  }, {
    re: /hsla?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d?(?:\.\d+)?)\s*)?\)/, // eslint-disable-line max-len, no-useless-escape
    space: "hsla",
    parse(execResult) {
      return [
        execResult[1],
        execResult[2] / 100,
        execResult[3] / 100,
        execResult[4]
      ];
    }
  }];
  const SPACES = {
    rgba: [
      "byte",
      "byte",
      "byte",
      "percent",
    ],
    hsla: [
      "degrees",
      "percent",
      "percent",
      "percent",
    ]
  };
  const PROP_TYPES_INFO = {
    byte: {
      floor: true,
      max: 255
    },
    percent: {
      max: 1
    },
    degrees: {
      mod: 360,
      floor: true
    }
  };

  function clamp(value, _prop_type) {
    if (value) {
      const type = PROP_TYPES_INFO[_prop_type];

      if (type.floor) { // fast parseInt
        value = value | 0; // eslint-disable-line no-param-reassign
      }

      if (type.mod) {
        const moded_value = value % type.mod;
        if (moded_value < 0) {
          // get converted properly: -10 -> 350
          return moded_value + type.mode;
        }
        return moded_value;
      }

      // for now all property types without mod have min and max
      return Math.min(type.max, Math.max(0, value));
    }
    return 0;
  }

  /**parseColorToArray*/
  return function(_color_string) {
    let rgba;
    if (typeof _color_string !== "string") { // empty color :white
      return COLORS.white;
    }

    _color_string = _color_string.toLowerCase(); // eslint-disable-line no-param-reassign, max-len
    if (COLORS.hasOwnProperty(_color_string)) {
      return COLORS[_color_string];
    }

    COLOR_STRING_PARSER.some(parser => {
      const match = parser.re.exec(_color_string);
      if (match) {
        const values = parser.parse(match);
        const spaceName = parser.space || "rgba";

        const props = SPACES[spaceName];

        rgba = [0, 0, 0, 0];

        props.forEach((_prop_type, i) => {
          rgba[i] = clamp(values[i], _prop_type);
        });

        // exit each( COLOR_STRING_PARSER ) here because we matched
        return true;
      }
      return false;
    });

    return rgba || COLORS.unknown; // wrong color :black
  };
}());

// [ColorKeywords](https://www.w3.org/TR/SVG/types.html#ColorKeywords)
(function() {
  const NAMED_COLORS = "Alicebluef0f8ffAntiquewhitefaebd7Aqua00ffffAquamarine7fffd4Azuref0ffffBeigef5f5dcBisqueffe4c4Black000000BlanchedalmondffebcdBlue0000ffBlueviolet8a2be2Browna52a2aBurlywooddeb887Cadetblue5f9ea0Chartreuse7fff00Chocolated2691eCoralff7f50Cornflowerblue6495edCornsilkfff8dcCrimsondc143cCyan00ffffDarkblue00008bDarkcyan008b8bDarkgoldenrodb8860bDarkgraya9a9a9Darkgreya9a9a9Darkgreen006400Darkkhakibdb76bDarkmagenta8b008bDarkolivegreen556b2fDarkorangeff8c00Darkorchid9932ccDarkred8b0000Darksalmone9967aDarkseagreen8fbc8fDarkslateblue483d8bDarkslategray2f4f4fDarkslategrey2f4f4fDarkturquoise00ced1Darkviolet9400d3Deeppinkff1493Deepskyblue00bfffDimgray696969Dimgrey696969Dodgerblue1e90ffFirebrickb22222Floralwhitefffaf0Forestgreen228b22Fuchsiaff00ffGainsborodcdcdcGhostwhitef8f8ffGoldffd700Goldenroddaa520Gray808080Grey808080Green008000Greenyellowadff2fHoneydewf0fff0Hotpinkff69b4Indianredcd5c5cIndigo4b0082Ivoryfffff0Khakif0e68cLavendere6e6faLavenderblushfff0f5Lawngreen7cfc00LemonchiffonfffacdLightblueadd8e6Lightcoralf08080Lightcyane0ffffLightgoldenrodyellowfafad2Lightgrayd3d3d3Lightgreyd3d3d3Lightgreen90ee90Lightpinkffb6c1Lightsalmonffa07aLightseagreen20b2aaLightskyblue87cefaLightslategray778899Lightslategrey778899Lightsteelblueb0c4deLightyellowffffe0Lime00ff00Limegreen32cd32Linenfaf0e6Magentaff00ffMaroon800000Mediumaquamarine66cdaaMediumblue0000cdMediumorchidba55d3Mediumpurple9370dbMediumseagreen3cb371Mediumslateblue7b68eeMediumspringgreen00fa9aMediumturquoise48d1ccMediumvioletredc71585Midnightblue191970Mintcreamf5fffaMistyroseffe4e1Moccasinffe4b5NavajowhiteffdeadNavy000080Oldlacefdf5e6Olive808000Olivedrab6b8e23Orangeffa500Orangeredff4500Orchidda70d6Palegoldenrodeee8aaPalegreen98fb98PaleturquoiseafeeeePalevioletreddb7093Papayawhipffefd5Peachpuffffdab9Perucd853fPinkffc0cbPlumdda0ddPowderblueb0e0e6Purple800080Rebeccapurple663399Redff0000Rosybrownbc8f8fRoyalblue4169e1Saddlebrown8b4513Salmonfa8072Sandybrownf4a460Seagreen2e8b57Seashellfff5eeSiennaa0522dSilverc0c0c0Skyblue87ceebSlateblue6a5acdSlategray708090Slategrey708090SnowfffafaSpringgreen00ff7fSteelblue4682b4Tand2b48cTeal008080Thistled8bfd8Tomatoff6347Turquoise40e0d0Violetee82eeWheatf5deb3WhiteffffffWhitesmokef5f5f5Yellowffff00Yellowgreen9acd32" // eslint-disable-line max-len
    .match(/[A-Z][0-9|a-z]+/g);
  NAMED_COLORS.forEach(name_and_values => {
    const color_name = name_and_values.substr(0, name_and_values.length - 6)
      .toLowerCase();
    const color_values = parseColorToArray(`#${name_and_values.substr(3)}`);
    COLORS[color_name] = color_values;
  });
}());

const COLOR_OUT_HANDLERS = {
  argb: values => {
    const leftpad = num => `0${(num | 0).toString(16)}`.substr(-2);
    const A = leftpad(values[3] * 255);
    const RGB = values.slice(0, 3).map(v => leftpad(v))
      .join("");
    return `#${A}${RGB}`;
  },
  hex: values => `#${values.slice(0, 3).map(v => (v | 0).toString(16)).join("")}`, // eslint-disable-line max-len, newline-per-chained-call
  rgba: values => `rgba(${values.map((v, i) => i < 3 ? v | 0 : v)})` // eslint-disable-line max-len, newline-per-chained-call, no-confusing-arrow
};
class QColor {
  // $value_rgba : array : [r,g,b,a]
  // $value : string : css color string
  // $value_argb : qml color string
  constructor(val) {
    let rgba = COLORS.unknown; // black
    if (val instanceof QColor) {
      // Copy constructor
      rgba = val.$value_rgba;
    } else if (typeof val === "string") {
      rgba = parseColorToArray(val);
    } else if (typeof val === "number") {
      // we assume it is int value and must be converted to css hex with padding
      const rgb = (Math.round(val) + 0x1000000).toString(16).substr(-6);
      rgba = parseColorToArray(`#${rgb}`);
    }
    this.$value_rgba = rgba;
    if (rgba[3] !== 1) {
      this.$value = COLOR_OUT_HANDLERS.rgba(rgba);
    } else {
      this.$value = COLOR_OUT_HANDLERS.hex(rgba);
    }
  }
  toString() {
    return this.$value;
  }
  $get() {
    // Returns the same instance for all equivalent colors.
    // NOTE: the returned value should not be changed using method calls, if
    // those would be added in the future, the returned value should be wrapped.
    if (!QColor.$colors[this.$value]) {
      if (QColor.$colorsCount >= QColor.comparableColorsLimit) {
        // Too many colors created, bail out to avoid memory hit
        return this;
      }
      QColor.$colors[this.$value] = this;
      QColor.$colorsCount++;
      if (QColor.$colorsCount === QColor.comparableColorsLimit) {
        console.warn(
          "QmlWeb: the number of QColor instances reached the limit set in",
          "QmlWeb.QColor.comparableColorsLimit. Further created colors would",
          "not be comparable to avoid memory hit."
        );
      }
    }
    return QColor.$colors[this.$value];
  }
}
QColor.$colors = {};
QColor.$colorsCount = 0;
QColor.comparableColorsLimit = 10000;
QmlWeb.QColor = QColor;
