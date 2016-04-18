function QMLPropertyChanges(meta) {
    QMLBaseObject.call(this, meta);

    createProperty({ type: "QtObject", object: this, name: "target" });
    createProperty({ type: "bool", object: this, name: "explicit", initialValue: false });
    createProperty({ type: "bool", object: this, name: "restoreEntryValues", initialValue: true });

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
