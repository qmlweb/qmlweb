const keyDownSigs = {
  42: "asteriskPressed",
  46: "deletePressed",
  48: "digit0Pressed",
  49: "digit1Pressed",
  51: "digit2Pressed",
  52: "digit3Pressed",
  53: "digit4Pressed",
  54: "digit5Pressed",
  55: "digit6Pressed",
  56: "digit7Pressed",
  57: "digit8Pressed",
  58: "digit9Pressed",
  40: "downPressed",
  27: "escapePressed",
  37: "leftPressed",
  13: "returnPressed",
  39: "rightPressed",
  93: "selectPressed",
  32: "spacePressed",
  9: "tabPressed",
  38: "upPressed",
  183: "volumeDownPressed",
  182: "volumeUpPressed"
};

class QMLKeysAttached extends QmlWeb.QObject {
  constructor(parent) {
    const signalParams = [{ type: "variant", name: "event" }];
    const Signal = QmlWeb.Signal;
    super(parent);
    this.asteriskPressed = Signal.signal(signalParams);
    this.backPressed = Signal.signal(signalParams);
    this.backtabPressed = Signal.signal(signalParams);
    this.callPressed = Signal.signal(signalParams);
    this.cancelPressed = Signal.signal(signalParams);
    for (let i = 1; i < 5; ++i) {
      this[`context${i}Pressed`] = Signal.signal(signalParams);
    }
    this.deletePressed = Signal.signal(signalParams);
    for (let i = 0; i < 10; ++i) {
      this[`digit${i}Pressed`] = Signal.signal(signalParams);
    }
    this.downPressed = Signal.signal(signalParams);
    this.enterPressed = Signal.signal(signalParams);
    this.escapePressed = Signal.signal(signalParams);
    this.flipPressed = Signal.signal(signalParams);
    this.hangupPressed = Signal.signal(signalParams);
    this.leftPressed = Signal.signal(signalParams);
    this.menuPressed = Signal.signal(signalParams);
    this.noPressed = Signal.signal(signalParams);
    this.pressed = Signal.signal(signalParams);
    this.released = Signal.signal(signalParams);
    this.returnPressed = Signal.signal(signalParams);
    this.rightPressed = Signal.signal(signalParams);
    this.selectPressed = Signal.signal(signalParams);
    this.spacePressed = Signal.signal(signalParams);
    this.tabPressed = Signal.signal(signalParams);
    this.upPressed = Signal.signal(signalParams);
    this.volumeDownPressed = Signal.signal(signalParams);
    this.volumeUpPressed = Signal.signal(signalParams);
    this.yesPressed = Signal.signal(signalParams);
  }

  $onPress(event) {
    this.pressed(event);
    if (event.key === QmlWeb.Qt.Key_Backtab
      && event.modifiers === QmlWeb.Qt.ShiftModifier) {
      this.backtabPressed(event);
    } else if (event.key in keyDownSigs) {
      this[keyDownSigs[event.key]](event);
    }
  }
}

class QtQuick_Keys extends QmlWeb.QObject {
  constructor(meta) {
    super(meta);
    throw new Error("Do not create objects of type Keys");
  }
  static getAttachedObject() {
    if (!this.$Keys) {
      this.$Keys = new QMLKeysAttached(this);
    }
    return this.$Keys;
  }
}
