// eslint-disable-next-line no-undef
class QtQuick_SequentialAnimation extends QtQuick_Animation {
  static properties = {
    animations: "list"
  };
  static defaultProperty = "animations";

  constructor(meta) {
    super(meta);

    this.animationsChanged.connect(this, this.$onAnimatonsChanged);
    this.runningChanged.connect(this, this.$onRunningChanged);
    this.pausedChanged.connect(this, this.$onPausedChanged);

    QmlWeb.engine.$registerStart(() => {
      if (!this.running) return;
      this.running = false; // toggled back by start();
      this.start();
    });
    QmlWeb.engine.$registerStop(() => self.stop());
  }
  $onAnimatonsChanged() {
    const flags = QmlWeb.Signal.UniqueConnection;
    for (let i = 0; i < this.animations.length; i++) {
      const animation = this.animations[i];
      animation.runningChanged.connect(this, this.$nextAnimation, flags);
    }
  }
  $onRunningChanged(newVal) {
    if (newVal) {
      this.$curIndex = -1;
      this.$passedLoops = 0; // Recount
      this.$nextAnimation();
    } else {
      const anim = this.animations[this.$curIndex];
      // Stop current animation
      if (anim) {
        this.animations[this.$curIndex].stop();
      }
    }
  }
  $onPausedChanged(newVal) {
    if (!this.running) {
      // TODO: use class extends Animation
      // ,super.$onPausedChanged(newVal)
      console.warn("setPaused() cannot be used when animation isn't running.");
      return;
    }
    const anim = this.animations[this.$curIndex];
    if (anim) {
      if (newVal) {
        anim.pause();
      } else {
        anim.resume();
      }
    }
  }
  $nextAnimation(proceed) {
    if (this.running && !proceed) {
      this.$curIndex++;
      if (this.$curIndex < this.animations.length) {
        const anim = this.animations[this.$curIndex];
        // console.log("nextAnimation", this, this.$curIndex, anim);
        anim.start();
      } else {
        this.$passedLoops++;
        if (this.$passedLoops >= this.loops) {
          this.complete();
        } else {
          this.$curIndex = -1;
          this.$nextAnimation();
        }
      }
    }
  }
  start() {
    if (this.running) return;
    this.running = true;
    this.$curIndex = -1;
    this.$passedLoops = 0;
    this.$nextAnimation();
  }
  stop() {
    if (!this.running) return;
    this.running = false;
  }
  complete() {
    if (!this.running) return;
    this.running = false;
    this.$Signals.finished();
  }
}
