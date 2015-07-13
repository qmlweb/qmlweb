function QMLPropertyChanges(meta) {
    QMLQtObject.call(this, meta);

    createSimpleProperty("QObject", this, "target");
    createSimpleProperty("bool", this, "explicit");
    createSimpleProperty("bool", this, "restoreEntryValues");

    this.explicit = false;
    this.restoreEntryValues = true;
    this.$actions = [];

    this.$setCustomData = function(propName, value) {
        this.$actions.push({
            property: propName,
            value: value
        });
    }
}

registerQmlType({
  module:   'QtQuick',
  name:     'PropertyAnimation',
  versions: /.*/,
  constructor: QMLPropertyChanges })
