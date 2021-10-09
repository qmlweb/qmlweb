// eslint-disable-next-line no-undef
class QtQuick_NumberAnimation extends QtQuick_PropertyAnimation {
  constructor(meta) {
    super(meta);

    this.$at = 0;
    this.$loop = 0;

    QmlWeb.engine.$addTicker((...args) => this.$ticker(...args));
    this.runningChanged.connect(this, this.$onRunningChanged);
  }
  $startLoop() {
    for (const i in this.$actions) {
      const action = this.$actions[i];
      action.from = action.from !== undefined ?
                      action.from :
                      action.target[action.property];
    }
    this.$at = 0;
  }
  $ticker(now, elapsed) {
    if (!this.running && this.$loop !== -1 || this.paused) {
      // $loop === -1 is a marker to just finish this run
      return;
    }
    if (this.$at === 0 && this.$loop === 0 && !this.$actions.length) {
      this.$redoActions();
    }
    this.$at += elapsed / this.duration;
    if (this.$at >= 1) {
      this.complete();
      return;
    }
    for (const i in this.$actions) {
      const action = this.$actions[i];
      const value = action.from + (action.to - action.from) *
                    this.easing.$valueForProgress(this.$at);
      const property = action.target.$properties[action.property];
      property.set(value, QmlWeb.QMLProperty.ReasonAnimation);
    }
  }
  $onRunningChanged(newVal) {
    if (newVal) {
      this.$startLoop();
      this.paused = false;
    } else if (this.alwaysRunToEnd && this.$at < 1) {
      this.$loop = -1; // -1 is used as a marker to stop
    } else {
      this.$loop = 0;
      this.$actions = [];
    }
  }
  complete() {
    for (const i in this.$actions) {
      const action = this.$actions[i];
      const property = action.target.$properties[action.property];
      property.set(action.to, QmlWeb.QMLProperty.ReasonAnimation);
    }
    this.$loop++;
    if (this.$loop === this.loops) {
      this.running = false;
      this.$Signals.finished();
    } else if (!this.running) {
      this.$actions = [];
    } else {
      this.$startLoop(this);
    }
  }
}
