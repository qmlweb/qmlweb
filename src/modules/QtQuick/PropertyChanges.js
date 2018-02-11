// eslint-disable-next-line no-undef
class QtQuick_PropertyChanges extends QtQml_QtObject {
  static properties = {
    target: "QtObject",
    explicit: "bool",
    restoreEntryValues: { type: "bool", initialValue: true }
  };

  constructor(meta) {
    super(meta);

    this.$actions = [];
  }
  $setCustomData(property, value) {
    this.$actions.push({ property, value });
  }
}
