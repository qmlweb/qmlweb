function QMLAnimation(meta) {
    QMLBaseObject.call(this, meta);

    // Exports
    this.Animation = {
        Infinite: -1
    };

    createProperty({ type: "bool", object: this, name: "alwaysRunToEnd", initialValue: false });
    createProperty({ type: "int", object: this, name: "loops", initialValue: 1 });
    createProperty({ type: "bool", object: this, name: "paused", initialValue: false });
    createProperty({ type: "bool", object: this, name: "running", initialValue: false });

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
  baseClass: QMLBaseObject,
  constructor: QMLAnimation
});
