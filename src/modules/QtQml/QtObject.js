// Base object for all qml elements

QmlWeb.registerQmlType({
  module: "QtQml",
  name: "QtObject",
  versions: /.*/,
}, class extends QmlWeb.QObject {
  constructor(meta) {
    super(meta.parent);

    this.$isComponentRoot = meta.isComponentRoot;
    this.$context = meta.context;

    // Component get own properties
    this.$attributes = [];
    for (const key in meta.object) {
      if (!meta.object.hasOwnProperty(key) || !meta.object[key]) {
        continue;
      }
      const name = meta.object[key].__proto__.constructor.name;
      if (name === "QMLPropertyDefinition" || name === "QMLAliasDefinition") {
        this.$attributes.push(key);
      }
    }

    const Signal = QmlWeb.Signal;

    this.Keys = new QmlWeb.QObject(this);
    this.Keys.asteriskPresed = Signal.signal();
    this.Keys.backPressed = Signal.signal();
    this.Keys.backtabPressed = Signal.signal();
    this.Keys.callPressed = Signal.signal();
    this.Keys.cancelPressed = Signal.signal();
    this.Keys.deletePressed = Signal.signal();
    for (let i = 0; i < 10; ++i) {
      this.Keys[`digit${i}Pressed`] = Signal.signal();
    }
    this.Keys.escapePressed = Signal.signal();
    this.Keys.flipPressed = Signal.signal();
    this.Keys.hangupPressed = Signal.signal();
    this.Keys.leftPressed = Signal.signal();
    this.Keys.menuPressed = Signal.signal();
    this.Keys.noPressed = Signal.signal();
    this.Keys.pressed = Signal.signal();
    this.Keys.released = Signal.signal();
    this.Keys.returnPressed = Signal.signal();
    this.Keys.rightPressed = Signal.signal();
    this.Keys.selectPressed = Signal.signal();
    this.Keys.spacePressed = Signal.signal();
    this.Keys.tabPressed = Signal.signal();
    this.Keys.upPressed = Signal.signal();
    this.Keys.volumeDownPressed = Signal.signal();
    this.Keys.volumeUpPressed = Signal.signal();
    this.Keys.yesPressed = Signal.signal();
  }
  getAttributes() {
    return this.$attributes;
  }
});
