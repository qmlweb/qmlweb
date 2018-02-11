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
    this.$runningAnimations += newVal ? 1 : -1;
    if (this.$runningAnimations === 0) {
      this.running = false;
    }
  }
  start() {
    if (this.running) return;
    this.running = true;
    for (let i = 0; i < this.animations.length; i++) {
      this.animations[i].start();
    }
  }
  stop() {
    if (!this.running) return;
    for (let i = 0; i < this.animations.length; i++) {
      this.animations[i].stop();
    }
    this.running = false;
  }
  complete() {
    this.stop();
  }
}
