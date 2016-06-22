/**
 * Creates and returns a signal with the parameters specified in @p params.
 *
 * @param params Array with the parameters of the signal. Each element has to be
 *               an object with the two properties "type" and "name" specifying
 *               the datatype of the parameter and its name. The type is
 *               currently ignored.
 * @param options Options that allow finetuning of the signal.
 */
global.Signal = function Signal(params, options) {
    options = options || {};
    var connectedSlots = [];
    var obj = options.obj

    var signal = function() {
        pushEvalStack();
        for (var i in connectedSlots)
            try {
                connectedSlots[i].slot.apply(connectedSlots[i].thisObj, arguments);
            } catch(err) {
                console.log("Signal slot error:", err, Function.prototype.toString.call(connectedSlots[i].slot));
            }
        popEvalStack();
    };
    signal.parameters = params || [];
    signal.connect = function() {
        if (arguments.length == 1)
            connectedSlots.push({thisObj: global, slot: arguments[0]});
        else if (typeof arguments[1] == 'string' || arguments[1] instanceof String) {
            if (arguments[0].$tidyupList && arguments[0] !== obj)
                arguments[0].$tidyupList.push(this);
            connectedSlots.push({thisObj: arguments[0], slot: arguments[0][arguments[1]]});
        } else {
            if (arguments[0].$tidyupList && (!obj || (arguments[0] !== obj && arguments[0] !== obj.$parent)))
                arguments[0].$tidyupList.push(this);
            connectedSlots.push({thisObj: arguments[0], slot: arguments[1]});
        }

        // Notify object of connect
        if (options.obj && options.obj.$connectNotify) {
            options.obj.$connectNotify(options);
        }

    }
    signal.disconnect = function() {
        // callType meaning: 1 = function  2 = string  3 = object with string method  4 = object with function

        var callType = arguments.length == 1 ? (arguments[0] instanceof Function ? 1 : 2)
                       : (typeof arguments[1] == 'string' || arguments[1] instanceof String) ? 3 : 4;
        for (var i = 0; i < connectedSlots.length; i++) {
            var item = connectedSlots[i];
            if ((callType == 1 && item.slot == arguments[0])
                || (callType == 2 && item.thisObj == arguments[0])
                || (callType == 3 && item.thisObj == arguments[0] && item.slot == arguments[0][arguments[1]])
                || (item.thisObj == arguments[0] && item.slot == arguments[1])
            ) {
                if (item.thisObj)
                    item.thisObj.$tidyupList.splice(item.thisObj.$tidyupList.indexOf(this), 1);
                connectedSlots.splice(i, 1);
                i--; // We have removed an item from the list so the indexes shifted one backwards
            }
        }

        // Notify object of disconnect
        if (options.obj && options.obj.$disconnectNotify) {
            options.obj.$disconnectNotify(options);
        }
    }
    signal.isConnected = function() {
        var callType = arguments.length == 1 ? 1
                       : (typeof arguments[1] == 'string' || arguments[1] instanceof String) ? 2 : 3;
        for (var i in connectedSlots) {
            var item = connectedSlots[i];
            if ((callType == 1 && item.slot == arguments[0])
                || (callType == 2 && item.thisObj == arguments[0] && item.slot == arguments[0][arguments[1]])
                || (item.thisObj == arguments[0] && item.slot == arguments[1])
            )
                return true;
        }
        return false;
    }
    return signal;
}

