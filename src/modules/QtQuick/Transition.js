registerQmlType({
  module:   'QtQuick',
  name:     'Transition',
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
    callSuper(this, meta);

    this.$item = this.$parent;

    this.$start = function(actions) {
        for (var i = 0; i < this.animations.length; i++) {
            var animation = this.animations[i];
            animation.$actions = [];
            for (var j in actions) {
                var action = actions[j];
                if ((animation.$targets.length === 0 || animation.$targets.indexOf(action.target) !== -1)
                    && (animation.$props.length === 0 || animation.$props.indexOf(action.property) !== -1))
                    animation.$actions.push(action);
            }
            animation.start();
        }
    }
    this.$stop = function() {
        for (var i = 0; i < this.animations.length; i++)
            this.animations[i].stop();
    }
  }
});
