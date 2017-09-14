QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "Behavior",
  versions: /.*/,
  baseClass: "QtQml.QtObject",
  properties: {
    animation: "Animation",
    enabled: { type: "bool", initialValue: true }
  },
  defaultProperty: "animation"
}, class {
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
