QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "MouseArea",
  versions: /.*/,
  baseClass: "Item",
  properties: {
    acceptedButtons: { type: "variant", initialValue: 1 }, // Qt.LeftButton
    enabled: { type: "bool", initialValue: true },
    hoverEnabled: "bool",
    mouseX: "real",
    mouseY: "real",
    pressed: "bool",
    containsMouse: "bool",
    pressedButtons: { type: "variant", initialValue: 0 },
    cursorShape: "enum" // Qt.ArrowCursor
  },
  signals: {
    clicked: [{ type: "variant", name: "mouse" }],
    entered: [],
    exited: [],
    positionChanged: [{ type: "variant", name: "mouse" }]
  }
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);

    this.dom.style.pointerEvents = "all";

    // IE does not handle mouse clicks to transparent divs, so we have
    // to set a background color and make it invisible using opacity
    // as that doesn't affect the mouse handling.
    this.dom.style.backgroundColor = "white";
    this.dom.style.opacity = 0;

    this.cursorShapeChanged.connect(this, this.$onCursorShapeChanged);

    this.dom.addEventListener("click", e => this.$handleClick(e));
    this.dom.addEventListener("contextmenu", e => this.$handleClick(e));
    const handleMouseUp = () => {
      this.pressed = false;
      this.pressedButtons = 0;
      document.removeEventListener("mouseup", handleMouseUp);
    };
    this.dom.addEventListener("mousedown", e => {
      if (!this.enabled) return;
      const mouse = this.$eventToMouse(e);
      this.mouseX = mouse.x;
      this.mouseY = mouse.y;
      this.pressed = true;
      this.pressedButtons = mouse.button;
      document.addEventListener("mouseup", handleMouseUp);
    });
    this.dom.addEventListener("mouseover", () => {
      this.containsMouse = true;
      this.entered();
    });
    this.dom.addEventListener("mouseout", () => {
      this.containsMouse = false;
      this.exited();
    });
    this.dom.addEventListener("mousemove", e => {
      if (!this.enabled || !this.hoverEnabled && !this.pressed) return;
      const mouse = this.$eventToMouse(e);
      this.mouseX = mouse.x;
      this.mouseY = mouse.y;
      this.positionChanged(mouse);
    });
  }
  $onCursorShapeChanged() {
    this.dom.style.cursor = this.$cursorShapeToCSS();
  }
  $handleClick(e) {
    const mouse = this.$eventToMouse(e);
    if (this.enabled && this.acceptedButtons & mouse.button) {
      this.clicked(mouse);
    }
    // This decides whether to show the browser's context menu on right click or
    // not
    return !(this.acceptedButtons & QmlWeb.Qt.RightButton);
  }
  $eventToMouse(e) {
    const Qt = QmlWeb.Qt;
    return {
      accepted: true,
      button: e.button === 0 ? Qt.LeftButton :
              e.button === 1 ? Qt.MiddleButton :
              e.button === 2 ? Qt.RightButton :
              0,
      modifiers: e.ctrlKey * Qt.CtrlModifier
               | e.altKey * Qt.AltModifier
               | e.shiftKey * Qt.ShiftModifier
               | e.metaKey * Qt.MetaModifier,
      x: e.offsetX || e.layerX,
      y: e.offsetY || e.layerY
    };
  }

  // eslint-disable-next-line complexity
  $cursorShapeToCSS() {
    const Qt = QmlWeb.Qt;
    switch (this.cursorShape) {
      case Qt.ArrowCursor: return "default";
      case Qt.UpArrowCursor: return "n-resize";
      case Qt.CrossCursor: return "crosshair";
      case Qt.WaitCursor: return "wait";
      case Qt.IBeamCursor: return "text";
      case Qt.SizeVerCursor: return "ew-resize";
      case Qt.SizeHorCursor: return "ns-resize";
      case Qt.SizeBDiagCursor: return "nesw-resize";
      case Qt.SizeFDiagCursor: return "nwse-resize";
      case Qt.SizeAllCursor: return "all-scroll";
      case Qt.BlankCursor: return "none";
      case Qt.SplitVCursor: return "row-resize";
      case Qt.SplitHCursor: return "col-resize";
      case Qt.PointingHandCursor: return "pointer";
      case Qt.ForbiddenCursor: return "not-allowed";
      case Qt.WhatsThisCursor: return "help";
      case Qt.BusyCursor: return "progress";
      case Qt.OpenHandCursor: return "grab";
      case Qt.ClosedHandCursor: return "grabbing";
      case Qt.DragCopyCursor: return "copy";
      case Qt.DragMoveCursor: return "move";
      case Qt.DragLinkCursor: return "alias";
      //case Qt.BitmapCursor: return "auto";
      //case Qt.CustomCursor: return "auto";
    }
    return "auto";
  }
});
