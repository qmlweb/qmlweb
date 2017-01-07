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

const NAMED_COLOR_TABLE = {
  aliceblue: "f0f8ff",
  antiquewhite: "faebd7",
  aqua: "00ffff",
  aquamarine: "7fffd4",
  azure: "f0ffff",
  beige: "f5f5dc",
  bisque: "ffe4c4",
  black: "000000",
  blanchedalmond: "ffebcd",
  blue: "0000ff",
  blueviolet: "8a2be2",
  brown: "a52a2a",
  burlywood: "deb887",
  cadetblue: "5f9ea0",
  chartreuse: "7fff00",
  chocolate: "d2691e",
  coral: "ff7f50",
  cornflowerblue: "6495ed",
  cornsilk: "fff8dc",
  crimson: "dc143c",
  cyan: "00ffff",
  darkblue: "00008b",
  darkcyan: "008b8b",
  darkgoldenrod: "b8860b",
  darkgray: "a9a9a9",
  darkgrey: "a9a9a9",
  darkgreen: "006400",
  darkkhaki: "bdb76b",
  darkmagenta: "8b008b",
  darkolivegreen: "556b2f",
  darkorange: "ff8c00",
  darkorchid: "9932cc",
  darkred: "8b0000",
  darksalmon: "e9967a",
  darkseagreen: "8fbc8f",
  darkslateblue: "483d8b",
  darkslategray: "2f4f4f",
  darkslategrey: "2f4f4f",
  darkturquoise: "00ced1",
  darkviolet: "9400d3",
  deeppink: "ff1493",
  deepskyblue: "00bfff",
  dimgray: "696969",
  dimgrey: "696969",
  dodgerblue: "1e90ff",
  firebrick: "b22222",
  floralwhite: "fffaf0",
  forestgreen: "228b22",
  fuchsia: "ff00ff",
  gainsboro: "dcdcdc",
  ghostwhite: "f8f8ff",
  gold: "ffd700",
  goldenrod: "daa520",
  gray: "808080",
  grey: "808080",
  green: "008000",
  greenyellow: "adff2f",
  honeydew: "f0fff0",
  hotpink: "ff69b4",
  indianred: "cd5c5c",
  indigo: "4b0082",
  ivory: "fffff0",
  khaki: "f0e68c",
  lavender: "e6e6fa",
  lavenderblush: "fff0f5",
  lawngreen: "7cfc00",
  lemonchiffon: "fffacd",
  lightblue: "add8e6",
  lightcoral: "f08080",
  lightcyan: "e0ffff",
  lightgoldenrodyellow: "fafad2",
  lightgray: "d3d3d3",
  lightgrey: "d3d3d3",
  lightgreen: "90ee90",
  lightpink: "ffb6c1",
  lightsalmon: "ffa07a",
  lightseagreen: "20b2aa",
  lightskyblue: "87cefa",
  lightslategray: "778899",
  lightslategrey: "778899",
  lightsteelblue: "b0c4de",
  lightyellow: "ffffe0",
  lime: "00ff00",
  limegreen: "32cd32",
  linen: "faf0e6",
  magenta: "ff00ff",
  maroon: "800000",
  mediumaquamarine: "66cdaa",
  mediumblue: "0000cd",
  mediumorchid: "ba55d3",
  mediumpurple: "9370db",
  mediumseagreen: "3cb371",
  mediumslateblue: "7b68ee",
  mediumspringgreen: "00fa9a",
  mediumturquoise: "48d1cc",
  mediumvioletred: "c71585",
  midnightblue: "191970",
  mintcream: "f5fffa",
  mistyrose: "ffe4e1",
  moccasin: "ffe4b5",
  navajowhite: "ffdead",
  navy: "000080",
  oldlace: "fdf5e6",
  olive: "808000",
  olivedrab: "6b8e23",
  orange: "ffa500",
  orangered: "ff4500",
  orchid: "da70d6",
  palegoldenrod: "eee8aa",
  palegreen: "98fb98",
  paleturquoise: "afeeee",
  palevioletred: "db7093",
  papayawhip: "ffefd5",
  peachpuff: "ffdab9",
  peru: "cd853f",
  pink: "ffc0cb",
  plum: "dda0dd",
  powderblue: "b0e0e6",
  purple: "800080",
  rebeccapurple: "663399",
  red: "ff0000",
  rosybrown: "bc8f8f",
  royalblue: "4169e1",
  saddlebrown: "8b4513",
  salmon: "fa8072",
  sandybrown: "f4a460",
  seagreen: "2e8b57",
  seashell: "fff5ee",
  sienna: "a0522d",
  silver: "c0c0c0",
  skyblue: "87ceeb",
  slateblue: "6a5acd",
  slategray: "708090",
  slategrey: "708090",
  snow: "fffafa",
  springgreen: "00ff7f",
  steelblue: "4682b4",
  tan: "d2b48c",
  teal: "008080",
  thistle: "d8bfd8",
  tomato: "ff6347",
  turquoise: "40e0d0",
  violet: "ee82ee",
  wheat: "f5deb3",
  white: "ffffff",
  whitesmoke: "f5f5f5",
  yellow: "ffff00",
  yellowgreen: "9acd32",
};

const colors = {
  transparent: [0, 0, 0, 0],
  unkonw: [0, 0, 0, 1],
};
for (const color_name in NAMED_COLOR_TABLE) {
  if (NAMED_COLOR_TABLE.hasOwnProperty(color_name)) {
    const color_rgb = NAMED_COLOR_TABLE[color_name];
    colors[color_name] = [
      parseInt(color_rgb.slice(0, 2), 16),
      parseInt(color_rgb.slice(2, 4), 16),
      parseInt(color_rgb.slice(4), 16),
      1
    ];
  }
}


function parseColorToArray(_color_string) {
  let rgba;
  if (typeof _color_string !== "string") { // empty color :white
    return colors.white;
  }

  _color_string = _color_string.toLowerCase(); // eslint-disable-line no-param-reassign, max-len
  if (colors.hasOwnProperty(_color_string)) {
    return colors[_color_string];
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

  return rgba || colors.unkonw; // wrong color :black
}
QmlWeb.Qt.parseColorToArray = parseColorToArray;

const OUT_HANDLER = {
  hex: values => `#${values.slice(0, 3).map(v => (v | 0).toString(16)).join("")}`, // eslint-disable-line max-len, newline-per-chained-call
  rgba: values => `rgba(${values.map((v, i) => i < 3 ? v | 0 : v)})` // eslint-disable-line max-len, newline-per-chained-call, no-confusing-arrow
};

const EMPTY_COLOR = [];

QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "ColorAnimation",
  versions: /.*/,
  baseClass: "PropertyAnimation",
  properties: {
    from: "color",
    to: "color",
  }
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);

    this.$at = 0;
    this.$loop = 0;

    QmlWeb.engine.$addTicker((...args) => this.$ticker(...args));
    this.runningChanged.connect(this, this.$onRunningChanged);
  }
  $redoActions() {
    this.$actions = [];
    for (let i = 0; i < this.$targets.length; i++) {
      for (const j in this.$props) {
        const target = this.$targets[i];
        const property = this.$props[j];
        const from = this.from || target[property];
        const action = {
          target,
          property,
          from: from ? parseColorToArray(from.$value) : EMPTY_COLOR,
          to: parseColorToArray(this.to.$value)
        };
        if (action.from === action.to ||
          action.from.join() === action.to.join()) {
          continue;
        }
        action._out_handler = OUT_HANDLER.rgba;
        if (action.from[3] * action.to[3] === 1) { // just out put hex format
          action._out_handler = OUT_HANDLER.hex;
          action.from.length = action.to.length = 3;
        }
        this.$actions.push(action);
      }
    }
  }
  $startLoop() {
    for (const i in this.$actions) {
      const action = this.$actions[i];
      if (action.from === EMPTY_COLOR) {
        const from = action.target[action.property];
        action.from = parseColorToArray(from && from.$value);
      }
    }
    this.$at = 0;
  }
  $ticker(now, elapsed) {
    if (!this.running && this.$loop !== -1 || this.paused) {
      // $loop === -1 is a marker to just finish this run
      return;
    }
    if (this.$at === 0 && this.$loop === 0 && !this.$actions.length) {
      this.$redoActions();
    }
    this.$at += elapsed / this.duration;
    if (this.$at >= 1) {
      this.complete();
      return;
    }
    for (const i in this.$actions) {
      const action = this.$actions[i];
      const progress = this.easing.$valueForProgress(this.$at);

      const values = action.from.map((v, _i) =>
        v + (action.to[_i] - v) * progress);
      const value = action._out_handler(values);

      const property = action.target.$properties[action.property];
      property.set(value, QmlWeb.QMLProperty.ReasonAnimation);
    }
  }
  $onRunningChanged(newVal) {
    if (newVal) {
      this.$startLoop();
      this.paused = false;
    } else if (this.alwaysRunToEnd && this.$at < 1) {
      this.$loop = -1; // -1 is used as a marker to stop
    } else {
      this.$loop = 0;
      this.$actions = [];
    }
  }
  complete() {
    for (const i in this.$actions) {
      const action = this.$actions[i];
      const property = action.target.$properties[action.property];
      property.set(action._out_handler(action.to),
        QmlWeb.QMLProperty.ReasonAnimation);
    }
    this.$loop++;
    if (this.$loop === this.loops) {
      this.running = false;
    } else if (!this.running) {
      this.$actions = [];
    } else {
      this.$startLoop(this);
    }
  }
});
