registerQmlType({
  module: 'QtQuick',
  name:   'Behavior',
  versions: /.*/,
  baseClass: 'QtQml.QtObject',
  constructor: function QMLBehavior(meta) {
    callSuper(this, meta);

    createProperty("Animation", this, "animation");
    this.$defaultProperty = "animation";
    createProperty("bool", this, "enabled", {initialValue: true});

    this.animationChanged.connect(this, function(newVal) {
        newVal.target = this.$parent;
        newVal.property = meta.object.$on;
        this.$parent.$properties[meta.object.$on].animation = newVal;
    });
    this.enabledChanged.connect(this, function(newVal) {
        this.$parent.$properties[meta.object.$on].animation = newVal ? this.animation : null;
    });
  }
});
