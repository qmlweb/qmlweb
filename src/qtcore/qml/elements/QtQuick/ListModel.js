registerQmlType({
  module: 'QtQuick',
  name:   'ListModel',
  versions: /.*/,
  baseClass: 'QtObject',
  constructor: function QMLListModel(meta) {
    QMLBaseObject.call(this, meta);
    var self = this,
    firstItem = true;
    var QMLListElement = getConstructor('QtQuick', '2.0', 'ListElement');

    createProperty("int", this, "count");
    createProperty("list", this, "$items");
    this.$defaultProperty = "$items";
    this.$model = new JSItemModel();

    this.$itemsChanged.connect(this, function(newVal) {
        if (firstItem) {
            firstItem = false;
            var roleNames = [];
            var dict = newVal[0];
            for (var i in (dict instanceof QMLListElement) ? dict.$properties : dict) {
                if (i != "index")
                    roleNames.push(i);
            }
            this.$model.setRoleNames(roleNames);
        }
        this.count = this.$items.length;
    });

    this.$model.data = function(index, role) {
        return self.$items[index][role];
    }
    this.$model.rowCount = function() {
        return self.$items.length;
    }

    this.append = function(dict) {
        this.insert(this.$items.length, dict);
    }
    this.clear = function() {
        this.$items = [];
        this.$model.modelReset();
        this.count = 0;
    }
    this.get = function(index) {
        return this.$items[index];
    }
    this.insert = function(index, dict) {
        this.$items.splice(index, 0, dict);
        this.$itemsChanged(this.$items);
        this.$model.rowsInserted(index, index+1);
    }
    this.move = function(from, to, n) {
        var vals = this.$items.splice(from, n);
        for (var i = 0; i < vals.length; i++) {
            this.$items.splice(to + i, 0, vals[i]);
        }
        this.$model.rowsMoved(from, from+n, to);
    }
    this.remove = function(index) {
        this.$items.splice(index, 1);
        this.$model.rowsRemoved(index, index+1);
        this.count = this.$items.length;
    }
    this.set = function(index, dict) {
        this.$items[index] = dict;
        this.$model.dataChanged(index, index);
    }
    this.setProperty = function(index, property, value) {
        this.$items[index][property] = value;
    }
  }
});
