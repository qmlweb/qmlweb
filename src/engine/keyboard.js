QmlWeb.keyCodeToQt = e => {
  e.keypad = e.keyCode >= 96 && e.keyCode <= 111;
  if (e.keyCode === Qt.Key_Tab && e.shiftKey) {
    return Qt.Key_Backtab;
  }
  if (e.keyCode >= 97 && e.keyCode <= 122) {
    return e.keyCode - (97 - Qt.Key_A);
  }
  return e.keyCode;
},

QmlWeb.eventToKeyboard = e => ({
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
});

QmlWeb.keyboardSignals = {};
["asterisk", "back", "backtab", "call", "cancel", "delete", "escape", "flip",
 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, "hangup", "menu", "no", "return", "select",
 "space", "tab", "volumeDown", "volumeUp", "yes", "up", "right", "down", "left"
].forEach(key => {
  const prefix = typeof key === "number" ? "digit" : "";
  key = key.toString();
  const name = `Key_${key[0].toUpperCase()}${key.slice(1)}`;
  QmlWeb.keyboardSignals[Qt[name]] = `${prefix}${key}Pressed`;
});
