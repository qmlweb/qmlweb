registerQmlType({
  module:   'QtQuick',
  name:     'State',
  versions: /.*/,
  baseClass: "QtQml.QtObject",
  properties: {
    name: "string",
    changes: "list",
    extend: "string",
    when: "bool"
  },
  defaultProperty: "changes"
}, class {
  constructor(meta) {
    callSuper(this, meta);

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
