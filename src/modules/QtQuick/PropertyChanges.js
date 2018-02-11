QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "PropertyChanges",
  baseClass: "QtQml.QtObject",
  properties: {
    target: "QtObject",
    explicit: "bool",
    restoreEntryValues: { type: "bool", initialValue: true }
  }
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);

    this.$actions = [];
  }
  $setCustomData(property, value) {
    this.$actions.push({ property, value });
  }
});
