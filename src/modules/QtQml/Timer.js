registerQmlType({
  module:   'QtQml',
  name:     'Timer',
  versions: /.*/,
  baseClass: 'QtObject',
  constructor: function QMLTimer(meta) {
    callSuper(this, meta);
    var prevTrigger,
        self = this;

    createProperty("int", this, "interval", {interval: 1000});
    createProperty("bool", this, "repeat");
    createProperty("bool", this, "running");
    createProperty("bool", this, "triggeredOnStart");

    // Create trigger as simple property. Reading the property triggers
    // the function!
    this.triggered = Signal();

    engine.$addTicker(ticker);
    function ticker(now, elapsed) {
        if (self.running) {
            if (now - prevTrigger >= self.interval) {
                prevTrigger = now;
                trigger();
            }
        }
    }

    /* This ensures that if the user toggles the "running" property manually,
     * the timer will trigger. */
    this.runningChanged.connect(this, function() {
        if (this.running) {
            prevTrigger = new Date().getTime();
            if (this.triggeredOnStart) {
                trigger();
            }
        }
    })

    this.start = function() {
        this.running = true;
    }
    this.stop = function() {
        this.running = false;
    }
    this.restart = function() {
        this.stop();
        this.start();
    }

    function trigger() {
        if (!self.repeat)
            // We set the value directly in order to be able to emit the runningChanged
            // signal after triggered, like Qt does it.
            self.$properties.running.val = false;

        // Trigger this.
        self.triggered();

        if (!self.repeat)
            // Emit changed signal manually after setting the value manually above.
            self.runningChanged();
    }

    engine.$registerStart(function() {
        if (self.running) {
            self.running = false; // toggled back by self.start();
            self.start();
        }
    });

    engine.$registerStop(function() {
        self.stop();
    });
  }
});
