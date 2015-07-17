registerQmlType({
    module: 'QtQuick',
    name: 'Timer',
    versions: /.*/,
    constructor: function QMLTimer(meta) {
        QMLBaseObject.call(this, meta);
        var prevTrigger,
            self = this;

        createSimpleProperty("int", this, "interval");
        createSimpleProperty("bool", this, "repeat");
        createSimpleProperty("bool", this, "running");
        createSimpleProperty("bool", this, "triggeredOnStart");

        this.interval = 1000;
        this.repeat = false;
        this.running = false;
        this.triggeredOnStart = false;

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

        this.start = function () {
            if (!this.running) {
                this.running = true;
                prevTrigger = (new Date).getTime();
                if (this.triggeredOnStart) {
                    trigger();
                }
            }
        }
        this.stop = function () {
            if (this.running) {
                this.running = false;
            }
        }
        this.restart = function () {
            this.stop();
            this.start();
        }

        function trigger() {
            if (!self.repeat)
                self.$properties.running.val = false;

            self.triggered();

            if (!self.repeat)
                self.runningChanged();
        }

        engine.$registerStart(function () {
            if (self.running) {
                self.running = false;
                self.start();
            }
        });

        engine.$registerStop(function () {
            self.stop();
        });
    }
});
