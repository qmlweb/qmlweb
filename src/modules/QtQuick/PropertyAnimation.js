QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "PropertyAnimation",
  versions: /.*/,
  baseClass: "Animation",
  properties: {
    duration: { type: "int", initialValue: 250 },
    from: "real",
    to: "real",
    properties: "string",
    property: "string",
    target: "QtObject",
    targets: "list"
  }
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);

    const createProperty = QmlWeb.createProperty;
    this.easing = new QmlWeb.QObject(this);
    createProperty("enum", this.easing, "type",
      { initialValue: this.Easing.Linear });
    createProperty("real", this.easing, "amplitude", { initialValue: 1 });
    createProperty("real", this.easing, "overshoot", { initialValue: 1.70158 });
    createProperty("real", this.easing, "period", { initialValue: 0.3 });

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
});
