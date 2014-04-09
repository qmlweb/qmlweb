function QMLPropertyChanges(meta) {
    QMLBaseObject.call(this, meta);

    createProperty("QtObject", this, "target");
    createProperty("bool", this, "explicit");
    createProperty("bool", this, "restoreEntryValues", {initialValue: true});

    this.$actions = [];

    this.$setCustomData = function(propName, value) {
        this.$actions.push({
            property: propName,
            value: value
        });
    }
}
inherit(QMLPropertyChanges, QMLBaseObject);

registerQmlType('PropertyChanges', QMLPropertyChanges);
