// eslint-disable-next-line no-undef
class QtQuick_Gradient extends QtQml_QtObject {
  static enums = {
    Orientation: {
      Vertical: 0, Horizontal: 1
    }
  };
  static properties = {
    orientation: { type: "enum", initialValue: 0 }, // Gradient.Orientation
    stops: "list"
  };
  static defaultProperty = "stops";

  constructor(meta) {
    super(meta);

    this.$item = this.$parent;

    this.orientationChanged.connect(this, this.$onGradientStopChanged);
    this.stopsChanged.connect(this, this.$onGradientStopChanged);
  }
  $onGradientStopChanged() {
    const style = this.$parent.impl.style;
    let linearGradient = "";
    for (let i = 0; i < this.stops.length; i++) {
      const stop = this.stops[i];
      linearGradient += `,${stop.color} ${stop.position * 100}%`;
    }
    if (this.stops.length > 0) {
      style.backgroundColor = "transparent";

      const direction = this.orientation === this.Orientation.Vertical
        ? "to bottom" : "to right";
      style.backgroundImage = `linear-gradient(${direction}${linearGradient})`;
    }
  }
}
