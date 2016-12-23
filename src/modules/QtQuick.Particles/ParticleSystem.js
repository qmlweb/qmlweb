QmlWeb.registerQmlType({
  module: "QtQuick.Particles",
  name: "ParticleSystem",
  versions: /^2\./,
  baseClass: "QtQuick.Item",
  properties: {
    empty: "bool",
    particleStates: "list",
    paused: "bool",
    running: { type: "bool", initialValue: true }
  }
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);

    // TODO
  }
  pause() {
    this.paused = true;
  }
  reset() {
    // TODO
  }
  restart() {
    this.running = false;
    this.running = true;
  }
  resume() {
    this.paused = false;
  }
  start() {
    this.running = true;
  }
  stop() {
    this.running = false;
  }
});
