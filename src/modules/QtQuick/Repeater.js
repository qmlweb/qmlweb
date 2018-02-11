// eslint-disable-next-line no-undef
class QtQuick_Repeater extends QtQuick_Item {
  static properties = {
    delegate: "Component",
    model: { type: "variant", initialValue: 0 },
    count: "int"
  };
  static signals = {
    _childrenInserted: []
  };
  static defaultProperty = "delegate";

  constructor(meta) {
    super(meta);

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
      model.rowsInserted.connect(this, this.$_onRowsInserted, flags);
      model.rowsMoved.connect(this, this.$_onRowsMoved, flags);
      model.rowsRemoved.connect(this, this.$_onRowsRemoved, flags);
      model.modelReset.connect(this, this.$_onModelReset, flags);

      this.$removeChildren(0, this.$items.length);
      this.$insertChildren(0, model.rowCount());
    } else if (typeof model === "number") {
      if (this.$items.length > model) {
        // have more than we need
        this.$removeChildren(model, this.$items.length);
      } else {
        // need more
        this.$insertChildren(this.$items.length, model);
      }
    } else if (model instanceof Array) {
      this.$removeChildren(0, this.$items.length);
      this.$insertChildren(0, model.length);
    }
    this.count = this.$items.length;
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
      const modelData = item.$properties.model;
      for (const i in roleNames) {
        const roleName = roleNames[i];
        const roleData = model.data(index, roleName);
        item.$properties[roleName].set(
          roleData,
          QmlWeb.QMLProperty.ReasonInit,
          item,
          this.model.$context
        );
        modelData[roleName] = roleData;
      }
      item.$properties.model.set(
        modelData,
        QmlWeb.QMLProperty.ReasonInit,
        item,
        this.model.$context
      );
    }
  }
  $_onRowsInserted(startIndex, endIndex) {
    this.$insertChildren(startIndex, endIndex);
    this.count = this.$items.length;
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
      const newItem = this.delegate.$createObject(this.parent);
      createProperty("int", newItem, "index", { initialValue: index });

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
        // QML exposes a "model" property in the scope that contains all role
        // data.
        const modelData = {};
        for (let i = 0; i < model.roleNames.length; i++) {
          const roleName = model.roleNames[i];
          if (typeof newItem.$properties[roleName] === "undefined") {
            createProperty("variant", newItem, roleName);
          }
          const roleData = model.data(index, roleName);
          modelData[roleName] = roleData;
          newItem.$properties[roleName].set(
            roleData, QmlWeb.QMLProperty.ReasonInit,
            newItem, this.model.$context
          );
        }
        if (typeof newItem.$properties.model === "undefined") {
          createProperty("variant", newItem, "model");
        }
        newItem.$properties.model.set(
          modelData, QmlWeb.QMLProperty.ReasonInit,
          newItem, this.model.$context
        );
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
}
