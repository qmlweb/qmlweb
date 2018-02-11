// eslint-disable-next-line no-undef
class QtQuick_SequentialAnimation extends QtQuick_Animation {
  static properties = {
    animations: "list"
  };
  static defaultProperty = "animations";

  constructor(meta) {
    super(meta);

    this.animationsChanged.connect(this, this.$onAnimatonsChanged);

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
    if (this.$curIndex < this.animations.length) {
      this.animations[this.$curIndex].stop();
    }
  }
  complete() {
    if (!this.running) return;
    if (this.$curIndex < this.animations.length) {
      // Stop current animation
      this.animations[this.$curIndex].stop();
    }
    this.running = false;
  }
}
