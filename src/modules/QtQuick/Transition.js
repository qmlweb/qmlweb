// eslint-disable-next-line no-undef
class QtQuick_Transition extends QtQml_QtObject {
  static properties = {
    animations: "list",
    from: { type: "string", initialValue: "*" },
    to: { type: "string", initialValue: "*" },
    reversible: "bool",
    running: "bool"
  };
  static defaultProperty = "animations";

  constructor(meta) {
    super(meta);
    this.$item = this.$parent;
    this.animationsChanged.connect(this, this.$updateAnimations);
  }
  $updateAnimations() {
    const flags = QmlWeb.Signal.UniqueConnection;
    for (let i = 0; i < this.animations.length; i++) {
      const animation = this.animations[i];
      animation.runningChanged.connect(this, this.$updateRunning, flags);
      if (animation.target === this || !animation.target) {
        animation.$properties.target.set(this.$parent,
          QmlWeb.QMLProperty.ReasonInit);
      }
    }
  }
  $updateRunning() {
    let running = false;
    for (let i = 0; i < this.animations.length; i++) {
      if (this.animations[i].running) {
        running = true;
        break;
      }
    }
    if (this.running !== running) this.running = running;
  }
  $start(actions) {
    for (let i = 0; i < this.animations.length; i++) {
      const animation = this.animations[i];
      animation.$actions = [];
      const { $targets, $props, $actions } = animation;
      for (const j in actions) {
        const action = actions[j];
        if (($targets.length === 0 || $targets.indexOf(action.target) !== -1) &&
            ($props.length === 0 || $props.indexOf(action.property) !== -1)) {
          $actions.push(action);
        }
      }
      animation.start();
    }
  }
  $stop() {
    for (let i = 0; i < this.animations.length; i++) {
      this.animations[i].stop();
    }
  }
}
