function QMLRepeater(meta) {
    QMLItem.call(this, meta);
    var self = this;
    var QMLListModel = getConstructor('QtQuick', '2.0', 'ListModel');

    createProperty("Component", this, "delegate");
    this.container = function() { return this.parent; }
    this.$defaultProperty = "delegate";
    createProperty("variant", this, "model", {initialValue: 0});
    createProperty("int", this, "count");
    this.$completed = false;
    this.$items = []; // List of created items
    this._childrenInserted = Signal();

    this.modelChanged.connect(applyModel);
    this.delegateChanged.connect(applyModel);
    this.parentChanged.connect(applyModel);

    this.itemAt = function(index) {
        return this.$items[index];
    }

    function callOnCompleted(child) {
        child.Component.completed();
        for (var i = 0; i < child.$tidyupList.length; i++)
            if (child.$tidyupList[i] instanceof QMLBaseObject)
                callOnCompleted(child.$tidyupList[i]);
    }
    function insertChildren(startIndex, endIndex) {
        for (var index = startIndex; index < endIndex; index++) {
            var newItem = self.delegate.createObject(self);

            createProperty("int", newItem, "index");
            var model = self.model instanceof QMLListModel ? self.model.$model : self.model;
            for (var i in model.roleNames) {
                if (typeof newItem.$properties[model.roleNames[i]] == 'undefined')
                  createProperty("variant", newItem, model.roleNames[i]);
                newItem.$properties[model.roleNames[i]].set(model.data(index, model.roleNames[i]), QMLProperty.ReasonInit, newItem, self.model.$context);
            }

            self.container().children.splice(self.parent.children.indexOf(self) - self.$items.length + index, 0, newItem);
            newItem.parent = self.container();
            self.container().childrenChanged();
            self.$items.splice(index, 0, newItem);

            newItem.index = index;

            // TODO debug this. Without check to Init, Completed sometimes called twice.. But is this check correct?
            if (engine.operationState !== QMLOperationState.Init && engine.operationState !== QMLOperationState.Idle) {
                // We don't call those on first creation, as they will be called
                // by the regular creation-procedures at the right time.
                engine.$initializePropertyBindings();
                callOnCompleted(newItem);
            }
        }
        for (var i = endIndex; i < self.$items.length; i++)
            self.$items[i].index = i;

        self.count = self.$items.length;
    }

    function applyModel() {
        if (!self.delegate || !self.parent)
            return;
        var model = self.model instanceof QMLListModel ? self.model.$model : self.model;
        if (model instanceof JSItemModel) {
            model.dataChanged.connect(function(startIndex, endIndex, roles) {
                if (!roles)
                    roles = model.roleNames;
                for (var index = startIndex; index <= endIndex; index++) {
                    for (var i in roles) {
                        self.$items[index].$properties[roles[i]].set(model.data(index, roles[i]), QMLProperty.ReasonInit, self.$items[index], self.model.$context);
                    }
                }
            });
            model.rowsInserted.connect(insertChildren);
            model.rowsMoved.connect(function(sourceStartIndex, sourceEndIndex, destinationIndex) {
                var vals = self.$items.splice(sourceStartIndex, sourceEndIndex-sourceStartIndex);
                for (var i = 0; i < vals.length; i++) {
                    self.$items.splice(destinationIndex + i, 0, vals[i]);
                }
                var smallestChangedIndex = sourceStartIndex < destinationIndex
                                        ? sourceStartIndex : destinationIndex;
                for (var i = smallestChangedIndex; i < self.$items.length; i++) {
                    self.$items[i].index = i;
                }
            });
            model.rowsRemoved.connect(function(startIndex, endIndex) {
                removeChildren(startIndex, endIndex);
                for (var i = startIndex; i < self.$items.length; i++) {
                    self.$items[i].index = i;
                }
                self.count = self.$items.length;
            });
            model.modelReset.connect(function() {
                removeChildren(0, self.$items.length);
                insertChildren(0, model.rowCount());
            });

            insertChildren(0, model.rowCount());
        } else if (typeof model == "number") {
            // must be more elegant here.. do not delete already created models..
            //removeChildren(0, self.$items.length);
            //insertChildren(0, model);

            if (self.$items.length > model) {
               // have more than we need
               removeChildren(model,self.$items.length);
            }
            else
            {
               // need more
               insertChildren(self.$items.length,model);
            }

        }
    }

    function removeChildren(startIndex, endIndex) {
        var removed = self.$items.splice(startIndex, endIndex - startIndex);
        for (var index in removed) {
            removed[index].$delete();
            removeChildProperties(removed[index]);
        }
    }
    function removeChildProperties(child) {
        engine.completedSignals.splice(engine.completedSignals.indexOf(child.Component.completed), 1);
        for (var i = 0; i < child.children.length; i++)
            removeChildProperties(child.children[i])
    }
}

registerQmlType({
  module:   'QtQuick',
  name:     'Repeater',
  versions: /.*/,
  baseClass: 'Item',
  constructor: QMLRepeater
});
