registerQmlType({
  module: "QtQml",
  name: "Connections",
  versions: /.*/,
  baseClass: "QtObject",
  properties: {
    target: "QtObject",
    ignoreUnknownSignals: "bool"
  }
}, class {
  constructor(meta) {
    callSuper(this, meta);
    this.target = this.$parent
    this.$connections = {}

    let old_target = this.target;
    const reconnectTarget = () => {
      for (var i in this.$connections) {
        var c = this.$connections[i];
        if (c._currentConnection && old_target && old_target[i] && typeof old_target[i].disconnect === 'function') {
          old_target[i].disconnect(c._currentConnection);
        }
        c._currentConnection = connectSignal(this.target, i, c.value, c.objectScope, c.componentScope);
      }
      old_target = this.target;
    };

    this.targetChanged.connect(reconnectTarget);
    this.Component.completed.connect(reconnectTarget);
  }
  $setCustomSlot(propName, value, objectScope, componentScope) {
    this.$connections[propName] = { value, objectScope, componentScope };
  }
});
