class Signal {
  connectedSlots = [];
  signal = null;

  constructor(params = [], options = {}) {
    this.obj = options.obj;
    this.options = options;

    this.signal = (...args) => this.execute(...args);
    this.signal.parameters = params;
    this.signal.connect = this.connect.bind(this);
    this.signal.disconnect = this.disconnect.bind(this);
    this.signal.isConnected = this.isConnected.bind(this);

    // TODO Fix Keys that don't have an obj for the signal
    if (this.obj && this.obj.$signals !== undefined) {
      this.obj.$signals.push(this.signal);
    }
  }
  execute(...args) {
    QmlWeb.QMLProperty.pushEvalStack();
    for (const i in this.connectedSlots) {
      const desc = this.connectedSlots[i];
      if (desc.type & Signal.QueuedConnection) {
        Signal.$addQueued(desc, args);
      } else {
        Signal.$execute(desc, args);
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
      this.connectedSlots.push({ thisObj: global, slot: args[0], type });
    } else if (typeof args[1] === "string" || args[1] instanceof String) {
      if (args[0].$tidyupList && args[0] !== this.obj) {
        args[0].$tidyupList.push(this.signal);
      }
      const slot = args[0][args[1]];
      this.connectedSlots.push({ thisObj: args[0], slot, type });
    } else {
      if (args[0].$tidyupList &&
        (!this.obj || args[0] !== this.obj && args[0] !== this.obj.$parent)
      ) {
        args[0].$tidyupList.push(this.signal);
      }
      this.connectedSlots.push({ thisObj: args[0], slot: args[1], type });
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
    // No args means disconnect everything connected to this signal
    const callType = args.length === 1
      ? args[0] instanceof Function ? 1 : 2
      : typeof args[1] === "string" || args[1] instanceof String ? 3 : 4;
    for (let i = 0; i < this.connectedSlots.length; i++) {
      const { slot, thisObj } = this.connectedSlots[i];
      if (
        args.length === 0 ||
        callType === 1 && slot === args[0] ||
        callType === 2 && thisObj === args[0] ||
        callType === 3 && thisObj === args[0] && slot === args[0][args[1]] ||
        thisObj === args[0] && slot === args[1]
      ) {
        if (thisObj) {
          const index = thisObj.$tidyupList.indexOf(this.signal);
          if (index >= 0) {
            thisObj.$tidyupList.splice(index, 1);
          }
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

  static $execute(desc, args) {
    try {
      desc.slot.apply(desc.thisObj, args);
    } catch (err) {
      console.error("Signal slot error:", err.message, err,
        desc.slot
        ? Function.prototype.toString.call(desc.slot)
        : "desc.slot is undefined!"
      );
    }
  }

  static $addQueued(desc, args) {
    if (Signal.$queued.length === 0) {
      if (global.setImmediate) {
        global.setImmediate(Signal.$executeQueued);
      } else {
        global.setTimeout(Signal.$executeQueued, 0);
      }
    }
    Signal.$queued.push([desc, args]);
  }
  static $executeQueued() {
    // New queued signals should be executed on next tick of the event loop
    const queued = Signal.$queued;
    Signal.$queued = [];

    QmlWeb.QMLProperty.pushEvalStack();
    for (const i in queued) {
      Signal.$execute(...queued[i]);
    }
    QmlWeb.QMLProperty.popEvalStack();
  }

  static $queued = [];

  static AutoConnection = 0;
  static DirectConnection = 1;
  static QueuedConnection = 2;
  static UniqueConnection = 128;
}

QmlWeb.Signal = Signal;
