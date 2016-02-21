function QMLListModel(meta) {
    QMLBaseObject.call(this, meta);
    var self = this,
    firstItem = true;

    var QMLListElement = getConstructor('QtQuick', '2.0', 'ListElement');
     
    createSimpleProperty("int", this, "count");
    createSimpleProperty("list", this, "$items");
    this.$defaultProperty = "$items";
    this.$items = [];
    this.$model = new JSItemModel();
    this.count = 0;

    this.$itemsChanged.connect(this, function(newVal) {
        this.count = this.$items.length;
    updateRoleNames(newVal);
    });

    this.$model.data = function(index, role) {
        return self.$items[index][role];
    }
    this.$model.rowCount = function() {
        return self.$items.length;
    }

    this.append = function(dict) {
        var index = this.$items.length;
        var c = 0;

        if (dict instanceof Array){
            for (var key in dict) {
                this.$items.push(dict[key]);
                c++;
            }
        }else {
            this.$items.push(dict);
            c=1;
        }

        this.$itemsChanged(this.$items);
        this.$model.rowsInserted(index, index + c);
    }
    this.clear = function() {
        this.$model.modelReset();
        this.$items.length = 0;
        this.count = 0;
    }
    this.get = function(index) {
        return this.$items[index];
    }
    this.insert = function(index, dict) {
        this.$items.splice(index, 0, dict);
        this.$itemsChanged(this.$items);
        this.$model.rowsInserted(index, index + 1);
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
        engine.$requestDraw();
    }
    this.setProperty = function(index, property, value) {
        this.$items[index][property] = value;
        engine.$requestDraw();
    }

    function updateRoleNames(newVal){
        if (firstItem && newVal.length > 0 ) {
            firstItem = false;
            var roleNames = [];
            var dict = newVal[0];

            for (var i in (dict instanceof QMLListElement) ? dict.$properties : dict) {
                if (i != "index")
                    roleNames.push(i);
            }

            self.$model.setRoleNames(roleNames);
        }
    }
}

registerQmlType({
  module: 'QtQuick',
  name:   'ListModel',
  versions: /.*/,
  constructor: QMLListModel
});
