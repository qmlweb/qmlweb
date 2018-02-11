// eslint-disable-next-line no-undef
class QtGraphicalEffects_RectangularGlow extends QtQuick_Item {
  static properties = {
    cached: "bool",
    color: { type: "color", initialValue: "white" },
    cornerRadius: "real",
    glowRadius: "real",
    spread: "real"
  };

  constructor(meta) {
    super(meta);

    this.impl = document.createElement("div");
    const style = this.impl.style;
    style.pointerEvents = "none";
    style.position = "absolute";
    style.left = style.right = style.top = style.bottom = "0px";
    style.border = "none";
    style.backgroundColor = this.color.$css;
    this.dom.appendChild(this.impl);

    this.colorChanged.connect(this, this.$onColorChanged);
    this.glowRadiusChanged.connect(this, this.$updateBoxShadow);
    this.cornerRadiusChanged.connect(this, this.$updateBoxShadow);
    this.widthChanged.connect(this, this.$updateBoxShadow);
    this.heightChanged.connect(this, this.$updateBoxShadow);
    this.spreadChanged.connect(this, this.$onSpreadChanged);
  }
  $onColorChanged(newVal) {
    this.impl.style.backgroundColor = newVal.$css;
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
    const { color, glowRadius, cornerRadius, spread, width, height } = this;
    const style = this.impl.style;

    // Calculate boxShadow
    const totle = glowRadius + cornerRadius * (1 - spread);
    const glow = (1 - spread) * totle;
    const blur_radius = glow * 0.64;
    const spread_radius = totle - blur_radius;
    const glow2 = glowRadius / 5;
    const blur_radius_2 = glow2 * 0.8;
    const spread_radius_2 = glow2 - blur_radius_2;

    style.boxShadow = `${color} 0px 0px ${blur_radius}px ${spread_radius}px,` +
      `${color} 0px 0px ${blur_radius_2}px ${spread_radius_2}px`;

    // Calculate glow css
    const spread_cornerR = cornerRadius * (1 - spread);
    const rest_cornerR = cornerRadius - spread_cornerR;
    const xScale = (width - spread_cornerR / 4) / width;
    const yScale = (height - spread_cornerR / 4) / height;

    style.width = `${width - spread_cornerR}px`;
    style.height = `${height - spread_cornerR}px`;
    style.top = `${spread_cornerR / 2}px`;
    style.left = `${spread_cornerR / 2}px`;
    style.filter = `blur(${spread_cornerR / 2}px)`;
    style.borderRadius = `${rest_cornerR / 2}px`;
    style.transform = `scale(${xScale},${yScale})`;
  }
}
