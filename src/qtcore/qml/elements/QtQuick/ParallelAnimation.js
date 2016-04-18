registerQmlType({
  module:   'QtQuick',
  name:     'ParallelAnimation',
  versions: /.*/,
  baseClass: QMLAnimation,
  constructor: function QMLParallelAnimation(meta) {
    var QMLAnimation = getConstructor('QtQuick', '2.0', 'Animation');
    QMLAnimation.call(this, meta);
    var curIndex,
        passedLoops,
        i;

    this.Animation = { Infinite: Math.Infinite }
    createProperty({ type: "list", object: this, name: "animations", initialValue: [] });
    this.$defaultProperty = "animations";
    this.$runningAnimations = 0;

    this.animationsChanged.connect(this, function() {
        for (i = 0; i < this.animations.length; i++) {
            if (!this.animations[i].runningChanged.isConnected(this, animationFinished))
                this.animations[i].runningChanged.connect(this, animationFinished);
        }
    });

    function animationFinished(newVal) {
        this.$runningAnimations += newVal ? 1 : -1;
        if (this.$runningAnimations === 0)
            this.running = false;
    }

    this.start = function() {
        if (!this.running) {
            this.running = true;
            for (i = 0; i < this.animations.length; i++)
                this.animations[i].start();
        }
    }
    this.stop = function() {
        if (this.running) {
            for (i = 0; i < this.animations.length; i++)
                this.animations[i].stop();
            this.running = false;
        }
    }
    this.complete = this.stop;

    engine.$registerStart(function() {
        if (self.running) {
            self.running = false; // toggled back by start();
            self.start();
        }
    });
    engine.$registerStop(function() {
        self.stop();
    });
  }
});
