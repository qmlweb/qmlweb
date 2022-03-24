const EMPTY_ANIMATION_COLOR = new QmlWeb.QColor();

// eslint-disable-next-line no-undef
class QtQuick_ColorAnimation extends QtQuick_PropertyAnimation {
  static properties = {
    from: { type: "variant", initialValue: null },
    to: { type: "variant", initialValue: null }
  };

  constructor(meta) {
    super(meta);
    this.$at = 0;
    this.$loop = 0;
    QmlWeb.engine.$addTicker((...args) => this.$ticker(...args));
    this.runningChanged.connect(this, this.$onRunningChanged);
  }
  $redoActions() {
    this.$actions = [];
    for (let i = 0; i < this.$targets.length; i++) {
      for (const j in this.$props) {
        const target = this.$targets[i];
        const property = this.$props[j];
        const from = this.from || target[property];
        const to = this.to;
        // Animations always take time in SequentialAnimation
        // , regardless of the value from and to
        const action = {
          target,
          property,
          from,
          to
        };
        this.$actions.push(action);
      }
    }
    this.$startLoop();
  }
  $startLoop() {
    for (const i in this.$actions) {
      const action = this.$actions[i];
      const from = action.from ||
        action.target[action.property] ||
        EMPTY_ANIMATION_COLOR;
      const to = action.to ||
        action.target[action.property] ||
        EMPTY_ANIMATION_COLOR;

      action.from = new QmlWeb.QColor(from);
      action.to = new QmlWeb.QColor(to);
      action.cur_color = new QmlWeb.QColor(action.from);
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
      const progress = this.easing.$valueForProgress(this.$at);
      const property = action.target.$properties[action.property];
      const {
        cur_color,
        from,
        to
      } = action;

      cur_color.$r = from.$r + (to.$r - from.$r) * progress;
      cur_color.$g = from.$g + (to.$g - from.$g) * progress;
      cur_color.$b = from.$b + (to.$b - from.$b) * progress;
      cur_color.$a = from.$a + (to.$a - from.$a) * progress;

      property.set(cur_color, QmlWeb.QMLProperty.ReasonAnimation);
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
      const to_color = action.to;
      if (to_color) {
        property.set(to_color,
          QmlWeb.QMLProperty.ReasonAnimation);
      }
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
