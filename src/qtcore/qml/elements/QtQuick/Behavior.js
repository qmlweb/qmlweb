registerQmlType({
  module: 'QtQuick',
  name:   'Behavior',
  versions: /.*/,
  baseClass: QMLBaseObject,
  constructor: function QMLBehavior(meta) {
    QMLBaseObject.call(this, meta);

    createProperty({ type: "Animation", object: this, name: "animation" });
    this.$defaultProperty = "animation";
    createProperty({ type: "bool", object: this, name: "enabled", initialValue: true });

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
