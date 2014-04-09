registerQmlType({
  module:   'QtQuick',
  name:     'Transition',
  versions: /.*/,
  baseClass: QMLBaseObject,
  constructor: function QMLTransition(meta) {
    QMLBaseObject.call(this, meta);

    createProperty("list", this, "animations");
    this.$defaultProperty = "animations";
    createProperty("string", this, "from");
    createProperty("string", this, "to");
    createProperty("bool", this, "reversible");
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
