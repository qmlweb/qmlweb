// eslint-disable-next-line no-undef
class QtQml_Connections extends QtQml_QtObject {
  static properties = {
    target: "QtObject",
    ignoreUnknownSignals: "bool"
  };

  constructor(meta) {
    super(meta);
    this.target = this.$parent;
    this.$connections = {};

    this.$old_target = this.target;
    this.targetChanged.connect(this, this.$onTargetChanged);
    this.Component.completed.connect(this, this.Component$onCompleted);
  }
  $onTargetChanged() {
    this.$reconnectTarget();
  }
  Component$onCompleted() {
    this.$reconnectTarget();
  }
  $reconnectTarget() {
    const old_target = this.$old_target;
    for (const i in this.$connections) {
      const c = this.$connections[i];
      if (c._currentConnection && old_target && old_target[i] &&
          typeof old_target[i].disconnect === "function") {
        old_target[i].disconnect(c._currentConnection);
      }
      if (this.target) {
        c._currentConnection = QmlWeb.connectSignal(this.target, i, c.value,
          c.objectScope, c.componentScope);
      }
    }
    this.$old_target = this.target;
  }
  $setCustomSlot(propName, value, objectScope, componentScope) {
    this.$connections[propName] = { value, objectScope, componentScope };
  }
}
