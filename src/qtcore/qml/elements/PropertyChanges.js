function QMLPropertyChanges(meta) {
    QMLBaseObject.call(this, meta);

    createSimpleProperty("QtObject", this, "target");
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
inherit(QMLPropertyChanges, QMLBaseObject);

registerQmlType('PropertyChanges', QMLPropertyChanges);
