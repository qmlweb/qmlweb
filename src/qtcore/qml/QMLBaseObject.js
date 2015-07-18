/**
 *
 * Base of all QML objects
 *
 */

function QMLBaseObject(meta) {
    QObject.call(this, meta.parent);
    var i,
        prop;

    if (!this.$draw)
        this.$draw = noop;

    if (!this.$isComponentRoot)
        this.$isComponentRoot = meta.isComponentRoot;
    this.$context = meta.context;

    this.Component = new QObject(this);
    this.Component.completed = Signal([]);
    engine.completedSignals.push(this.Component.completed);
    this.completed = this.Component.completed;

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
    this.Keys.asteriskPresed = Signal();
    this.Keys.backPressed = Signal();
    this.Keys.backtabPressed = Signal();
    this.Keys.callPressed = Signal();
    this.Keys.cancelPressed = Signal();
    this.Keys.deletePressed = Signal();
    for (i = 0; i < 10; ++i)
        this.Keys['digit' + i + 'Pressed'] = Signal();
    this.Keys.escapePressed = Signal();
    this.Keys.flipPressed = Signal();
    this.Keys.hangupPressed = Signal();
    this.Keys.leftPressed = Signal();
    this.Keys.menuPressed = Signal();
    this.Keys.noPressed = Signal();
    this.Keys.pressed = Signal();
    this.Keys.released = Signal();
    this.Keys.returnPressed = Signal();
    this.Keys.rightPressed = Signal();
    this.Keys.selectPressed = Signal();
    this.Keys.spacePressed = Signal();
    this.Keys.tabPressed = Signal();
    this.Keys.upPressed = Signal();
    this.Keys.volumeDownPressed = Signal();
    this.Keys.volumeUpPressed = Signal();
    this.Keys.yesPressed = Signal();

    this.getAttributes = function () {
        return (attributes);
    }
}
