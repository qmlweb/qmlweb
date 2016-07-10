// Base object for all qml elements

class QMLBaseObject extends QObject {
  constructor(meta) {
    super(meta.parent);

    var i,
        prop;

    this.$isComponentRoot = meta.isComponentRoot;
    this.$context = meta.context;

    // Component get own properties
    var attributes = [];
    for (var key in meta.object) {
      if (meta.object.hasOwnProperty(key) &&
          typeof meta.object[key] != 'undefined' && meta.object[key] != null &&
          (meta.object[key].__proto__.constructor.name == 'QMLPropertyDefinition' ||
           meta.object[key].__proto__.constructor.name == 'QMLAliasDefinition')) {
        attributes.push(key);
      }
    }

    this.Keys = new QObject(this);
    this.Keys.asteriskPresed = Signal.signal();
    this.Keys.backPressed = Signal.signal();
    this.Keys.backtabPressed = Signal.signal();
    this.Keys.callPressed = Signal.signal();
    this.Keys.cancelPressed = Signal.signal();
    this.Keys.deletePressed = Signal.signal();
    for (var i = 0 ; i < 10 ; ++i)
      this.Keys['digit'+i+'Pressed'] = Signal.signal();
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

    this.getAttributes = function() { return (attributes); }
  }
}

registerQmlType({
    module: 'QtQml',
    name: 'QtObject',
    versions: /.*/,
    constructor: QMLBaseObject
});
