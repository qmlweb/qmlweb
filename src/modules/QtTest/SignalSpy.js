// eslint-disable-next-line no-undef
class QtTest_SignalSpy extends QtQuick_Item {
  static versions = /^1\./;
  static properties = {
    count: "int",
    signalArguments: "list",
    signalName: "string",
    target: "var",
    valid: "bool"
  };

  // TODO

  clear() {
    this.count = 0;
    this.signalArguments.length = 0;
    //this.valid = false;
  }

  /*
  wait(timeout = 5000) {
  }
  */
}
