/****************************************************************************
**
** Copyright (C) 2014 Digia Plc and/or its subsidiary(-ies).
** Copyright (C) 2014 Klarälvdalens Datakonsult AB, a KDAB Group company, info@kdab.com, author Milian Wolff <milian.wolff@kdab.com>
** Copyright (C) 2015 Anton Kreuzkamp <akreuzkamp@web.de>
** Contact: http://www.qt-project.org/legal
**
** This file is part of the QtWebChannel module of the Qt Toolkit.
**
** $QT_BEGIN_LICENSE:LGPL21$
** Commercial License Usage
** Licensees holding valid commercial Qt licenses may use this file in
** accordance with the commercial license agreement provided with the
** Software or, alternatively, in accordance with the terms contained in
** a written agreement between you and Digia. For licensing terms and
** conditions see http://qt.digia.com/licensing. For further information
** use the contact form at http://qt.digia.com/contact-us.
**
** GNU Lesser General Public License Usage
** Alternatively, this file may be used under the terms of the GNU Lesser
** General Public License version 2.1 or version 3 as published by the Free
** Software Foundation and appearing in the file LICENSE.LGPLv21 and
** LICENSE.LGPLv3 included in the packaging of this file. Please review the
** following information to ensure the GNU Lesser General Public License
** requirements will be met: https://www.gnu.org/licenses/lgpl.html and
** http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html.
**
** In addition, as a special exception, Digia gives you certain additional
** rights. These rights are described in the Digia Qt LGPL Exception
** version 1.1, included in the file LGPL_EXCEPTION.txt in this package.
**
** $QT_END_LICENSE$
**
****************************************************************************/

"use strict";

// exports
var QWebChannel;

(function(){

var QWebChannelMessageTypes = {
    signal: 1,
    propertyUpdate: 2,
    init: 3,
    idle: 4,
    debug: 5,
    invokeMethod: 6,
    connectToSignal: 7,
    disconnectFromSignal: 8,
    setProperty: 9,
    response: 10,
};

QWebChannel = function(transport, initCallback)
{
    if (typeof transport !== "object" || typeof transport.send !== "function") {
        console.error("The QWebChannel expects a transport object with a send function and onmessage callback property." +
                      " Given is: transport: " + typeof(transport) + ", transport.send: " + typeof(transport.send));
        return;
    }

    var channel = this;
    this.transport = transport;

    this.send = function(data)
    {
        if (typeof(data) !== "string") {
            data = JSON.stringify(data);
        }
        channel.transport.send(data);
    }

    this.transport.onmessage = function(message)
    {
        var data = message.data;
        if (typeof data === "string") {
            data = JSON.parse(data);
        }
        switch (data.type) {
            case QWebChannelMessageTypes.signal:
                channel.handleSignal(data);
                break;
            case QWebChannelMessageTypes.response:
                channel.handleResponse(data);
                break;
            case QWebChannelMessageTypes.propertyUpdate:
                channel.handlePropertyUpdate(data);
                break;
            case QWebChannelMessageTypes.init:
                channel.handleInit(data);
                break;
            default:
                console.error("invalid message received:", message.data);
                break;
        }
    }

    this.execCallbacks = {};
    this.execId = 0;
    this.exec = function(data, callback)
    {
        if (!callback) {
            // if no callback is given, send directly
            channel.send(data);
            return;
        }
        if (channel.execId === Number.MAX_VALUE) {
            // wrap
            channel.execId = Number.MIN_VALUE;
        }
        if (data.hasOwnProperty("id")) {
            console.error("Cannot exec message with property id: " + JSON.stringify(data));
            return;
        }
        data.id = channel.execId++;
        channel.execCallbacks[data.id] = callback;
        channel.send(data);
    };

    this.objects = {};

    this.handleSignal = function(message)
    {
        var object = channel.objects[message.object];
        if (object) {
            object.$signalEmitted(message.signal, message.args);
        } else {
            console.warn("Unhandled signal: " + message.object + "::" + message.signal);
        }
    }

    this.handleResponse = function(message)
    {
        if (!message.hasOwnProperty("id")) {
            console.error("Invalid response message received: ", JSON.stringify(message));
            return;
        }
        channel.execCallbacks[message.id](message.data);
        delete channel.execCallbacks[message.id];
    }

    this.handlePropertyUpdate = function(message)
    {
        for (var i in message.data) {
            var data = message.data[i];
            var object = channel.objects[data.object];
            if (object) {
                object.$propertyUpdate(data.signals, data.properties);
            } else {
                console.warn("Unhandled property update: " + data.object + "::" + data.signal);
            }
        }
        channel.exec({type: QWebChannelMessageTypes.idle});
    }

    // prevent multiple initialization which might happen with multiple webchannel clients.
    this.initialized = false;
    this.handleInit = function(message)
    {
        if (channel.initialized) {
            return;
        }
        channel.initialized = true;
        for (var objectName in message.data) {
            var data = message.data[objectName];
            createQObject(objectName, data, channel);
        }
        if (initCallback) {
            initCallback(channel);
        }
        channel.exec({type: QWebChannelMessageTypes.idle});
    }

    this.debug = function(message)
    {
        channel.send({type: QWebChannelMessageTypes.debug, data: message});
    };

    channel.exec({type: QWebChannelMessageTypes.init});
};

function createQObject(name, data, webChannel)
{
    var object = new QObject(null);

    object.__id__ = name;
    webChannel.objects[name] = object;
    var propertyNames = [];
    var propertyIndexes = {};
    var signalConnections = [];
    var signalNames = [];

    // ----------------------------------------------------------------------

    function unwrapQObject( response )
    {
        if (!response
            || !response["__QObject*__"]
            || response["id"] === undefined
            || response["data"] === undefined) {
            return response;
        }
        var objectId = response.id;
        if (webChannel.objects[objectId])
            return webChannel.objects[objectId];

        var qObject = createQObject( objectId, response.data, webChannel );
        qObject.destroyed.connect(function() {
            if (webChannel.objects[objectId] === qObject) {
                delete webChannel.objects[objectId];
                // reset the now deleted QObject to an empty {} object
                // just assigning {} though would not have the desired effect, but the
                // below also ensures all external references will see the empty map
                // NOTE: this detour is necessary to workaround QTBUG-40021
                var propertyNames = [];
                for (var propertyName in qObject) {
                    propertyNames.push(propertyName);
                }
                for (var idx in propertyNames) {
                    delete qObject[propertyNames[idx]];
                }
            }
        });
        return qObject;
    }

    function addSignal(signalData, isPropertyNotifySignal)
    {
        var signalName = signalData[0];
        var signalIndex = signalData[1];
        object[signalName] = QMLSignal([], // passing params is only needed for "onSignal" handlers, which can't be used here anyway.
                                       { // arbitrary data, we will get back, in obj.$connectNotify
                                           obj: object,
                                           isPropertyNotifySignal: isPropertyNotifySignal,
                                           signalIndex: signalIndex,
                                           signalName: signalName
                                       });
        signalNames[signalIndex] = signalName;
    }

    object.$connectNotify = function(signalData) {
        if (signalData.isPropertyNotifySignal === undefined)
            return;
        if (!signalData.isPropertyNotifySignal && signalData.signalName !== "destroyed") {
            // only required for "pure" signals, handled separately for properties in propertyUpdate
            // also note that we always get notified about the destroyed signal
            webChannel.exec({
                type: QWebChannelMessageTypes.connectToSignal,
                object: object.__id__,
                signal: signalData.signalIndex
            });
            signalConnections[signalData.signalIndex]++;
        }
    }
    object.$disconnectNotify = function(signalData) {
        if (!signalData.isPropertyNotifySignal) {
            // only required for "pure" signals, handled separately for properties in propertyUpdate
            signalConnections[signalData.signalIndex]--;
            if (signalConnections[signalData.signalIndex] === 0) {
                webChannel.exec({
                    type: QWebChannelMessageTypes.disconnectFromSignal,
                    object: object.__id__,
                    signal: signalIndex
                });
            }
        }
    }

    object.$propertyUpdate = function(signals, propertyMap)
    {
        // update property cache
        for (var propertyIndex in propertyMap) {
            var propertyName = propertyNames[propertyIndex];
            var propertyValue = propertyMap[propertyIndex];
            object.$properties[propertyName].val = propertyValue;
            object.$properties[propertyName].changed();
        }
    }

    object.$signalEmitted = function(signalIndex, signalArgs)
    {
        object[signalNames[signalIndex]].apply(object, signalArgs);
    }

    function addMethod(methodData)
    {
        var methodName = methodData[0];
        var methodIdx = methodData[1];
        object[methodName] = function() {
            var args = [];
            var callback;
            for (var i = 0; i < arguments.length; ++i) {
                if (typeof arguments[i] === "function")
                    callback = arguments[i];
                else
                    args.push(arguments[i]);
            }

            webChannel.exec({
                "type": QWebChannelMessageTypes.invokeMethod,
                "object": object.__id__,
                "method": methodIdx,
                "args": args
            }, function(response) {
                if (response !== undefined) {
                    var result = unwrapQObject(response);
                    if (callback) {
                        (callback)(result);
                    }
                }
            });
        };
    }

    function bindGetterSetter(propertyInfo)
    {
        var propertyIndex = propertyInfo[0];
        var propertyName = propertyInfo[1];
        var notifySignalData = propertyInfo[2];

        QObject.createSimpleProperty("var", object, propertyName);
        if (notifySignalData && notifySignalData[0] !== 1 && notifySignalData[0] !== propertyName + "Changed") {
            delete object[propertyName + "Changed"];
            object[notifySignalData[0]] = object.$properties[propertyName].changed;
        }
        object.$properties[propertyName].val = propertyInfo[3];
        propertyNames[propertyIndex] = propertyName;
        propertyIndexes[propertyName] = propertyIndex;
    }

    object.$syncPropertyToRemote = function(propertyName, value) {
        if (value === undefined) {
            console.warn("Property setter for " + propertyName + " called with undefined value!");
            return;
        }
        webChannel.exec({
            "type": QWebChannelMessageTypes.setProperty,
            "object": object.__id__,
            "property": propertyIndexes[propertyName],
            "value": value
        });
    }

    // ----------------------------------------------------------------------

    data.methods.forEach(addMethod);

    data.properties.forEach(bindGetterSetter);

    data.signals.forEach(function(signal) { addSignal(signal, false); });

    for (var name in data.enums) {
        object[name] = data.enums[name];
    }
}

})()
