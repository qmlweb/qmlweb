registerQmlType({
    module: 'QtQuick',
    name: 'Animation',
    versions: /.*/,
    constructor: function QMLAnimation(meta) {
        QMLBaseObject.call(this, meta);

        this.Animation = {
            Infinite: -1
        };

        createSimpleProperty("bool", this, "alwaysRunToEnd");
        createSimpleProperty("int", this, "loops");
        createSimpleProperty("bool", this, "paused");
        createSimpleProperty("bool", this, "running");

        this.alwaysRunToEnd = false;
        this.loops = 1;
        this.paused = false;
        this.running = false;

        this.restart = function () {
            this.stop();
            this.start();
        };
        this.start = function () {
            this.running = true;
        }
        this.stop = function () {
            this.running = false;
        }
        this.pause = function () {
            this.paused = true;
        }
        this.resume = function () {
            this.paused = false;
        }

        this.complete = unboundMethod;
    }
});
