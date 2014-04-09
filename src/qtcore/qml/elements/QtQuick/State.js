registerQmlType({
  module:   'QtQuick',
  name:     'State',
  versions: /.*/,
  baseClass: QMLBaseObject,
  constructor: function QMLState(meta) {
    QMLBaseObject.call(this, meta);

    createProperty({ type: "string", object: this, name: "name", initialValue: "" });
    createProperty({ type: "list", object: this, name: "changes", initialValue: [] });
    this.$defaultProperty = "changes";
    createProperty({ type: "string", object: this, name: "extend", initialValue: "" });
    createProperty({ type: "bool", object: this, name: "when", initialValue: false });
    this.$item = this.$parent;

    this.whenChanged.connect(this, function(newVal) {
        if (newVal)
            this.$item.state = this.name;
        else if (this.$item.state == this.name)
            this.$item.state = "";
    });

    this.$getAllChanges = function() {
        if (this.extend) {
            for (var i = 0; i < this.$item.states.length; i++)
                if (this.$item.states[i].name == this.extend)
                    return this.$item.states[i].$getAllChanges().concat(this.changes);
        } else
            return this.changes;
    }
  }
});
