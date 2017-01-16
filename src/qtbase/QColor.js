class QColor {
  constructor(...args) {
    this.$changed = new QmlWeb.Signal();
    this.$r = this.$g = this.$b = 0;
    this.$a = 1;
    const val = args[0];
    if (args.length >= 3) {
      this.$r = args[0];
      this.$g = args[1];
      this.$b = args[2];
      if (args.length >= 4) {
        this.$a = args[3];
      }
    } else if (val instanceof QColor) {
      // Copy constructor
      this.$a = val.a;
      this.$r = val.r;
      this.$g = val.g;
      this.$b = val.b;
    } else if (typeof val === "string") {
      const lval = val.toLowerCase();
      if (QColor.colormap[lval]) {
        const rgb = QColor.colormap[lval];
        this.$r = rgb[0] / 255;
        this.$g = rgb[1] / 255;
        this.$b = rgb[2] / 255;
      } else if (lval === "transparent") {
        this.$a = 0;
      } else if (lval[0] === "#") {
        const hex = lval.substr(1);
        if (hex.length === 3) {
          this.$r = parseInt(hex[0], 16) / 15;
          this.$g = parseInt(hex[1], 16) / 15;
          this.$b = parseInt(hex[2], 16) / 15;
        } else {
          const rgb = hex.match(/.{2}/g).map(x => parseInt(x, 16));
          if (rgb.length === 4) {
            this.$a = rgb.shift() / 255;
          }
          this.$r = rgb[0] / 255;
          this.$g = rgb[1] / 255;
          this.$b = rgb[2] / 255;
        }
      } else {
        throw new Error(`Can not convert ${val} to color`);
      }
    } else if (typeof val !== "undefined") {
      throw new Error(`Can not assign ${typeof val} to QColor`);
    }
  }
  toString() {
    if (this.$string) return this.$string;
    const argb = [this.$a, this.$r, this.$g, this.$b].map(x =>
      (Math.round(x * 255) + 0x100).toString(16).substr(-2)
    );
    if (argb[0] === "ff") {
      argb.shift(); // We don't need alpha if it's ff
    }
    this.$string = `#${argb.join("")}`;
    return `#${argb.join("")}`;
  }
  get $css() {
    if (this.$cssValue) return this.$cssValue;
    if (this.$a === 1) {
      this.$cssValue = this.toString();
    } else if (this.$a === 0) {
      this.$cssValue = "transparent";
    } else {
      const intr = Math.round(this.$r * 255);
      const intg = Math.round(this.$g * 255);
      const intb = Math.round(this.$b * 255);
      this.$cssValue = `rgba(${intr},${intg},${intb},${this.$a})`;
    }
    return this.$cssValue;
  }
  get r() {
    return this.$r;
  }
  get g() {
    return this.$g;
  }
  get b() {
    return this.$b;
  }
  get a() {
    return this.$a;
  }
  set r(r) {
    this.$r = r;
    this.$string = this.$cssValue = null;
    this.$changed.execute();
  }
  set g(g) {
    this.$g = g;
    this.$string = this.$cssValue = null;
    this.$changed.execute();
  }
  set b(b) {
    this.$b = b;
    this.$string = this.$cssValue = null;
    this.$changed.execute();
  }
  set a(a) {
    this.$a = a;
    this.$string = this.$cssValue = null;
    this.$changed.execute();
  }
  get hsvHue() {
    const v = this.hsvValue;
    const m = Math.min(this.$r, this.$g, this.$b);
    if (v === m) return -1;
    if (v === this.$r) return ((this.$g - this.$b) / (v - m) + 1) % 1 / 6;
    if (v === this.$g) return ((this.$b - this.$r) / (v - m) + 2) / 6;
    if (v === this.$b) return ((this.$r - this.$g) / (v - m) + 4) / 6;
    throw new Error();
  }
  get hsvSaturation() {
    const v = this.hsvValue;
    if (v === 0) return 0;
    return 1 - Math.min(this.$r, this.$g, this.$b) / v;
  }
  get hsvValue() {
    return Math.max(this.$r, this.$g, this.$b);
  }
  get hslHue() {
    return this.hsvHue;
  }
  get hslSaturation() {
    const max = Math.max(this.$r, this.$g, this.$b);
    const min = Math.min(this.$r, this.$g, this.$b);
    if (max === min) return 0;
    return (max - min) / (1 - Math.abs(1 - max - min));
  }
  get hslLightness() {
    const max = Math.max(this.$r, this.$g, this.$b);
    const min = Math.min(this.$r, this.$g, this.$b);
    return (max + min) / 2;
  }
  set hsvHue(h) {
    const rgb = QColor.$hsv(h, this.hsvSaturation, this.hsvValue);
    this.$r = rgb[0];
    this.$g = rgb[1];
    this.$b = rgb[2];
    this.$string = this.$cssValue = null;
    this.$changed.execute();
  }
  set hsvSaturation(s) {
    const rgb = QColor.$hsv(this.hsvHue, s, this.hsvValue);
    this.$r = rgb[0];
    this.$g = rgb[1];
    this.$b = rgb[2];
    this.$string = this.$cssValue = null;
    this.$changed.execute();
  }
  set hsvValue(v) {
    const rgb = QColor.$hsv(this.hsvHue, this.hsvSaturation, v);
    this.$r = rgb[0];
    this.$g = rgb[1];
    this.$b = rgb[2];
    this.$string = this.$cssValue = null;
    this.$changed.execute();
  }
  set hslHue(h) {
    const rgb = QColor.$hsl(h, this.hslSaturation, this.hslLightness);
    this.$r = rgb[0];
    this.$g = rgb[1];
    this.$b = rgb[2];
    this.$string = this.$cssValue = null;
    this.$changed.execute();
  }
  set hslSaturation(s) {
    const rgb = QColor.$hsl(this.hslHue, s, this.hslLightness);
    this.$r = rgb[0];
    this.$g = rgb[1];
    this.$b = rgb[2];
    this.$string = this.$cssValue = null;
    this.$changed.execute();
  }
  set hslLightness(l) {
    const rgb = QColor.$hsl(this.hslHue, this.hslSaturation, l);
    this.$r = rgb[0];
    this.$g = rgb[1];
    this.$b = rgb[2];
    this.$string = this.$cssValue = null;
    this.$changed.execute();
  }

  static rgba = (r, g, b, a = 1) => new QColor(r, g, b, a);
  static hsva = (h, s, v, a = 1) => new QColor(...QColor.$hsv(h, s, v), a);
  static hsla = (h, s, l, a = 1) => new QColor(...QColor.$hsl(h, s, l), a);

  static $hsv(h, s, v) {
    const c = v * s;
    const m = v - c;
    return QColor.$hcma(h, c, m);
  }
  static $hsl(h, s, l) {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const m = l - c / 2;
    return QColor.$hcma(h, c, m);
  }
  static $hcma(h, c, m) {
    const hh = h > 0 ? h * 6 % 6 : 0;
    const x = c * (1 - Math.abs(hh % 2 - 1));
    let rgb;
    switch (Math.floor(hh)) {
      case 0:
        rgb = [c, x, 0];
        break;
      case 1:
        rgb = [x, c, 0];
        break;
      case 2:
        rgb = [0, c, x];
        break;
      case 3:
        rgb = [0, x, c];
        break;
      case 4:
        rgb = [x, 0, c];
        break;
      case 5:
        rgb = [c, 0, x];
        break;
    }
    return rgb.map(y => Math.min(1, y + m));
  }

  static darker(baseColor, factor = 2) {
    const color = baseColor instanceof QColor ?
      baseColor :
      new QColor(baseColor);
    const v = color.hsvValue / factor;
    // Undocumented in Qt, but this matches the observed Qt behaviour
    const s = color.hsvSaturation - Math.max(0, v - 1);
    return QColor.hsva(color.hsvHue, Math.max(0, s), Math.min(1, v), color.a);
  }
  static lighter(baseColor, factor = 1.5) {
    const color = baseColor instanceof QColor ?
      baseColor :
      new QColor(baseColor);
    const v = color.hsvValue * factor;
    // Undocumented in Qt, but this matches the observed Qt behaviour
    const s = color.hsvSaturation - Math.max(0, v - 1);
    return QColor.hsva(color.hsvHue, Math.max(0, s), Math.min(1, v), color.a);
  }
  static equal(lhs, rhs) {
    const a = lhs instanceof QColor ? lhs : new QColor(lhs);
    const b = rhs instanceof QColor ? rhs : new QColor(rhs);
    return a.toString() === b.toString();
  }

  static colormap = { // https://www.w3.org/TR/SVG/types.html#ColorKeywords
    aliceblue: [240, 248, 255],
    antiquewhite: [250, 235, 215],
    aqua: [0, 255, 255],
    aquamarine: [127, 255, 212],
    azure: [240, 255, 255],
    beige: [245, 245, 220],
    bisque: [255, 228, 196],
    black: [0, 0, 0],
    blanchedalmond: [255, 235, 205],
    blue: [0, 0, 255],
    blueviolet: [138, 43, 226],
    brown: [165, 42, 42],
    burlywood: [222, 184, 135],
    cadetblue: [95, 158, 160],
    chartreuse: [127, 255, 0],
    chocolate: [210, 105, 30],
    coral: [255, 127, 80],
    cornflowerblue: [100, 149, 237],
    cornsilk: [255, 248, 220],
    crimson: [220, 20, 60],
    cyan: [0, 255, 255],
    darkblue: [0, 0, 139],
    darkcyan: [0, 139, 139],
    darkgoldenrod: [184, 134, 11],
    darkgray: [169, 169, 169],
    darkgreen: [0, 100, 0],
    darkgrey: [169, 169, 169],
    darkkhaki: [189, 183, 107],
    darkmagenta: [139, 0, 139],
    darkolivegreen: [85, 107, 47],
    darkorange: [255, 140, 0],
    darkorchid: [153, 50, 204],
    darkred: [139, 0, 0],
    darksalmon: [233, 150, 122],
    darkseagreen: [143, 188, 143],
    darkslateblue: [72, 61, 139],
    darkslategray: [47, 79, 79],
    darkslategrey: [47, 79, 79],
    darkturquoise: [0, 206, 209],
    darkviolet: [148, 0, 211],
    deeppink: [255, 20, 147],
    deepskyblue: [0, 191, 255],
    dimgray: [105, 105, 105],
    dimgrey: [105, 105, 105],
    dodgerblue: [30, 144, 255],
    firebrick: [178, 34, 34],
    floralwhite: [255, 250, 240],
    forestgreen: [34, 139, 34],
    fuchsia: [255, 0, 255],
    gainsboro: [220, 220, 220],
    ghostwhite: [248, 248, 255],
    gold: [255, 215, 0],
    goldenrod: [218, 165, 32],
    gray: [128, 128, 128],
    grey: [128, 128, 128],
    green: [0, 128, 0],
    greenyellow: [173, 255, 47],
    honeydew: [240, 255, 240],
    hotpink: [255, 105, 180],
    indianred: [205, 92, 92],
    indigo: [75, 0, 130],
    ivory: [255, 255, 240],
    khaki: [240, 230, 140],
    lavender: [230, 230, 250],
    lavenderblush: [255, 240, 245],
    lawngreen: [124, 252, 0],
    lemonchiffon: [255, 250, 205],
    lightblue: [173, 216, 230],
    lightcoral: [240, 128, 128],
    lightcyan: [224, 255, 255],
    lightgoldenrodyellow: [250, 250, 210],
    lightgray: [211, 211, 211],
    lightgreen: [144, 238, 144],
    lightgrey: [211, 211, 211],
    lightpink: [255, 182, 193],
    lightsalmon: [255, 160, 122],
    lightseagreen: [32, 178, 170],
    lightskyblue: [135, 206, 250],
    lightslategray: [119, 136, 153],
    lightslategrey: [119, 136, 153],
    lightsteelblue: [176, 196, 222],
    lightyellow: [255, 255, 224],
    lime: [0, 255, 0],
    limegreen: [50, 205, 50],
    linen: [250, 240, 230],
    magenta: [255, 0, 255],
    maroon: [128, 0, 0],
    mediumaquamarine: [102, 205, 170],
    mediumblue: [0, 0, 205],
    mediumorchid: [186, 85, 211],
    mediumpurple: [147, 112, 219],
    mediumseagreen: [60, 179, 113],
    mediumslateblue: [123, 104, 238],
    mediumspringgreen: [0, 250, 154],
    mediumturquoise: [72, 209, 204],
    mediumvioletred: [199, 21, 133],
    midnightblue: [25, 25, 112],
    mintcream: [245, 255, 250],
    mistyrose: [255, 228, 225],
    moccasin: [255, 228, 181],
    navajowhite: [255, 222, 173],
    navy: [0, 0, 128],
    oldlace: [253, 245, 230],
    olive: [128, 128, 0],
    olivedrab: [107, 142, 35],
    orange: [255, 165, 0],
    orangered: [255, 69, 0],
    orchid: [218, 112, 214],
    palegoldenrod: [238, 232, 170],
    palegreen: [152, 251, 152],
    paleturquoise: [175, 238, 238],
    palevioletred: [219, 112, 147],
    papayawhip: [255, 239, 213],
    peachpuff: [255, 218, 185],
    peru: [205, 133, 63],
    pink: [255, 192, 203],
    plum: [221, 160, 221],
    powderblue: [176, 224, 230],
    purple: [128, 0, 128],
    red: [255, 0, 0],
    rosybrown: [188, 143, 143],
    royalblue: [65, 105, 225],
    saddlebrown: [139, 69, 19],
    salmon: [250, 128, 114],
    sandybrown: [244, 164, 96],
    seagreen: [46, 139, 87],
    seashell: [255, 245, 238],
    sienna: [160, 82, 45],
    silver: [192, 192, 192],
    skyblue: [135, 206, 235],
    slateblue: [106, 90, 205],
    slategray: [112, 128, 144],
    slategrey: [112, 128, 144],
    snow: [255, 250, 250],
    springgreen: [0, 255, 127],
    steelblue: [70, 130, 180],
    tan: [210, 180, 140],
    teal: [0, 128, 128],
    thistle: [216, 191, 216],
    tomato: [255, 99, 71],
    turquoise: [64, 224, 208],
    violet: [238, 130, 238],
    wheat: [245, 222, 179],
    white: [255, 255, 255],
    whitesmoke: [245, 245, 245],
    yellow: [255, 255, 0],
    yellowgreen: [154, 205, 50]
  };

  static nonNullableType = true;
  static requireConstructor = true;
}
QmlWeb.QColor = QColor;
