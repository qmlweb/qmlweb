// eslint-disable-next-line no-undef
class QtQml_Timer extends QtQml_QtObject {
  static properties = {
    interval: { type: "int", initialValue: 1000 },
    parent: { type: "QtObject", readOnly: true },
    repeat: "bool",
    running: "bool",
    triggeredOnStart: "bool"
  };
  static signals = {
    triggered: []
  };

  constructor(meta) {
    super(meta);

    this.$properties.parent.set(this.$parent, QmlWeb.QMLProperty.ReasonInit);

    /* This ensures that if the user toggles the "running" property manually,
     * the timer will trigger. */
    this.runningChanged.connect(this, this.$onRunningChanged);

    QmlWeb.engine.$addTicker((...args) => this.$ticker(...args));

    QmlWeb.engine.$registerStart(() => {
      if (this.running) {
        this.restart();
      }
    });

    QmlWeb.engine.$registerStop(() => this.stop());
  }
  start() {
    this.running = true;
  }
  stop() {
    this.running = false;
  }
  restart() {
    this.stop();
    this.start();
  }
  $ticker(now) {
    if (!this.running) return;
    if (now - this.$prevTrigger >= this.interval) {
      this.$prevTrigger = now;
      this.$trigger();
    }
  }
  $onRunningChanged() {
    if (this.running) {
      this.$prevTrigger = Date.now();
      if (this.triggeredOnStart) {
        this.$trigger();
      }
    }
  }
  $trigger() {
    if (!this.repeat) {
      // We set the value directly in order to be able to emit the
      // runningChanged signal after triggered, like Qt does it.
      this.$properties.running.val = false;
    }

    // Trigger this.
    this.triggered();

    if (!this.repeat) {
      // Emit changed signal manually after setting the value manually above.
      this.runningChanged();
    }
  }
}
