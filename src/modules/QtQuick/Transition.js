registerQmlType({
  module:   'QtQuick',
  name:     'Transition',
  versions: /.*/,
  baseClass: 'QtQml.QtObject',
  constructor: function QMLTransition(meta) {
    callSuper(this, meta);

    createProperty("list", this, "animations");
    this.$defaultProperty = "animations";
    createProperty("string", this, "from", {initialValue: '*'});
    createProperty("string", this, "to", {initialValue: '*'});
    createProperty("bool", this, "reversible");
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
