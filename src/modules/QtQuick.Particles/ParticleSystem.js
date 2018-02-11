// eslint-disable-next-line no-undef
class QtQuick_Particles_ParticleSystem extends QtQuick_Item {
  static versions = /^2\./;
  static properties = {
    empty: "bool",
    particleStates: "list",
    paused: "bool",
    running: { type: "bool", initialValue: true }
  };

  // TODO

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
}
