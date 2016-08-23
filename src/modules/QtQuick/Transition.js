QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "Transition",
  versions: /.*/,
  baseClass: "QtQml.QtObject",
  properties: {
    animations: "list",
    from: { type: "string", initialValue: "*" },
    to: { type: "string", initialValue: "*" },
    reversible: "bool"
  },
  defaultProperty: "animations"
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);

    this.$item = this.$parent;
  }
  $start(actions) {
    for (let i = 0; i < this.animations.length; i++) {
      const animation = this.animations[i];
      animation.$actions = [];
      const { $targets, $props, $actions } = animation;
      for (const j in actions) {
        const action = actions[j];
        if (($targets.length === 0 || $targets.indexOf(action.target) !== -1) &&
            ($props.length === 0 || $props.indexOf(action.property) !== -1)) {
          $actions.push(action);
        }
      }
      animation.start();
    }
  }
  $stop() {
    for (let i = 0; i < this.animations.length; i++) {
      this.animations[i].stop();
    }
  }
});
