// eslint-disable-next-line no-undef
class QtQuick_Shortcut extends QtQml_QtObject {
  static properties = {
    autoRepeat: "bool",
    context: "enum",
    enabled: "bool",
    nativeText: "string",
    portableText: "string",
    sequence: "keysequence",
    sequences: "var"
  }
  static signals = {
    activated: [],
    activatedAmbiguously: []
  }

  constructor(meta) {
    super(meta);
    this.Keys.pressed.connect(this, this.Keys$onPressed);
    this.sequencesChanged.connect(this, this.$onSequencesChanged);
    this.sequencesChanged.connect(this, this.$updateText);
    this.sequenceChanged.connect(this, this.$updateText);
    this.$onSequencesChanged();
    this.$updateText();
    this.enabledChanged.connect(this, this.$onEnabledChanged);
    this.$onEnabledChanged(this.enabled);
    if (this.$parent) {
      this.$parent.enabledChanged.connect(this, this.$onParentEnabledChanged);
    }
  }

  $delete() {
    this.$stopListening();
    super.$delete();
  }

  $updateText() {
    if (this.sequence) {
      this.nativeText = this.portableText = this.sequence.$text;
    } else if (this.sequences && this.sequences.length > 0) {
      this.nativeText = this.portableText = this.sequences[0].$text;
    }
  }

  Keys$onPressed(event) {
    if (this.sequences) {
      for (const sequence of this.sequences) {
        if (sequence.$match(event)) {
          event.accepted = true;
          this.activated();
          break;
        }
      }
    }
    if (this.sequence) {
      if (this.sequence.$match(event)) {
        event.accepted = true;
        this.activated();
      }
    }
  }

  $isEnabled() {
    for (let item = this; item; item = item.$parent) {
      if (!item.$enabled) {
        return false;
      }
    }
    return true;
  }

  $onParentEnabledChanged() {
    this.$inheritingEnabledChange = true;
    this.enabled = this.$isEnabled();
    delete this.$inheritingEnabledChange;
  }

  $onEnabledChanged(newVal) {
    if (!this.$inheritingEnabledChange) {
      this.$enabled = newVal;
      if (this.$isEnabled() !== newVal) {
        this.enabled = !newVal;
        if (newVal) {
          this.$listen();
        } else {
          this.$stopListening();
        }
      }
    }
  }

  $getWindow() {
    let root = this;
    while (root.$parent) {
      root = root.$parent;
    }
    return root;
  }

  $listen() {
    const provider = this.$getWindow();
    if (!provider.$shortcuts) {
      provider.$shortcuts = [this];
    } else {
      provider.$shortcuts.push(this);
    }
  }

  $stopListening() {
    const provider = this.$getWindow();
    if (provider
        && provider.shortcuts
        && provider.$shortcuts.indexOf(this) >= 0) {
      provider.$shortcuts = provider.$shortcuts.slice(
        provider.$shortcuts.slice(this, 1)
      );
    }
  }

  $onSequencesChanged() {
    if (this.$updatingSequences || !this.sequences) {
      return;
    }
    try {
      this.$updatingSequences = 1;
      for (let i = 0; i < this.sequences.length; ++i) {
        const sequence = this.sequences[i];
        if (typeof sequence !== "object") {
          this.sequences[i] = new QmlWeb.QKeySequence(sequence);
        }
      }
    } finally {
      this.$updatingSequences = 0;
    }
  }
}
