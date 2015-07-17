/**
 *
 * Create QML engine
 * Only one engine can be running at a time
 *
 * useful functions of the engine are
 *
 *  +   loadFile
 *  +   start
 *  +   stop
 *
 */

var engine = null;

/**
 * @param   element HTMLCanvasElement
 * @param   options used for debugging
 */
QMLEngine = function (element, options) {
    this.fps = 60;
    this.$interval = Math.floor(1000 / this.fps);
    this.running = false;
    this.rootElement = element;
    this.operationState = 1;

    this.mouseAreas = [];
    this.oldMousePos = {
        x: 0,
        y: 0
    };

    this.components = {};
    this.completedSignals = [];
    this.bindedProperties = [];

    this.start = function () {
        engine = this;
        var i;
        if (this.operationState !== QMLOperationState.Running) {
            this.operationState = QMLOperationState.Running;
            tickerId = setInterval(tick, this.$interval);
            for (i = 0; i < whenStart.length; i++) {
                whenStart[i]();
            }
        }
    }

    this.stop = function () {
        var i;
        if (this.operationState == QMLOperationState.Running) {
            element.removeEventListener("touchstart", touchHandler);
            element.removeEventListener("mousemove", mousemoveHandler);
            clearInterval(tickerId);
            this.operationState = QMLOperationState.Idle;
            for (i = 0; i < whenStop.length; i++) {
                whenStop[i]();
            }
        }
    }

    this.pathFromFilepath = function (file) {
        var basePath = file.split("/");
        basePath[basePath.length - 1] = "";
        basePath = basePath.join("/");
        return basePath;
    }

    this.ensureFileIsLoadedInQrc = function (file) {
        if (!qrc.includesFile(file)) {
            var src = getUrlContents(file);

            console.log('loading file', file);
            qrc[file] = qmlparse(src);
        }
    }

    this.loadFile = function (file) {
        var tree;

        basePath = this.pathFromFilepath(file);
        this.basePath = basePath;
        this.ensureFileIsLoadedInQrc(file);
        tree = convertToEngine(qrc[file]);
        this.loadQMLTree(tree);
    }

    this.loadQML = function (src) {
        this.loadQMLTree(parseQML(src));
    }

    this.loadQMLTree = function (tree) {
        engine = this;
        if (options.debugTree) {
            options.debugTree(tree);
        }
        var component = new QMLComponent({
            object: tree,
            parent: null
        });
        doc = component.createObject(null);
        component.finalizeImports();
        this.$initializePropertyBindings();

        this.start();

        for (var i in this.completedSignals) {
            this.completedSignals[i]();
        }
    }

    this.rootContext = function () {
        return doc.$context;
    }

    this.focusedElement = (function () {
        return this.rootContext().activeFocus;
    }).bind(this);

    var keyboardSignals = {};
    keyboardSignals[Qt.Key_Asterisk] = 'asteriskPressed';
    keyboardSignals[Qt.Key_Back] = 'backPressed';
    keyboardSignals[Qt.Key_Backtab] = 'backtabPressed';
    keyboardSignals[Qt.Key_Call] = 'callPressed';
    keyboardSignals[Qt.Key_Cancel] = 'cancelPressed';
    keyboardSignals[Qt.Key_Delete] = 'deletePressed';
    keyboardSignals[Qt.Key_0] = 'digit0Pressed';
    keyboardSignals[Qt.Key_1] = 'digit1Pressed';
    keyboardSignals[Qt.Key_2] = 'digit2Pressed';
    keyboardSignals[Qt.Key_3] = 'digit3Pressed';
    keyboardSignals[Qt.Key_4] = 'digit4Pressed';
    keyboardSignals[Qt.Key_5] = 'digit5Pressed';
    keyboardSignals[Qt.Key_6] = 'digit6Pressed';
    keyboardSignals[Qt.Key_7] = 'digit7Pressed';
    keyboardSignals[Qt.Key_8] = 'digit8Pressed';
    keyboardSignals[Qt.Key_9] = 'digit9Pressed';
    keyboardSignals[Qt.Key_Escape] = 'escapePressed';
    keyboardSignals[Qt.Key_Flip] = 'flipPressed';
    keyboardSignals[Qt.Key_Hangup] = 'hangupPressed';
    keyboardSignals[Qt.Key_Menu] = 'menuPressed';
    keyboardSignals[Qt.Key_No] = 'noPressed';
    keyboardSignals[Qt.Key_Return] = 'returnPressed';
    keyboardSignals[Qt.Key_Select] = 'selectPressed';
    keyboardSignals[Qt.Key_Space] = 'spacePressed';
    keyboardSignals[Qt.Key_Tab] = 'tabPressed';
    keyboardSignals[Qt.Key_VolumeDown] = 'volumeDownPressed';
    keyboardSignals[Qt.Key_VolumeUp] = 'volumeUpPressed';
    keyboardSignals[Qt.Key_Yes] = 'yesPressed';
    keyboardSignals[Qt.Key_Up] = 'upPressed';
    keyboardSignals[Qt.Key_Right] = 'rightPressed';
    keyboardSignals[Qt.Key_Down] = 'downPressed';
    keyboardSignals[Qt.Key_Left] = 'leftPressed';

    function keyCodeToQt(e) {
        if (e.keyCode >= 96 && e.keyCode <= 111) {
            e.keypad = true;
        }
        if (e.keyCode == Qt.Key_Tab && e.shiftKey == true)
            return Qt.Key_Backtab;
        else if (e.keyCode >= 97 && e.keyCode <= 122)
            return e.keyCode - (97 - Qt.Key_A);
        return e.keyCode;
    }

    function eventToKeyboard(e) {
        return {
            accepted: false,
            count: 1,
            isAutoRepeat: false,
            key: keyCodeToQt(e),
            modifiers: (e.ctrlKey * Qt.CtrlModifier) | (e.altKey * Qt.AltModifier) | (e.shiftKey * Qt.ShiftModifier) | (e.metaKey * Qt.MetaModifier) | (e.keypad * Qt.KeypadModifier),
            text: String.fromCharCode(e.charCode)
        };
    }

    document.onkeypress = (function (e) {
        var focusedElement = this.focusedElement();
        var event = eventToKeyboard(e || window.event);
        var eventName = keyboardSignals[event.key];

        while (event.accepted != true && focusedElement != null) {
            var backup = focusedElement.$context.event;

            focusedElement.$context.event = event;
            focusedElement.Keys.pressed(event);
            if (eventName != null)
                focusedElement.Keys[eventName](event);
            focusedElement.$context.event = backup;
            if (event.accepted == true)
                e.preventDefault();
            else
                focusedElement = focusedElement.$parent;
        }
    }).bind(this);

    document.onkeyup = (function (e) {
        var focusedElement = this.focusedElement();
        var event = eventToKeyboard(e || window.event);

        while (event.accepted != true && focusedElement != null) {
            var backup = focusedElement.$context.event;

            focusedElement.$context.event = event;
            focusedElement.Keys.released(event);
            focusedElement.$context.event = backup;
            if (event.accepted == true)
                e.preventDefault();
            else
                focusedElement = focusedElement.$parent;
        }
    }).bind(this);

    this.registerProperty = function (obj, propName) {
        var dependantProperties = [];
        var value = obj[propName];

        function getter() {
            if (evaluatingProperty && dependantProperties.indexOf(evaluatingProperty) == -1)
                dependantProperties.push(evaluatingProperty);

            return value;
        }

        function setter(newVal) {
            value = newVal;

            for (i in dependantProperties)
                dependantProperties[i].update();
        }

        setupGetterSetter(obj, propName, getter, setter);
    }

    this.loadComponent = function (name) {
        if (name in this.components)
            return this.components[name];

        var file = basePath + name + ".qml";

        this.ensureFileIsLoadedInQrc(file);
        tree = convertToEngine(qrc[file]);
        this.components[name] = tree;
        return tree;
    }

    this.$initializePropertyBindings = function () {
        for (var i = 0; i < this.bindedProperties.length; i++) {
            var property = this.bindedProperties[i];
            property.binding.compile();
            property.update();
        }
        this.bindedProperties = [];
    }

    this.$getTextMetrics = function (text, fontCss) {
        canvas.save();
        canvas.font = fontCss;
        var metrics = canvas.measureText(text);
        canvas.restore();
        return metrics;
    }

    this.$resolvePath = function (file) {
        if (file == "" || file.indexOf("://") != -1 || file.indexOf("/") == 0) {
            return file;
        }
        return basePath + file;
    }

    this.$registerStart = function (f) {
        whenStart.push(f);
    }

    this.$registerStop = function (f) {
        whenStop.push(f);
    }

    this.$addTicker = function (t) {
        tickers.push(t);
    }

    this.$removeTicker = function (t) {
        var index = tickers.indexOf(t);
        if (index != -1) {
            tickers.splice(index, 1);
        }
    }

    this.size = function () {
        return {
            width: doc.getWidth(),
            height: doc.getHeight()
        };
    }

    this.$perfDraw = function (canvas) {
        doc.$draw(canvas);
    }

    var self = this;

    function touchHandler(e) {
        e.preventDefault();
        var at = {
            layerX: e.touches[0].pageX - element.offsetLeft,
            layerY: e.touches[0].pageY - element.offsetTop,
            button: 1
        }
        element.onclick(at);

    }

    function mousemoveHandler(e) {
        var i;
        for (i in self.mouseAreas) {
            var l = self.mouseAreas[i];
            if (l && l.hoverEnabled && (self.oldMousePos.x >= l.left && self.oldMousePos.x <= l.right && self.oldMousePos.y >= l.top && self.oldMousePos.y <= l.bottom) && !(e.pageX - element.offsetLeft >= l.left && e.pageX - element.offsetLeft <= l.right && e.pageY - element.offsetTop >= l.top && e.pageY - element.offsetTop <= l.bottom))
                l.exited();
        }
        for (i in self.mouseAreas) {
            var l = self.mouseAreas[i];
            if (l && l.hoverEnabled && (e.pageX - element.offsetLeft >= l.left && e.pageX - element.offsetLeft <= l.right && e.pageY - element.offsetTop >= l.top && e.pageY - element.offsetTop <= l.bottom) && !(self.oldMousePos.x >= l.left && self.oldMousePos.x <= l.right && self.oldMousePos.y >= l.top && self.oldMousePos.y <= l.bottom))
                l.entered();
        }
        self.oldMousePos = {
            x: e.pageX - element.offsetLeft,
            y: e.pageY - element.offsetTop
        };
    }

    function tick() {
        var i,
            now = (new Date).getTime(),
            elapsed = now - lastTick;
        lastTick = now;
        for (i = 0; i < tickers.length; i++) {
            tickers[i](now, elapsed);
        }
    }


    var doc,
        whenStop = [],
        whenStart = [],
        tickerId,
        tickers = [],
        lastTick = new Date().getTime(),
        basePath,
        i;

    options = options || {};

    if (options.debugConsole) {
        console = {};
        console.log = function () {
            var args = Array.prototype.slice.call(arguments);
            options.debugConsole.apply(Undefined, args);
        };
    }
}
