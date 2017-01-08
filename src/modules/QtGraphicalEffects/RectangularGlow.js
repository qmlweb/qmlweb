QmlWeb.registerQmlType({
  module: "QtGraphicalEffects",
  name: "RectangularGlow",
  versions: /.*/,
  baseClass: "QtQuick.Item",
  properties: {
    cached: {
      type: "bool"
    },
    color: {
      type: "color",
      initialValue: "white"
    },
    cornerRadius: {
      type: "real"
    },
    glowRadius: {
      type: "real"
    },
    spread: {
      type: "real"
    },
  }
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);

    const bg = this.impl = document.createElement("div");
    bg.style.pointerEvents = "none";
    bg.style.position = "absolute";
    bg.style.left = bg.style.right = bg.style.top = bg.style.bottom = "0px";
    bg.style.border = "none";
    bg.style.backgroundColor = "black";
    this.dom.appendChild(bg);

    this.colorChanged.connect(this, this.$onColorChanged);
    this.glowRadiusChanged.connect(this, this.$updateBoxShadow);
    this.cornerRadiusChanged.connect(this, this.$updateBoxShadow);
    this.widthChanged.connect(this, this.$updateBoxShadow);
    this.heightChanged.connect(this, this.$updateBoxShadow);
    this.spreadChanged.connect(this, this.$onSpreadChanged);
  }
  $onColorChanged(newVal) {
    this.impl.style.backgroundColor = new QmlWeb.QColor(newVal);
    this.$updateBoxShadow();
  }
  $onSpreadChanged(newVal) {
    if (newVal > 1) {
      this.spread = 1;
    } else if (newVal < 0) {
      this.spread = 0;
    }
    this.$updateBoxShadow();
  }
  $updateBoxShadow() {
    const {
      color,
      glowRadius: glowR,
      cornerRadius: cornerR,
      spread,
      width,
      height
    } = this;
    const currentStyle = this.impl.style;

    //calcBoxShadow
    const totle = glowR + cornerR * (1 - spread);
    const glow = (1 - spread) * totle;
    const blur_radius = glow * 0.64;
    const spread_radius = totle - blur_radius;
    const glow2 = glowR / 5;
    const blur_radius_2 = glow2 * 0.8;
    const spread_radius_2 = glow2 - blur_radius_2;

    const boxShadow = `${color} 0px 0px ${blur_radius}px ${spread_radius}px,` +
      `${color} 0px 0px ${blur_radius_2}px ${spread_radius_2}px`;

    //calcGlowCss
    const spread_cornerR = cornerR * (1 - spread);
    const rest_cornerR = cornerR - spread_cornerR;

    currentStyle.boxShadow = boxShadow;
    currentStyle.width = `${width - spread_cornerR}px`;
    currentStyle.height = `${height - spread_cornerR}px`;
    currentStyle.top = `${spread_cornerR / 2}px`;
    currentStyle.left = `${spread_cornerR / 2}px`;
    currentStyle.filter = `blur(${spread_cornerR / 2}px)`;
    currentStyle.borderRadius = `${rest_cornerR / 2}px`;
    currentStyle.transform = `scale(${(width - spread_cornerR / 4) / width},` +
      `${(height - spread_cornerR / 4) / height})`;
  }
});
