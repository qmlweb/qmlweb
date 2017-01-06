QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "RectangularGlow",
  versions: /.*/,
  baseClass: "Item",
  properties: {
    cached: {
      type: "bool",
      initialValue: false
    },
    color: {
      type: "color",
      initialValue: "white"
    },
    cornerRadius: {
      type: "real",
      initialValue: 0
    },
    glowRadius: {
      type: "real",
      initialValue: 0
    },
    spread: {
      type: "real",
      initialValue: 0
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

    function calcBoxShadow(color, glowR, cornerR, spread) {
      const totle = glowR + cornerR * (1 - spread);
      const glow = (1 - spread) * totle;
      const blur_radius = glow * 0.64;
      const spread_radius = totle - blur_radius;
      const glow2 = glowR / 5;
      const blur_radius_2 = glow2 * 0.8;
      const spread_radius_2 = glow2 - blur_radius_2;
      return `${color} 0px 0px ${blur_radius}px ${spread_radius}px,` +
        `${color} 0px 0px ${blur_radius_2}px ${spread_radius_2}px`;
    }

    function calcGlowCss(color, glowR, cornerR, spread, width, height) {
      const spread_cornerR = cornerR * (1 - spread);
      const rest_cornerR = cornerR - spread_cornerR;
      return {
        boxShadow: calcBoxShadow(color, glowR, cornerR, spread),
        width: `${width - spread_cornerR}px`,
        height: `${height - spread_cornerR}px`,
        top: `${spread_cornerR / 2}px`,
        left: `${spread_cornerR / 2}px`,
        filter: `blur(${spread_cornerR / 2}px)`,
        borderRadius: `${rest_cornerR / 2}px`,
        transform: `scale(${(width - spread_cornerR / 4) / width},` +
          `${(height - spread_cornerR / 4) / height})`,
      };
    }

    Object.assign(this.impl.style, calcGlowCss(
      this.color,
      this.glowRadius,
      this.cornerRadius,
      this.spread,
      this.width, this.height));
  }
});
