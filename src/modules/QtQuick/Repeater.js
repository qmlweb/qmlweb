QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "Repeater",
  versions: /.*/,
  baseClass: "Item",
  properties: {
    delegate: "Component",
    model: { type: "variant", initialValue: 0 },
    count: "int"
  },
  signals: {
    _childrenInserted: []
  },
  defaultProperty: "delegate"
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);

    this.parent = meta.parent;
    // TODO: some (all ?) of the components including Repeater needs to know own
    // parent at creation time. Please consider this major change.

    this.$completed = false;
    this.$items = []; // List of created items

    this.modelChanged.connect(this, this.$onModelChanged);
    this.delegateChanged.connect(this, this.$onDelegateChanged);
    this.parentChanged.connect(this, this.$onParentChanged);
  }
  container() {
    return this.parent;
  }
  itemAt(index) {
    return this.$items[index];
  }
  $onModelChanged() {
    this.$applyModel();
  }
  $onDelegateChanged() {
    this.$applyModel();
  }
  $onParentChanged() {
    this.$applyModel();
  }
  $getModel() {
    const QMLListModel = QmlWeb.getConstructor("QtQuick", "2.0", "ListModel");
    return this.model instanceof QMLListModel ?
            this.model.$model :
            this.model;
  }
  $applyModel() {
    if (!this.delegate || !this.parent) {
      return;
    }
    const model = this.$getModel();
    if (model instanceof QmlWeb.JSItemModel) {
      const flags = QmlWeb.Signal.UniqueConnection;
      model.dataChanged.connect(this, this.$_onModelDataChanged, flags);
      model.rowsInserted.connect(this, this.$insertChildren, flags);
      model.rowsMoved.connect(this, this.$_onRowsMoved, flags);
      model.rowsRemoved.connect(this, this.$_onRowsRemoved, flags);
      model.modelReset.connect(this, this.$_onModelReset, flags);

      this.$removeChildren(0, this.$items.length);
      this.$insertChildren(0, model.rowCount());
    } else if (typeof model === "number") {
      // must be more elegant here.. do not delete already created models..
      //this.$removeChildren(0, this.$items.length);
      //this.$insertChildren(0, model);

      if (this.$items.length > model) {
        // have more than we need
        this.$removeChildren(model, this.$items.length);
        // Normally this is done in $insertChildren, but that won't be called
        // in this case
        this.count = this.$items.length;
      } else {
        // need more
        this.$insertChildren(this.$items.length, model);
      }
    } else if (model instanceof Array) {
      this.$removeChildren(0, this.$items.length);
      this.$insertChildren(0, model.length);
    }
  }
  $callOnCompleted(child) {
    child.Component.completed();
    const QMLBaseObject = QmlWeb.getConstructor("QtQml", "2.0", "QtObject");
    for (let i = 0; i < child.$tidyupList.length; i++) {
      if (child.$tidyupList[i] instanceof QMLBaseObject) {
        this.$callOnCompleted(child.$tidyupList[i]);
      }
    }
  }
  $_onModelDataChanged(startIndex, endIndex, roles) {
    const model = this.$getModel();
    const roleNames = roles || model.roleNames;
    for (let index = startIndex; index <= endIndex; index++) {
      const item = this.$items[index];
      for (const i in roleNames) {
        item.$properties[roleNames[i]].set(
          model.data(index, roleNames[i]),
          QmlWeb.QMLProperty.ReasonInit,
          item,
          this.model.$context
        );
      }
    }
  }
  $_onRowsMoved(sourceStartIndex, sourceEndIndex, destinationIndex) {
    const vals = this.$items.splice(
      sourceStartIndex,
      sourceEndIndex - sourceStartIndex
    );
    for (let i = 0; i < vals.length; i++) {
      this.$items.splice(destinationIndex + i, 0, vals[i]);
    }
    const smallestChangedIndex = sourceStartIndex < destinationIndex ?
                                  sourceStartIndex :
                                  destinationIndex;
    for (let i = smallestChangedIndex; i < this.$items.length; i++) {
      this.$items[i].index = i;
    }
  }
  $_onRowsRemoved(startIndex, endIndex) {
    this.$removeChildren(startIndex, endIndex);
    for (let i = startIndex; i < this.$items.length; i++) {
      this.$items[i].index = i;
    }
    this.count = this.$items.length;
  }
  $_onModelReset() {
    this.$applyModel();
  }
  $insertChildren(startIndex, endIndex) {
    if (endIndex <= 0) {
      this.count = 0;
      return;
    }

    const QMLOperationState = QmlWeb.QMLOperationState;
    const createProperty = QmlWeb.createProperty;
    const model = this.$getModel();
    let index;
    for (index = startIndex; index < endIndex; index++) {
      const newItem = this.delegate.$createObject();
      createProperty("int", newItem, "index", { initialValue: index });

      // To properly import JavaScript in the context of a component
      this.delegate.finalizeImports();

      if (typeof model === "number" || model instanceof Array) {
        if (typeof newItem.$properties.modelData === "undefined") {
          createProperty("variant", newItem, "modelData");
        }
        const value = model instanceof Array ?
                      model[index] :
                      typeof model === "number" ? index : "undefined";
        newItem.$properties.modelData.set(value, QmlWeb.QMLProperty.ReasonInit,
          newItem, model.$context);
      } else {
        for (let i = 0; i < model.roleNames.length; i++) {
          const roleName = model.roleNames[i];
          if (typeof newItem.$properties[roleName] === "undefined") {
            createProperty("variant", newItem, roleName);
          }
          newItem.$properties[roleName].set(
            model.data(index, roleName), QmlWeb.QMLProperty.ReasonInit,
            newItem, this.model.$context
          );
        }
      }

      this.$items.splice(index, 0, newItem);

      // parent must be set after the roles have been added to newItem scope in
      // case we are outside of QMLOperationState.Init and parentChanged has
      // any side effects that result in those roleNames being referenced.
      newItem.parent = this.parent;

      // TODO debug this. Without check to Init, Completed sometimes called
      // twice.. But is this check correct?
      if (QmlWeb.engine.operationState !== QMLOperationState.Init &&
          QmlWeb.engine.operationState !== QMLOperationState.Idle) {
        // We don't call those on first creation, as they will be called
        // by the regular creation-procedures at the right time.
        this.$callOnCompleted(newItem);
      }
    }
    if (QmlWeb.engine.operationState !== QMLOperationState.Init) {
      // We don't call those on first creation, as they will be called
      // by the regular creation-procedures at the right time.
      QmlWeb.engine.$initializePropertyBindings();
    }

    if (index > 0) {
      this.container().childrenChanged();
    }

    for (let i = endIndex; i < this.$items.length; i++) {
      this.$items[i].index = i;
    }

    this.count = this.$items.length;
  }
  $removeChildren(startIndex, endIndex) {
    const removed = this.$items.splice(startIndex, endIndex - startIndex);
    for (const index in removed) {
      removed[index].$delete();
      this.$removeChildProperties(removed[index]);
    }
  }
  $removeChildProperties(child) {
    const signals = QmlWeb.engine.completedSignals;
    signals.splice(signals.indexOf(child.Component.completed), 1);
    for (let i = 0; i < child.children.length; i++) {
      this.$removeChildProperties(child.children[i]);
    }
  }
});
