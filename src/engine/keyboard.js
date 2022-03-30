QmlWeb.keyCodeToQt = e => {
  const Qt = QmlWeb.Qt;
  e.keypad = e.keyCode >= 96 && e.keyCode <= 111;
  if (e.keyCode === Qt.Key_Tab && e.shiftKey) {
    return Qt.Key_Backtab;
  }
  if (e.keyCode >= 97 && e.keyCode <= 122) {
    return e.keyCode - (97 - Qt.Key_A);
  }
  return e.keyCode;
};

QmlWeb.eventToKeyboard = e => ({
  accepted: false,
  count: 1,
  isAutoRepeat: false,
  key: QmlWeb.keyCodeToQt(e),
  modifiers: e.ctrlKey * QmlWeb.Qt.ControlModifier
           | e.altKey * QmlWeb.Qt.AltModifier
           | e.shiftKey * QmlWeb.Qt.ShiftModifier
           | e.metaKey * QmlWeb.Qt.MetaModifier
           | e.keypad * QmlWeb.Qt.KeypadModifier,
  text: e.key || String.fromCharCode(e.charCode || e.keyCode)
});

QmlWeb.keyboardSignals = {};
[
  "asterisk", "back", "backtab", "call", "cancel", "delete", "escape", "flip",
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, "hangup", "menu", "no", "return", "select",
  "space", "tab", "volumeDown", "volumeUp", "yes", "up", "right", "down", "left"
].forEach(key => {
  const name = key.toString();
  const qtName = `Key_${name[0].toUpperCase()}${name.slice(1)}`;
  const prefix = typeof key === "number" ? "digit" : "";
  QmlWeb.keyboardSignals[QmlWeb.Qt[qtName]] = `${prefix}${name}Pressed`;
});
