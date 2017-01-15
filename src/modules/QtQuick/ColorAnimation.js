const EMPTY_ANIMATION_COLOR = new QmlWeb.QColor();

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
        const from_color = this.from;
        const to_color = this.to;
        // Animations always take time in SequentialAnimation
        // , regardless of the value from and to
        const action = {
          // from, to, cur_color
          target,
          property,
          from_color,
          to_color
        };
        this.$actions.push(action);
      }
    }
    this.$startLoop();
  }
  $startLoop() {
    for (const i in this.$actions) {
      const action = this.$actions[i];
      const from_color = action.from_color ||
        action.target[action.property] ||
        EMPTY_ANIMATION_COLOR;
      const to_color = action.to_color ||
        action.target[action.property] ||
        EMPTY_ANIMATION_COLOR;
      const property = action.target.$properties[action.property];

      action.from = {
        r: from_color.r,
        g: from_color.g,
        b: from_color.b,
        a: from_color.a
      };
      action.to = {
        r: to_color.r,
        g: to_color.g,
        b: to_color.b,
        a: to_color.a
      };
      action.cur_color = new QmlWeb.QColor(from_color);
      property.set(action.cur_color, QmlWeb.QMLProperty.ReasonAnimation);
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

      const {
        from,
        to,
        cur_color
      } = action;

      cur_color.$r = from.r + (to.r - from.r) * progress;
      cur_color.$g = from.g + (to.g - from.g) * progress;
      cur_color.$b = from.b + (to.b - from.b) * progress;
      // Notification changes
      cur_color.a = from.a + (to.a - from.a) * progress;
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
      const to_color = action.to_color;
      if (to_color) {
        property.set(to_color, QmlWeb.QMLProperty.ReasonAnimation);
      }
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
