registerQmlType({
  module:   'QtQuick',
  name:     'Timer',
  versions: /.*/,
  baseClass: QMLBaseObject,
  constructor: function QMLTimer(meta) {
    QMLBaseObject.call(this, meta);
    var prevTrigger,
        self = this;

    createProperty({ type: "int", object: this, name: "interval", initialValue: 1000 });
    createProperty({ type: "bool", object: this, name: "repeat", initialValue: false });
    createProperty({ type: "bool", object: this, name: "running", initialValue: false });
    createProperty({ type: "bool", object: this, name: "triggeredOnStart", initialValue: false });

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

    this.start = function() {
        if (!this.running) {
            this.running = true;
            prevTrigger = (new Date).getTime();
            if (this.triggeredOnStart) {
                trigger();
            }
        }
    }
    this.stop = function() {
        if (this.running) {
            this.running = false;
        }
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
