// eslint-disable-next-line no-undef
class QtQuick_PropertyAnimation extends QtQuick_Animation {
  static properties = {
    duration: { type: "int", initialValue: 250 },
    from: "real",
    to: "real",
    properties: "string",
    property: "string",
    target: "QtObject",
    targets: "list"
  };

  constructor(meta) {
    super(meta);

    this.easing = new QmlWeb.QObject(this);
    QmlWeb.createProperties(this.easing, {
      type: { type: "enum", initialValue: this.Easing.Linear },
      amplitude: { type: "real", initialValue: 1 },
      overshoot: { type: "real", initialValue: 1.70158 },
      period: { type: "real", initialValue: 0.3 },
      bezierCurve: "list"
    });

    this.easing.$valueForProgress = function(t) {
      return QmlWeb.$ease(
        this.type, this.period, this.amplitude, this.overshoot, t
      );
    };

    this.$props = [];
    this.$targets = [];
    this.$actions = [];

    this.targetChanged.connect(this, this.$redoTargets);
    this.targetsChanged.connect(this, this.$redoTargets);
    this.propertyChanged.connect(this, this.$redoProperties);
    this.propertiesChanged.connect(this, this.$redoProperties);

    if (meta.object.$on !== undefined) {
      this.property = meta.object.$on;
      this.target = this.$parent;
      this.running = true;
    }
  }
  $redoActions() {
    this.$actions = [];
    for (let i = 0; i < this.$targets.length; i++) {
      for (const j in this.$props) {
        this.$actions.push({
          target: this.$targets[i],
          property: this.$props[j],
          from: this.from,
          to: this.to
        });
      }
    }
  }
  $redoProperties() {
    this.$props = this.properties.split(",");

    // Remove whitespaces
    for (let i = 0; i < this.$props.length; i++) {
      const matches = this.$props[i].match(/\w+/);
      if (matches) {
        this.$props[i] = matches[0];
      } else {
        this.$props.splice(i, 1);
        i--;
      }
    }
    // Merge properties and property
    if (this.property && this.$props.indexOf(this.property) === -1) {
      this.$props.push(this.property);
    }
  }
  $redoTargets() {
    this.$targets = this.targets.slice();
    if (this.target && this.$targets.indexOf(this.target) === -1) {
      this.$targets.push(this.target);
    }
  }
}
