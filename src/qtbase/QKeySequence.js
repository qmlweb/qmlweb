class QKeySequence {
  constructor(arg) {
    if (typeof arg === "string") {
      this.$fromString(arg);
    }
  }

  $fromString(arg) {
    const Qt = QmlWeb.Qt;
    const sequences = arg.split(",");
    this.$sequences = [];
    for (let i = 0; i < sequences.length; ++i) {
      const keys = sequences[i].split("+");
      const shortcut = {
        key: null,
        text: sequences[i],
        modifiers: 0
      };
      for (let ii = 0; ii < keys.length; ++ii) {
        switch (keys[ii]) {
          case "Ctrl":
            shortcut.modifiers += Qt.ControlModifier;
            break;
          case "Alt":
            shortcut.modifiers += Qt.AltModifier;
            break;
          case "Meta":
            shortcut.modifiers += Qt.MetaModifier;
            break;
          case "Shift":
            shortcut.modifiers += Qt.ShiftModifier;
            break;
          default:
            shortcut.key = Qt[`Key_${keys[ii]}`];
            break;
        }
      }
      if (shortcut.key) {
        this.$sequences.push(shortcut);
      }
    }
  }

  $match(event) {
    for (const sequence of this.$sequences) {
      if (event.modifiers === sequence.modifiers
       && event.key === sequence.key) {
        return true;
      }
    }
    return false;
  }

  get $text() {
    if (this.$sequences && this.$sequences.length > 0) {
      return this.$sequences[0].text;
    }
    return "";
  }
}

QmlWeb.QKeySequence = QKeySequence;
