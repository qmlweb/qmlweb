registerQmlType({
  module:   'QtQuick',
  name:     'Transition',
  versions: /.*/,
  constructor: function QMLTransition(meta) {
    QMLQtObject.call(this, meta);

    createSimpleProperty("list", this, "animations");
    this.$defaultProperty = "animations";
    createSimpleProperty("string", this, "from");
    createSimpleProperty("string", this, "to");
    createSimpleProperty("bool", this, "reversible");
    this.animations = [];
    this.$item = this.$parent;
    this.from = "*";
    this.to = "*";

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
