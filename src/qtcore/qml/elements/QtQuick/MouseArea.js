registerQmlType({
    module: 'QtQuick',
    name: 'MouseArea',
    versions: /.*/,
    constructor: function QMLMouseArea(meta) {
        QMLItem.call(this, meta);
        var self = this;

        this.dom.style.pointerEvents = "all";

        // IE does not handle mouse clicks to transparent divs, so we have
        // to set a background color and make it invisible using opacity
        // as that doesn't affect the mouse handling.
        this.dom.style.backgroundColor = "white";
        this.dom.style.opacity = 0;

        createSimpleProperty("variant", this, "acceptedButtons");
        createSimpleProperty("bool", this, "enabled");
        createSimpleProperty("bool", this, "hoverEnabled");
        createSimpleProperty("real", this, "mouseX");
        createSimpleProperty("real", this, "mouseY");
        createSimpleProperty("bool", this, "pressed");
        createSimpleProperty("bool", this, "containsMouse");
        this.clicked = Signal([{
            type: "variant",
            name: "mouse"
        }]);
        this.entered = Signal();
        this.exited = Signal();
        this.positionChanged = Signal([{
            type: "variant",
            name: "mouse"
        }]);

        this.acceptedButtons = Qt.LeftButton;
        this.enabled = true;
        this.hoverEnabled = false;
        this.containsMouse = false;

        function eventToMouse(e) {
            return {
                accepted: true,
                button: e.button == 0 ? Qt.LeftButton : e.button == 1 ? Qt.MiddleButton : e.button == 2 ? Qt.RightButton : 0,
                modifiers: (e.ctrlKey * Qt.CtrlModifier) | (e.altKey * Qt.AltModifier) | (e.shiftKey * Qt.ShiftModifier) | (e.metaKey * Qt.MetaModifier),
                x: (e.offsetX || e.layerX),
                y: (e.offsetY || e.layerY)
            };
        }

        function handleClick(e) {
            var mouse = eventToMouse(e);

            if (self.enabled && self.acceptedButtons & mouse.button) {
                self.clicked(mouse);
            }
            // This decides whether to show the browser's context menu on right click or not
            return !(self.acceptedButtons & Qt.RightButton);
        }
        this.dom.onclick = handleClick;
        this.dom.oncontextmenu = handleClick;
        this.dom.onmousedown = function (e) {
            if (self.enabled) {
                var mouse = eventToMouse(e);
                self.mouseX = mouse.x;
                self.mouseY = mouse.y;
                self.pressed = true;
            }
        }
        this.dom.onmouseup = function (e) {
            self.pressed = false;
        }
        this.dom.onmouseover = function (e) {
            self.containsMouse = true;
            self.entered();
        }
        this.dom.onmouseout = function (e) {
            self.containsMouse = false;
            self.exited();
        }
        this.dom.onmousemove = function (e) {
            if (self.enabled && (self.hoverEnabled || self.pressed)) {
                var mouse = eventToMouse(e);
                self.positionChanged(mouse);
                self.mouseX = mouse.x;
                self.mouseY = mouse.y;
            }
        }
    }
});
