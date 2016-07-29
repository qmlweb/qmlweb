registerQmlType({
  module: "QtQuick",
  name: "SequentialAnimation",
  versions: /.*/,
  baseClass: "Animation",
  properties: {
    animations: "list"
  },
  defaultProperty: "animations"
}, class {
  constructor(meta) {
    callSuper(this, meta);

    this.animationsChanged.connect(this, this.$onAnimatonsChanged);

    engine.$registerStart(() => {
      if (this.running) {
        this.running = false; // toggled back by start();
        this.start();
      }
    });
    engine.$registerStop(() => self.stop());
  }
  $onAnimatonsChanged() {
    for (let i = 0; i < this.animations.length; i++) {
      const animation = this.animations[i];
      if (!animation.runningChanged.isConnected(this, this.$nextAnimation)) {
        animation.runningChanged.connect(this, this.$nextAnimation);
      }
    }
  }
  $nextAnimation(proceed) {
    if (this.running && !proceed) {
      this.$curIndex++;
      if (this.$curIndex < this.animations.length) {
        const anim = this.animations[this.$curIndex];
        console.log("nextAnimation", this, this.$curIndex, anim);
        anim.start();
      } else {
        this.$passedLoops++;
        if (this.$passedLoops >= this.loops) {
          this.complete();
        } else {
          this.$curIndex = -1;
          nextAnimation();
        }
      }
    }
  }
  start() {
    if (!this.running) {
      this.running = true;
      this.$curIndex = -1;
      this.$passedLoops = 0;
      this.$nextAnimation();
    }
  }
  stop() {
    if (this.running) {
      this.running = false;
      if (this.$curIndex < this.animations.length) {
        this.animations[this.$curIndex].stop();
      }
    }
  }
  complete() {
    if (this.running) {
      if (this.$curIndex < this.animations.length) {
        // Stop current animation
        this.animations[this.$curIndex].stop();
      }
      this.running = false;
    }
  }
});
