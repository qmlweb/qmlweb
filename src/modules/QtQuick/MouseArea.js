// eslint-disable-next-line no-undef
class QtQuick_MouseArea extends QtQuick_Item {
  static properties = {
    acceptedButtons: { type: "variant", initialValue: 1 }, // Qt.LeftButton
    enabled: { type: "bool", initialValue: true },
    hoverEnabled: "bool",
    mouseX: "real",
    mouseY: "real",
    pressed: "bool",
    containsMouse: "bool",
    containsPress: "bool",
    pressedButtons: { type: "variant", initialValue: 0 },
    cursorShape: "enum" // Qt.ArrowCursor
  };
  static signals = {
    canceled: [],
    clicked: [{ type: "variant", name: "mouse" }],
    doubleClicked: [{ type: "variant", name: "mouse" }],
    entered: [],
    exited: [],
    positionChanged: [{ type: "variant", name: "mouse" }],
    pressAndHold: [{ type: "variant", name: "mouse" }],
    pressed: [{ type: "variant", name: "mouse" }],
    released: [{ type: "variant", name: "mouse" }],
    wheel: [{ type: "variant", name: "wheel" }]
  };

  constructor(meta) {
    super(meta);

    this.dom.style.pointerEvents = "all";

    // IE does not handle mouse clicks to transparent divs, so we have
    // to set a background color and make it invisible using opacity
    // as that doesn't affect the mouse handling.
    this.dom.style.backgroundColor = "white";
    this.dom.style.opacity = 0;

    this.cursorShapeChanged.connect(this, this.$onCursorShapeChanged);

    this.dom.addEventListener("click", e => this.$handleClick(e));
    this.dom.addEventListener("contextmenu", e => this.$handleClick(e));
    const handleMouseMove = e => {
      if (!this.enabled || !this.hoverEnabled && !this.pressed) return;
      this.$handlePositionChanged(e);
    };
    const handleMouseUp = e => {
      const mouse = this.$eventToMouse(e);
      this.pressed = false;
      this.containsPress = false;
      this.pressedButtons = 0;
      this.released(mouse);
      document.removeEventListener("mouseup", handleMouseUp);
      this.$clientTransform = undefined;
      document.removeEventListener("mousemove", handleMouseMove);
    };
    this.dom.addEventListener("mousedown", e => {
      if (!this.enabled) return;
      // Handle scale and translate transformations
      const boundingRect = this.dom.getBoundingClientRect();
      this.$clientTransform = {
        x: boundingRect.left,
        y: boundingRect.top,
        xScale: this.width ?
          (boundingRect.right - boundingRect.left) / this.width : 1,
        yScale: this.height ?
          (boundingRect.bottom - boundingRect.top) / this.height : 1
      };
      const mouse = this.$eventToMouse(e);
      this.mouseX = mouse.x;
      this.mouseY = mouse.y;
      this.pressed = true;
      this.containsPress = true;
      this.pressedButtons = mouse.button;
      this.$Signals.pressed(mouse);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("mousemove", handleMouseMove);
    });
    this.dom.addEventListener("mouseover", () => {
      this.containsMouse = true;
      this.containsPress = this.pressed;
      this.entered();
    });
    this.dom.addEventListener("mouseout", () => {
      this.containsMouse = false;
      this.containsPress = false;
      this.exited();
    });
    // This is to emit positionChanged for `hoverEnabled` only. When `pressed`,
    // `positionChanged` is handled by a temporary `mousemove` event listener
    // on `document`.
    this.dom.addEventListener("mousemove", e => {
      if (!this.enabled || !this.hoverEnabled || this.pressed) return;
      this.$handlePositionChanged(e);
    });
    this.dom.addEventListener("wheel", e => {
      this.$handleWheel(e);
    });
  }
  $onCursorShapeChanged() {
    this.dom.style.cursor = this.$cursorShapeToCSS();
  }
  $handlePositionChanged(e) {
    const mouse = this.$eventToMouse(e);
    this.mouseX = mouse.x;
    this.mouseY = mouse.y;
    this.positionChanged(mouse);
  }
  $handleWheel(e) {
    const wheel = this.$eventToMouse(e);
    wheel.angleDelta = { x: e.deltaX, y: e.deltaY };
    wheel.accepted = false;

    this.wheel(wheel);

    if (wheel.accepted) {
      e.stopPropagation();
      e.preventDefault();
    }
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
    const mouse = {
      accepted: true,
      button: e.button === 0 ? Qt.LeftButton :
              e.button === 1 ? Qt.MiddleButton :
              e.button === 2 ? Qt.RightButton :
              0,
      modifiers: e.ctrlKey * Qt.CtrlModifier
               | e.altKey * Qt.AltModifier
               | e.shiftKey * Qt.ShiftModifier
               | e.metaKey * Qt.MetaModifier
    };
    if (this.$clientTransform) {
      // Handle scale and translate transformations
      mouse.x = (e.clientX - this.$clientTransform.x)
        / this.$clientTransform.xScale;
      mouse.y = (e.clientY - this.$clientTransform.y)
        / this.$clientTransform.yScale;
    } else {
      mouse.x = e.offsetX || e.layerX;
      mouse.y = e.offsetY || e.layerY;
    }
    return mouse;
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
}
