class JSItemModel {
  constructor() {
    this.roleNames = [];

    const Signal = QmlWeb.Signal;
    this.dataChanged = Signal.signal([
      { type: "int", name: "startIndex" },
      { type: "int", name: "endIndex" }
    ]);
    this.rowsInserted = Signal.signal([
      { type: "int", name: "startIndex" },
      { type: "int", name: "endIndex" }
    ]);
    this.rowsMoved = Signal.signal([
      { type: "int", name: "sourceStartIndex" },
      { type: "int", name: "sourceEndIndex" },
      { type: "int", name: "destinationIndex" }
    ]);
    this.rowsRemoved = Signal.signal([
      { type: "int", name: "startIndex" },
      { type: "int", name: "endIndex" }
    ]);
    this.modelReset = Signal.signal();
  }

  setRoleNames(names) {
    this.roleNames = names;
  }
}

QmlWeb.JSItemModel = JSItemModel;
