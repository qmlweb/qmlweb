const QmlWeb = {
  qrc: {},

  keyCodeToQt: e => {
    e.keypad = e.keyCode >= 96 && e.keyCode <= 111;
    if (e.keyCode === Qt.Key_Tab && e.shiftKey) {
      return Qt.Key_Backtab;
    }
    if (e.keyCode >= 97 && e.keyCode <= 122) {
      return e.keyCode - (97 - Qt.Key_A);
    }
    return e.keyCode;
  },

  eventToKeyboard: e => ({
    accepted: false,
    count: 1,
    isAutoRepeat: false,
    key: QmlWeb.keyCodeToQt(e),
    modifiers: e.ctrlKey * Qt.CtrlModifier
             | e.altKey * Qt.AltModifier
             | e.shiftKey * Qt.ShiftModifier
             | e.metaKey * Qt.MetaModifier
             | e.keypad * Qt.KeypadModifier,
    text: String.fromCharCode(e.charCode)
  })
};

global.QmlWeb = QmlWeb;
