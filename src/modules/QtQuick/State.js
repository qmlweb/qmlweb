registerQmlType({
  module:   'QtQuick',
  name:     'State',
  versions: /.*/,
  baseClass: 'QtQml.QtObject',
  constructor: function QMLState(meta) {
    callSuper(this, meta);

    createProperty("string", this, "name");
    createProperty("list", this, "changes");
    this.$defaultProperty = "changes";
    createProperty("string", this, "extend");
    createProperty("bool", this, "when");
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
