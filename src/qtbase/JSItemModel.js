class JSItemModel {
  constructor() {
    this.roleNames = [];

    this.dataChanged = Signal([
      { type: 'int', name: 'startIndex' },
      { type: 'int', name: 'endIndex' }
    ]);
    this.rowsInserted = Signal([
      { type: 'int', name: 'startIndex' },
      { type: 'int', name: 'endIndex' }
    ]);
    this.rowsMoved = Signal([
      { type: 'int', name: 'sourceStartIndex' },
      { type: 'int', name: 'sourceEndIndex' },
      { type: 'int', name: 'destinationIndex' }
    ]);
    this.rowsRemoved = Signal([
      { type: 'int', name: 'startIndex' },
      { type: 'int', name: 'endIndex' }
    ]);
    this.modelReset = Signal();
  }

  setRoleNames(names) {
    this.roleNames = names;
  }
}

QmlWeb.JSItemModel = JSItemModel;
