// WARNING: Can have wrong behavior if url is changed while the socket is in Connecting state.
// TODO: Recheck everything.

registerQmlType({
  module:   'QtWebSockets',
  name:     'WebSocket',
  versions: /.*/,
  baseClass: 'QtQml.QtObject',
  constructor: function QMLWebSocket(meta) {
    callSuper(this, meta);

    // Exports.
    this.WebSocket = {
        // status
        Connecting: 0,
        Open: 1,
        Closing: 2,
        Closed: 3,
        Error: 4
    }

    createProperty("bool", this, "active");
    createProperty("enum", this, "status");
    createProperty("string", this, "errorString");
    createProperty("url", this, "url");

    this.textMessageReceived = Signal([{type: "string", name: "message"}]);

    this.status = this.WebSocket.Closed;

    var self = this,
        socket,
        reconnect = false;

    this.sendTextMessage = function(message) {
        if (this.status == this.WebSocket.Open)
            socket.send(message);
    }

    function connectSocket() {
        reconnect = false;

        if (!self.url || !self.active)
            return;

        self.status = self.WebSocket.Connecting;
        socket = new WebSocket(self.url);
        socket.onopen = function() {
            self.status = self.WebSocket.Open;
        }
        socket.onclose = function() {
            self.status = self.WebSocket.Closed;
            if (reconnect)
                connectSocket();
        }
        socket.onerror = function(error) {
            self.errorString = error.message;
            self.status = self.WebSocket.Error;
        }
        socket.onmessage = function(message) {
            self.textMessageReceived(message.data);
        }
    };

    function reconnectSocket() {
        reconnect = true;
        if (self.status == self.WebSocket.Open) {
            self.status = self.WebSocket.Closing;
            socket.close()
        } else if (self.status != self.WebSocket.Closing) {
            connectSocket();
        }
    };

    this.statusChanged.connect(this, function(status) {
        if (status != self.WebSocket.Error)
            self.errorString = "";
    });
    this.activeChanged.connect(this, reconnectSocket);
    this.urlChanged.connect(this, reconnectSocket);
  }
});
