function QMLAnimation(meta) {
    callSuper(this, meta);

    // Exports
    this.Animation = {
        Infinite: -1
    };

    createProperty("bool", this, "alwaysRunToEnd");
    createProperty("int", this, "loops", {initialValue: 1});
    createProperty("bool", this, "paused");
    createProperty("bool", this, "running");

    // Methods
    this.restart = function() {
        this.stop();
        this.start();
    };
    this.start = function() {
        this.running = true;
    }
    this.stop = function() {
        this.running = false;
    }
    this.pause = function() {
        this.paused = true;
    }
    this.resume = function() {
        this.paused = false;
    }

    // To be overridden
    this.complete = unboundMethod;
}

registerQmlType({
  module:   'QtQuick',
  name:     'Animation',
  versions: /.*/,
  baseClass: 'QtQml.QtObject',
  constructor: QMLAnimation
});
