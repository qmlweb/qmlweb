// WARNING: Can have wrong behavior if url is changed while the socket is in
// Connecting state.
// TODO: Recheck everything.

// eslint-disable-next-line no-undef
class QtWebSockets_WebSocket extends QtQml_QtObject {
  static enums = {
    WebSocket: { Connecting: 0, Open: 1, Closing: 2, Closed: 3, Error: 4 }
  };
  static properties = {
    active: "bool",
    status: { type: "enum", initialValue: 3 }, // WebSocket.Closed
    errorString: "string",
    url: "url"
  };
  static signals = {
    textMessageReceived: [{ type: "string", name: "message" }]
  };

  constructor(meta) {
    super(meta);

    this.$socket = undefined;
    this.$reconnect = false;

    this.statusChanged.connect(this, this.$onStatusChanged);
    this.activeChanged.connect(this, this.$reconnectSocket);
    this.urlChanged.connect(this, this.$reconnectSocket);
  }
  $onStatusChanged(status) {
    if (status !== this.WebSocket.Error) {
      this.errorString = "";
    }
  }
  $connectSocket() {
    this.$reconnect = false;

    if (!this.url || !this.active) {
      return;
    }

    this.status = this.WebSocket.Connecting;
    this.$socket = new WebSocket(this.url);
    this.$socket.onopen = () => {
      this.status = this.WebSocket.Open;
    };
    this.$socket.onclose = () => {
      this.status = this.WebSocket.Closed;
      if (this.$reconnect) {
        this.$connectSocket();
      }
    };
    this.$socket.onerror = error => {
      this.errorString = error.message;
      this.status = this.WebSocket.Error;
    };
    this.$socket.onmessage = message => {
      this.textMessageReceived(message.data);
    };
  }
  $reconnectSocket() {
    this.$reconnect = true;
    if (this.status === this.WebSocket.Open) {
      this.status = this.WebSocket.Closing;
      this.$socket.close();
    } else if (this.status !== this.WebSocket.Closing) {
      this.$connectSocket();
    }
  }
  sendTextMessage(message) {
    if (this.status === this.WebSocket.Open) {
      this.$socket.send(message);
    }
  }
  sendBinaryMessage(message) {
    if (this.status === this.WebSocket.Open) {
      this.$socket.send(message);
    }
  }
}
