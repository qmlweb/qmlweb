// eslint-disable-next-line no-undef
class QtQuick_Animation extends QtQml_QtObject {
  static enums = {
    Animation: { Infinite: -1 },
    Easing: QmlWeb.Easing
  };
  static properties = {
    alwaysRunToEnd: "bool",
    loops: { type: "int", initialValue: 1 },
    paused: "bool",
    running: "bool"
  };

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
}
