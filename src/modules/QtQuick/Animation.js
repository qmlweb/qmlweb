QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "Animation",
  versions: /.*/,
  baseClass: "QtQml.QtObject",
  enums: {
    Animation: { Infinite: -1 },
    Easing: QmlWeb.Easing
  },
  properties: {
    alwaysRunToEnd: "bool",
    loops: { type: "int", initialValue: 1 },
    paused: "bool",
    running: "bool"
  }
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);
  }
  restart() {
    this.stop();
    this.start();
  }
  start() {
    this.running = true;
  }
  stop() {
    this.running = false;
  }
  pause() {
    this.paused = true;
  }
  resume() {
    this.paused = false;
  }
  complete() {
    // To be overridden
    console.log("Unbound method for", this);
  }
});
