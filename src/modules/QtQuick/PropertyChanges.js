registerQmlType({
  module: "QtQuick",
  name: "PropertyChanges",
  versions: /.*/,
  baseClass: "QtQml.QtObject",
  properties: {
    target: "QtObject",
    explicit: "bool",
    restoreEntryValues: { type: "bool", initialValue: true }
  }
}, class {
  constructor(meta) {
    callSuper(this, meta);

    this.$actions = [];

    this.$setCustomData = function(propName, value) {
        this.$actions.push({
            property: propName,
            value: value
        });
    }
  }
});
