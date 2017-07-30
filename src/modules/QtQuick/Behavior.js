QmlWeb.registerQmlType(class Behavior {
  static module = "QtQuick";
  static versions = /.*/;
  static baseClass = "QtQml.QtObject";
  static properties = {
    animation: "Animation",
    enabled: { type: "bool", initialValue: true }
  };
  static defaultProperty = "animation";

  constructor(meta) {
    QmlWeb.callSuper(this, meta);
    this.$on = meta.object.$on;

    this.animationChanged.connect(this, this.$onAnimationChanged);
    this.enabledChanged.connect(this, this.$onEnabledChanged);
  }
  $onAnimationChanged(newVal) {
    newVal.target = this.$parent;
    newVal.property = this.$on;
    this.$parent.$properties[this.$on].animation = newVal;
  }
  $onEnabledChanged(newVal) {
    this.$parent.$properties[this.$on].animation = newVal
      ? this.animation
      : null;
  }
});
