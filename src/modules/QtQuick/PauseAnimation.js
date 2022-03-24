// eslint-disable-next-line no-undef
class QtQuick_PauseAnimation extends QtQuick_Animation {
  static properties = {
    duration: { type: "int", initialValue: 250 }
  };

  constructor(meta) {
    super(meta);

    this.$at = 0;

    QmlWeb.engine.$addTicker((...args) => this.$ticker(...args));
    this.runningChanged.connect(this, this.$onRunningChanged);
  }
  $ticker(now, elapsed) {
    if (!this.running || this.paused) {
      return;
    }
    this.$at += elapsed / this.duration;
    if (this.$at >= 1) {
      this.complete();
    }
  }
  $onRunningChanged(newVal) {
    if (newVal) {
      this.$at = 0;
      this.paused = false;
    }
  }
  complete() {
    this.running = false;
    this.$Signals.finished();
  }
}
