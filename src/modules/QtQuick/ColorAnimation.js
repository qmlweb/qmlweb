const EMPTY_COLOR = COLORS.unknown; // eslint-disable-line no-undef

QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "ColorAnimation",
  versions: /.*/,
  baseClass: "PropertyAnimation",
  properties: {
    from: "color",
    to: "color",
  }
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);

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
        const action = {
          target,
          property,
          from: from ? from.$value_rgba : EMPTY_COLOR,
          to: to ? to.$value_rgba : EMPTY_COLOR
        };
        if (action.from === action.to ||
          action.from.join() === action.to.join()) {
          continue;
        }
        action._out_handler = COLOR_OUT_HANDLERS.rgba; // eslint-disable-line no-undef, max-len
        if (action.from[3] * action.to[3] === 1) { // just out put hex format
          action._out_handler = COLOR_OUT_HANDLERS.hex; // eslint-disable-line no-undef, max-len
          action.from.length = action.to.length = 3;
        }
        this.$actions.push(action);
      }
    }
  }
  $startLoop() {
    for (const i in this.$actions) {
      const action = this.$actions[i];
      if (action.from === EMPTY_COLOR) {
        const from = action.target[action.property];
        if (from) {
          action.from = from.$value_rgba;
        }
      }
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

      const values = action.from.map((v, _i) =>
        v + (action.to[_i] - v) * progress);
      const value = action._out_handler(values);

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
      property.set(action._out_handler(action.to),
        QmlWeb.QMLProperty.ReasonAnimation);
    }
    this.$loop++;
    if (this.$loop === this.loops) {
      this.running = false;
    } else if (!this.running) {
      this.$actions = [];
    } else {
      this.$startLoop(this);
    }
  }
});
