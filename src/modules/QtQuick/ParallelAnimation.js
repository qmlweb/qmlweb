// eslint-disable-next-line no-undef
class QtQuick_ParallelAnimation extends QtQuick_Animation {
  static enums = {
    Animation: { Infinite: Math.Infinite }
  };
  static properties = {
    animations: "list"
  };
  static defaultProperty = "animations";

  constructor(meta) {
    super(meta);

    this.$runningAnimations = 0;

    this.animationsChanged.connect(this, this.$onAnimationsChanged);
    this.runningChanged.connect(this, this.$onRunningChanged);
    this.pausedChanged.connect(this, this.$onPausedChanged);

    QmlWeb.engine.$registerStart(() => {
      if (!this.running) return;
      self.running = false; // toggled back by start();
      self.start();
    });
    QmlWeb.engine.$registerStop(() => this.stop());
  }
  $onAnimationsChanged() {
    const flags = QmlWeb.Signal.UniqueConnection;
    for (let i = 0; i < this.animations.length; i++) {
      const animation = this.animations[i];
      animation.runningChanged.connect(this, this.$animationFinished, flags);
    }
  }
  $animationFinished(newVal) {
    if (!newVal && this.$runningAnimations === 0) {
      this.running = false;
    }
  }
  get $runningAnimations() {
    let count = 0;
    for (let i = 0; i < this.animations.length; i++) {
      count += this.animations[i].running ? 1 : 0;
    }
    return count;
  }
  $onRunningChanged(newVal) {
    if (newVal) {
      for (let i = 0; i < this.animations.length; i++) {
        this.animations[i].start();
      }
    } else {
      for (let i = 0; i < this.animations.length; i++) {
        this.animations[i].stop();
      }
    }
  }
  $onPausedChanged(newVal) {
    for (let i = 0; i < this.animations.length; i++) {
      this.animations[i].paused = newVal;
    }
  }
  start() {
    if (this.running) return;
    this.running = true;
  }
  stop() {
    if (!this.running) return;
    this.running = false;
  }
  complete() {
    this.stop();
    this.$Signals.finished();
  }
}
