class Signal {
  constructor(params = [], options = {}) {
    this.connectedSlots = [];
    this.obj = options.obj;
    this.options = options;

    this.signal = (...args) => this.execute(...args);
    this.signal.parameters = params;
    this.signal.connect = this.connect.bind(this);
    this.signal.disconnect = this.disconnect.bind(this);
    this.signal.isConnected = this.isConnected.bind(this);
  }
  execute(...args) {
    QmlWeb.QMLProperty.pushEvalStack();
    for (const i in this.connectedSlots) {
      try {
        this.connectedSlots[i].slot.apply(this.connectedSlots[i].thisObj, args);
      } catch (err) {
        console.error("Signal slot error:", err.message, err,
          Function.prototype.toString.call(this.connectedSlots[i].slot)
        );
      }
    }
    QmlWeb.QMLProperty.popEvalStack();
  }
  connect(...args) {
    let type = Signal.AutoConnection;
    if (typeof args[args.length - 1] === "number") {
      type = args.pop();
    }
    if (type & Signal.UniqueConnection) {
      if (this.isConnected(...args)) {
        return;
      }
    }
    if (args.length === 1) {
      this.connectedSlots.push({ thisObj: global, slot: args[0] });
    } else if (typeof args[1] === "string" || args[1] instanceof String) {
      if (args[0].$tidyupList && args[0] !== this.obj) {
        args[0].$tidyupList.push(this.signal);
      }
      this.connectedSlots.push({ thisObj: args[0], slot: args[0][args[1]] });
    } else {
      if (args[0].$tidyupList &&
        (!this.obj || args[0] !== this.obj && args[0] !== this.obj.$parent)
      ) {
        args[0].$tidyupList.push(this.signal);
      }
      this.connectedSlots.push({ thisObj: args[0], slot: args[1] });
    }

    // Notify object of connect
    if (this.options.obj && this.options.obj.$connectNotify) {
      this.options.obj.$connectNotify(this.options);
    }
  }
  disconnect(...args) {
    // type meaning:
    //  1 = function, 2 = string
    //  3 = object with string method,  4 = object with function
    const callType = args.length === 1
      ? args[0] instanceof Function ? 1 : 2
      : typeof args[1] === "string" || args[1] instanceof String ? 3 : 4;
    for (let i = 0; i < this.connectedSlots.length; i++) {
      const { slot, thisObj } = this.connectedSlots[i];
      if (
        callType === 1 && slot === args[0] ||
        callType === 2 && thisObj === args[0] ||
        callType === 3 && thisObj === args[0] && slot === args[0][args[1]] ||
        thisObj === args[0] && slot === args[1]
      ) {
        if (thisObj) {
          const index = thisObj.$tidyupList.indexOf(this.signal);
          thisObj.$tidyupList.splice(index, 1);
        }
        this.connectedSlots.splice(i, 1);
        // We have removed an item from the list so the indexes shifted one
        // backwards
        i--;
      }
    }

    // Notify object of disconnect
    if (this.options.obj && this.options.obj.$disconnectNotify) {
      this.options.obj.$disconnectNotify(this.options);
    }
  }
  isConnected(...args) {
    const callType = args.length === 1 ? 1
      : typeof args[1] === "string" || args[1] instanceof String ? 2 : 3;
    for (const i in this.connectedSlots) {
      const { slot, thisObj } = this.connectedSlots[i];
      if (callType === 1 && slot === args[0] ||
          callType === 2 && thisObj === args[0] && slot === args[0][args[1]] ||
          thisObj === args[0] && slot === args[1]
      ) {
        return true;
      }
    }
    return false;
  }
  static signal(...args) {
    return (new Signal(...args)).signal;
  }
}
Signal.AutoConnection = 0;
Signal.UniqueConnection = 128;

QmlWeb.Signal = Signal;
