registerQmlType({
  module:   'QtQuick',
  name:     'Transition',
  versions: /.*/,
  baseClass: QMLBaseObject,
  constructor: function QMLTransition(meta) {
    QMLBaseObject.call(this, meta);

    createProperty({ type: "list", object: this, name: "animations", initialValue: [] });
    this.$defaultProperty = "animations";
    createProperty({ type: "string", object: this, name: "from", initialValue: "*" });
    createProperty({ type: "string", object: this, name: "to", initialValue: "*" });
    createProperty({ type: "bool", object: this, name: "reversible", initialValue: false });
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
