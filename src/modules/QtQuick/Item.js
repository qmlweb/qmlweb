registerQmlType({
  module: "QtQuick",
  name: "Item",
  versions: /.*/,
  baseClass: "QtQml.QtObject",
  properties: {
    $opacity: { type: "real", initialValue: 1 },
    parent: "Item",
    state: "string",
    states: "list",
    transitions: "list",
    data: "list",
    children: "list",
    resources: "list",
    transform: "list",
    x: "real",
    y: "real",
    z: "real",
    width: "real",
    height: "real",
    implicitWidth: "real",
    implicitHeight: "real",
    left: "real",
    right: "real",
    top: "real",
    bottom: "real",
    horizontalCenter: "real",
    verticalCenter: "real",
    rotation: "real",
    scale: { type: "real", initialValue: 1 },
    opacity: { type: "real", initialValue: 1 },
    visible: { type: "bool", initialValue: true },
    clip: "bool",
    focus: "bool"
  },
  defaultProperty: "data"
}, class {
  constructor(meta) {
    callSuper(this, meta);

    if (this.$parent === null) { // This is the root element. Initialize it.
      this.dom = engine.rootElement || document.body;
      this.dom.innerHTML = "";
      // Needed to make absolute positioning work
      this.dom.style.position = "relative";
      this.dom.style.top = "0";
      this.dom.style.left = "0";
      // No QML stuff should stand out the root element
      this.dom.style.overflow = "hidden";
    } else {
      if (!this.dom) { // Create a dom element for this item.
        this.dom = document.createElement("div");
      }
      this.dom.style.position = "absolute";
    }
    this.dom.style.pointerEvents = "none";
    this.dom.className = `${meta.object.$class}${this.id ? ` ${this.id}` : ""}`;
    this.css = this.dom.style;
    this.impl = null; // Store the actually drawn element

    this.css.boxSizing = "border-box";

    if (this.$isComponentRoot) {
      createProperty("var", this, "activeFocus");
    }

    this.parentChanged.connect(this, this.$onParentChanged_);
    this.dataChanged.connect(this, this.$onDataChanged);
    this.stateChanged.connect(this, this.$onStateChanged);
    this.visibleChanged.connect(this, this.$onVisibleChanged_);
    this.clipChanged.connect(this, this.$onClipChanged);
    this.zChanged.connect(this, this.$onZChanged);
    this.xChanged.connect(this, this.$onXChanged);
    this.yChanged.connect(this, this.$onYChanged);
    this.widthChanged.connect(this, this.$onWidthChanged);
    this.heightChanged.connect(this, this.$onHeightChanged);
    this.focusChanged.connect(this, this.$onFocusChanged_);

    this.widthChanged.connect(this, this.$updateHGeometry);
    this.heightChanged.connect(this, this.$updateVGeometry);
    this.implicitWidthChanged.connect(this, this.$onImplicitWidthChanged);
    this.implicitHeightChanged.connect(this, this.$onImplicitHeightChanged);

    this.$isUsingImplicitWidth = true;
    this.$isUsingImplicitHeight = true;

    this.anchors = new QObject(this);
    createProperty("var", this.anchors, "left");
    createProperty("var", this.anchors, "right");
    createProperty("var", this.anchors, "top");
    createProperty("var", this.anchors, "bottom");
    createProperty("var", this.anchors, "horizontalCenter");
    createProperty("var", this.anchors, "verticalCenter");
    createProperty("Item", this.anchors, "fill");
    createProperty("Item", this.anchors, "centerIn");
    createProperty("real", this.anchors, "margins");
    createProperty("real", this.anchors, "leftMargin");
    createProperty("real", this.anchors, "rightMargin");
    createProperty("real", this.anchors, "topMargin");
    createProperty("real", this.anchors, "bottomMargin");
    this.anchors.leftChanged.connect(this, this.$updateHGeometry);
    this.anchors.rightChanged.connect(this, this.$updateHGeometry);
    this.anchors.topChanged.connect(this, this.$updateVGeometry);
    this.anchors.bottomChanged.connect(this, this.$updateVGeometry);
    this.anchors.horizontalCenterChanged.connect(this, this.$updateHGeometry);
    this.anchors.verticalCenterChanged.connect(this, this.$updateVGeometry);
    this.anchors.fillChanged.connect(this, this.$updateHGeometry);
    this.anchors.fillChanged.connect(this, this.$updateVGeometry);
    this.anchors.centerInChanged.connect(this, this.$updateHGeometry);
    this.anchors.centerInChanged.connect(this, this.$updateVGeometry);
    this.anchors.leftMarginChanged.connect(this, this.$updateHGeometry);
    this.anchors.rightMarginChanged.connect(this, this.$updateHGeometry);
    this.anchors.topMarginChanged.connect(this, this.$updateVGeometry);
    this.anchors.bottomMarginChanged.connect(this, this.$updateVGeometry);
    this.anchors.marginsChanged.connect(this, this.$updateHGeometry);
    this.anchors.marginsChanged.connect(this, this.$updateVGeometry);

    // childrenRect property
    this.childrenRect = new QObject(this);
    createProperty("real", this.childrenRect, "x"); // TODO ro
    createProperty("real", this.childrenRect, "y"); // TODO ro
    createProperty("real", this.childrenRect, "width"); // TODO ro
    createProperty("real", this.childrenRect, "height"); // TODO ro

    this.rotationChanged.connect(this, this.$updateTransform);
    this.scaleChanged.connect(this, this.$updateTransform);
    this.transformChanged.connect(this, this.$updateTransform);

    this.Component.completed.connect(this, this.Component$onCompleted_);
    this.opacityChanged.connect(this, this.$calculateOpacity);
    if (this.$parent) {
      this.$parent.$opacityChanged.connect(this, this.$calculateOpacity);
    }

    this.spacing = 0;
    this.$revertActions = [];
    this.css.left = `${this.x}px`;
    this.css.top = `${this.y}px`;

    // Init size of root element
    if (this.$parent === null) {
      if (!engine.rootElement) {
        // Case 1: Qml scene is placed in body tag

        // event handling by addEventListener is probably better than setting
        // window.onresize
        const updateQmlGeometry = () => {
          this.implicitHeight = window.innerHeight;
          this.implicitWidth = window.innerWidth;
        };
        window.addEventListener("resize", updateQmlGeometry);
        updateQmlGeometry();
      } else {
        // Case 2: Qml scene is placed in some element tag

        // we have to call `this.implicitHeight =` and `this.implicitWidth =`
        // each time the rootElement changes it's geometry
        // to reposition child elements of qml scene

        // it is good to have this as named method of dom element, so we can
        // call it from outside too, whenever element changes it's geometry
        // (not only on window resize)
        this.dom.updateQmlGeometry = () => {
          this.implicitHeight = this.dom.offsetHeight;
          this.implicitWidth = this.dom.offsetWidth;
        };
        window.addEventListener("resize", this.dom.updateQmlGeometry);
        this.dom.updateQmlGeometry();
      }
    }
  }
  $onParentChanged_(newParent, oldParent, propName) {
    if (oldParent) {
      oldParent.children.splice(oldParent.children.indexOf(this), 1);
      oldParent.childrenChanged();
      oldParent.dom.removeChild(this.dom);
    }
    if (newParent && newParent.children.indexOf(this) === -1) {
      newParent.children.push(this);
      newParent.childrenChanged();
    }
    if (newParent) {
      newParent.dom.appendChild(this.dom);
    }
    this.$updateHGeometry(newParent, oldParent, propName);
    this.$updateVGeometry(newParent, oldParent, propName);
  }
  $onDataChanged(newData) {
    for (const i in newData) {
      const child = newData[i];
      if (child.hasOwnProperty("parent")) {
        // Seems to be an Item.
        // TODO: Use real inheritance and ask using instanceof.
        child.parent = this; // This will also add it to children.
      } else {
        this.resources.push(child);
      }
    }
  }
  $onStateChanged(newVal, oldVal) {
    let oldState;
    let newState;
    for (let i = 0; i < this.states.length; i++) {
      if (this.states[i].name === newVal) {
        newState = this.states[i];
      } else if (this.states[i].name === oldVal) {
        oldState = this.states[i];
      }
    }

    const actions = this.$revertActions.slice();

    // Get current values for revert actions
    for (const i in actions) {
      const action = actions[i];
      action.from = action.target[action.property];
    }
    if (newState) {
      const changes = newState.$getAllChanges();

      // Get all actions we need to do and create actions to revert them
      for (let i = 0; i < changes.length; i++) {
        const change = changes[i];

        for (let j = 0; j < change.$actions.length; j++) {
          const item = change.$actions[j];

          const action = {
            target: change.target,
            property: item.property,
            origValue: change.target.$properties[item.property].binding ||
                       change.target.$properties[item.property].val,
            value: item.value,
            from: change.target[item.property],
            to: undefined,
            explicit: change.explicit
          };
          let found = false;
          for (const k in actions) {
            if (actions[k].target === action.target &&
                actions[k].property === action.property) {
              found = true;
              actions[k] = action;
              break;
            }
          }
          if (!found) {
            actions.push(action);
          }

          // Look for existing revert action, else create it
          found = false;
          for (let k = 0; k < this.$revertActions.length; k++) {
            if (this.$revertActions[k].target === change.target &&
                this.$revertActions[k].property === item.property) {
              if (!change.restoreEntryValues) {
                // We don't want to revert, so remove it
                this.$revertActions.splice(k, 1);
              }
              found = true;
              break;
            }
          }
          if (!found && change.restoreEntryValues) {
            this.$revertActions.push({
              target: change.target,
              property: item.property,
              value: change.target.$properties[item.property].binding ||
                     change.target.$properties[item.property].val,
              from: undefined,
              to: change.target[item.property]
            });
          }
        }
      }
    }

    // Set all property changes and fetch the actual values afterwards
    // The latter is needed for transitions. We need to set all properties
    // before we fetch the values because properties can be interdependent.
    for (const i in actions) {
      const action = actions[i];
      action.target.$properties[action.property].set(
        action.value, QMLProperty.ReasonUser, action.target,
        newState ? newState.$context: action.target.$context
      );
    }
    for (const i in actions) {
      const action = actions[i];
      action.to = action.target[action.property];
      if (action.explicit) {
        // Remove binding
        action.target[action.property] = action.target[action.property];
        action.value = action.target[action.property];
      }
    }

    // Find the best transition to use
    let transition;
    let rating = 0;
    for (let i = 0; i < this.transitions.length; i++) {
      // We need to stop running transitions, so let's do
      // it while iterating through the transitions anyway
      this.transitions[i].$stop();
      const curTransition = this.transitions[i];
      let curRating = 0;
      if (curTransition.from === oldVal ||
          curTransition.reversible && curTransition.from === newVal) {
        curRating += 2;
      } else if (curTransition.from === "*") {
        curRating++;
      } else {
        continue;
      }
      if (curTransition.to === newVal ||
        curTransition.reversible && curTransition.to === oldVal) {
        curRating += 2;
      } else if (curTransition.to === "*") {
        curRating++;
      } else {
        continue;
      }
      if (curRating > rating) {
        rating = curRating;
        transition = curTransition;
      }
    }
    if (transition) {
      transition.$start(actions);
    }
  }
  $onVisibleChanged_(newVal) {
    this.css.visibility = newVal ? "inherit" : "hidden";
  }
  $onClipChanged(newVal) {
    this.css.overflow = newVal ? "hidden" : "visible";
  }
  $onZChanged(newVal) {
    this.$updateTransform();
  }
  $onXChanged(newVal) {
    this.css.left = `${newVal}px`;
    this.$updateHGeometry();
  }
  $onYChanged(newVal) {
    this.css.top = `${newVal}px`;
    this.$updateVGeometry();
  }
  $onWidthChanged(newVal) {
    this.css.width = newVal ? `${newVal}px` : "auto";
  }
  $onHeightChanged(newVal) {
    this.css.height = newVal ? `${newVal}px` : "auto";
  }
  $onFocusChanged(newVal) {
    if (newVal) {
      if (this.dom.firstChild) {
        this.dom.firstChild.focus();
      }
      document.qmlFocus = this;
      this.$context.activeFocus = this;
    } else if (document.qmlFocus === this) {
      document.getElementsByTagName("BODY")[0].focus();
      document.qmlFocus = engine.rootContext().base;
      this.$context.activeFocus = null;
    }
  }
  setupFocusOnDom(element) {
    const updateFocus = () => {
      const hasFocus = document.activeElement === this.dom ||
                       document.activeElement === this.dom.firstChild;
      if (this.focus !== hasFocus) {
        this.focus = hasFocus;
      }
    };
    element.addEventListener("focus", updateFocus);
    element.addEventListener("blur", updateFocus);
  }
  $updateTransform() {
    const QMLTranslate = getConstructor("QtQuick", "2.0", "Translate");
    const QMLRotation = getConstructor("QtQuick", "2.0", "Rotation");
    const QMLScale = getConstructor("QtQuick", "2.0", "Scale");
    let transform = `rotate(${this.rotation}deg) scale(${this.scale})`;
    let filter = "";
    const transformStyle = "preserve-3d";

    for (let i = 0; i < this.transform.length; i++) {
      const t = this.transform[i];
      if (t instanceof QMLRotation) {
        const ax = t.axis;
        transform += ` rotate3d(${ax.x}, ${ax.y}, ${ax.z}, ${ax.angle}deg)`;
      } else if (t instanceof QMLScale) {
        transform += ` scale(${t.xScale}, ${t.yScale})`;
      } else if (t instanceof QMLTranslate) {
        transform += ` translate(${t.x}px, ${t.y}px)`;
      } else if (typeof t.transformType !== "undefined") {
        if (t.transformType === "filter") {
          filter += `${t.operation}(${t.parameters}) `;
        }
      } else if (typeof t === "string") {
        transform += t;
      }
    }
    if (typeof this.z === "number") {
      transform += ` translate3d(0, 0, ${this.z}px)`;
    }
    this.dom.style.transform = transform;
    this.dom.style.transformStyle = transformStyle;
    this.dom.style.webkitTransform = transform; // Chrome, Safari and Opera
    this.dom.style.webkitTransformStyle = transformStyle;
    this.dom.style.msTransform = transform;     // IE
    this.dom.style.filter = filter;
    this.dom.style.webkitFilter = filter; // Chrome, Safari and Opera
  }
  Component$onCompleted_() {
    this.$calculateOpacity();
  }
  $calculateOpacity() {
    // TODO: reset all opacity on layer.enabled changed
    /*
    if (false) { // TODO: check layer.enabled
      this.css.opacity = this.opacity;
    }
    */
    const parentOpacity = this.$parent && this.$parent.$opacity || 1;
    this.$opacity = this.opacity * parentOpacity;
    if (this.impl) {
      this.impl.style.opacity = this.$opacity;
    }
  }
  $onImplicitWidthChanged() {
    if (this.$isUsingImplicitWidth) {
      this.width = this.implicitWidth;
      this.$isUsingImplicitWidth = true;
    }
  }
  $onImplicitHeightChanged() {
    if (this.$isUsingImplicitHeight) {
      this.height = this.implicitHeight;
      this.$isUsingImplicitHeight = true;
    }
  }
  $updateHGeometry(newVal, oldVal, propName) {
    const anchors = this.anchors || this;
    if (this.$updatingHGeometry) {
      return;
    }
    this.$updatingHGeometry = true;

    const lM = anchors.leftMargin || anchors.margins;
    const rM = anchors.rightMargin || anchors.margins;

    // Width
    if (propName === "width") {
      this.$isUsingImplicitWidth = false;
    }

    // Position TODO: Layouts
    let t;
    let w;
    let width;
    let x;
    let left;
    let right;
    let hC;
    if ((t = anchors.fill) !== undefined) {
      const props = t.$properties;
      if (!props.left.changed.isConnected(this, this.$updateHGeometry)) {
        props.left.changed.connect(this, this.$updateHGeometry);
      }
      if (!props.right.changed.isConnected(this, this.$updateHGeometry)) {
        props.right.changed.connect(this, this.$updateHGeometry);
      }
      if (!props.width.changed.isConnected(this, this.$updateHGeometry)) {
        props.width.changed.connect(this, this.$updateHGeometry);
      }

      this.$isUsingImplicitWidth = false;
      width = t.width - lM - rM;
      x = t.left - (this.parent ? this.parent.left : 0) + lM;
      left = t.left + lM;
      right = t.right - rM;
      hC = (left + right) / 2;
    } else if ((t = anchors.centerIn) !== undefined) {
      const horizontalCenter = t.$properties.horizontalCenter;
      if (!horizontalCenter.changed.isConnected(this, this.$updateHGeometry)) {
        horizontalCenter.changed.connect(this, this.$updateHGeometry);
      }

      w = width || this.width;
      hC = t.horizontalCenter;
      x = hC - w / 2 - (this.parent ? this.parent.left : 0);
      left = hC - w / 2;
      right = hC + w / 2;
    } else if ((t = anchors.left) !== undefined) {
      left = t + lM;
      if ((u = anchors.right) !== undefined) {
        right = u - rM;
        this.$isUsingImplicitWidth = false;
        width = right - left;
        x = left - (this.parent ? this.parent.left : 0);
        hC = (right + left) / 2;
      } else if ((hC = anchors.horizontalCenter) !== undefined) {
        this.$isUsingImplicitWidth = false;
        width = (hC - left) * 2;
        x = left - (this.parent ? this.parent.left : 0);
        right = 2 * hC - left;
      } else {
        w = width || this.width;
        x = left - (this.parent ? this.parent.left : 0);
        right = left + w;
        hC = left + w / 2;
      }
    } else if ((t = anchors.right) !== undefined) {
      right = t - rM;
      if ((hC = anchors.horizontalCenter) !== undefined) {
        this.$isUsingImplicitWidth = false;
        width = (right - hC) * 2;
        x = 2 * hC - right - (this.parent ? this.parent.left : 0);
        left = 2 * hC - right;
      } else {
        w = width || this.width;
        x = right - w - (this.parent ? this.parent.left : 0);
        left = right - w;
        hC = right - w / 2;
      }
    } else if ((hC = anchors.horizontalCenter) !== undefined) {
      w = width || this.width;
      x = hC - w / 2 - (this.parent ? this.parent.left : 0);
      left = hC - w / 2;
      right = hC + w / 2;
    } else {
      if (this.parent) {
        const leftProp = this.parent.$properties.left;
        if (!leftProp.changed.isConnected(this, this.$updateHGeometry)) {
          leftProp.changed.connect(this, this.$updateHGeometry);
        }
      }

      w = width || this.width;
      left = this.x + (this.parent ? this.parent.left : 0);
      right = left + w;
      hC = left + w / 2;
    }

    if (left !== undefined) {
      this.left = left;
    }
    if (hC !== undefined) {
      this.horizontalCenter = hC;
    }
    if (right !== undefined) {
      this.right = right;
    }
    if (x !== undefined) {
      this.x = x;
    }
    if (width !== undefined) {
      this.width = width;
    }

    this.$updatingHGeometry = false;

    if (this.parent) this.$updateChildrenRect(this.parent);
  }
  $updateVGeometry(newVal, oldVal, propName) {
    const anchors = this.anchors || this;
    if (this.$updatingVGeometry) {
      return;
    }
    this.$updatingVGeometry = true;

    const tM = anchors.topMargin || anchors.margins;
    const bM = anchors.bottomMargin || anchors.margins;

    // HeighttopProp
    if (propName === "height") {
      this.$isUsingImplicitHeight = false;
    }

    // Position TODO: Layouts
    let t;
    let w;
    let height;
    let y;
    let top;
    let bottom;
    let vC;
    if ((t = anchors.fill) !== undefined) {
      const props = t.$properties;
      if (!props.top.changed.isConnected(this, this.$updateVGeometry)) {
        props.top.changed.connect(this, this.$updateVGeometry);
      }
      if (!props.bottom.changed.isConnected(this, this.$updateVGeometry)) {
        props.bottom.changed.connect(this, this.$updateVGeometry);
      }
      if (!props.height.changed.isConnected(this, this.$updateVGeometry)) {
        props.height.changed.connect(this, this.$updateVGeometry);
      }

      this.$isUsingImplicitHeight = false;
      height = t.height - tM - bM;
      y = t.top - (this.parent ? this.parent.top : 0) + tM;
      top = t.top + tM;
      bottom = t.bottom - bM;
      vC = (top + bottom) / 2;
    } else if ((t = anchors.centerIn) !== undefined) {
      const verticalCenter = t.$properties.verticalCenter;
      if (!verticalCenter.changed.isConnected(this, this.$updateVGeometry)) {
        verticalCenter.changed.connect(this, this.$updateVGeometry);
      }

      w = height || this.height;
      vC = t.verticalCenter;
      y = vC - w / 2 - (this.parent ? this.parent.top : 0);
      top = vC - w / 2;
      bottom = vC + w / 2;
    } else if ((t = anchors.top) !== undefined) {
      top = t + tM;
      if ((u = anchors.bottom) !== undefined) {
        bottom = u - bM;
        this.$isUsingImplicitHeight = false;
        height = bottom - top;
        y = top - (this.parent ? this.parent.top : 0);
        vC = (bottom + top) / 2;
      } else if ((vC = anchors.verticalCenter) !== undefined) {
        this.$isUsingImplicitHeight = false;
        height = (vC - top) * 2;
        y = top - (this.parent ? this.parent.top : 0);
        bottom = 2 * vC - top;
      } else {
        w = height || this.height;
        y = top - (this.parent ? this.parent.top : 0);
        bottom = top + w;
        vC = top + w / 2;
      }
    } else if ((t = anchors.bottom) !== undefined) {
      bottom = t - bM;
      if ((vC = anchors.verticalCenter) !== undefined) {
        this.$isUsingImplicitHeight = false;
        height = (bottom - vC) * 2;
        y = 2 * vC - bottom - (this.parent ? this.parent.top : 0);
        top = 2 * vC - bottom;
      } else {
        w = height || this.height;
        y = bottom - w - (this.parent ? this.parent.top : 0);
        top = bottom - w;
        vC = bottom - w / 2;
      }
    } else if ((vC = anchors.verticalCenter) !== undefined) {
      w = height || this.height;
      y = vC - w / 2 - (this.parent ? this.parent.top : 0);
      top = vC - w / 2;
      bottom = vC + w / 2;
    } else {
      if (this.parent) {
        const topProp = this.parent.$properties.top;
        if (!topProp.changed.isConnected(this, this.$updateVGeometry)) {
          topProp.changed.connect(this, this.$updateVGeometry);
        }
      }

      w = height || this.height;
      top = this.y + (this.parent ? this.parent.top : 0);
      bottom = top + w;
      vC = top + w / 2;
    }

    if (top !== undefined) {
      this.top = top;
    }
    if (vC !== undefined) {
      this.verticalCenter = vC;
    }
    if (bottom !== undefined) {
      this.bottom = bottom;
    }
    if (y !== undefined) {
      this.y = y;
    }
    if (height !== undefined) {
      this.height = height;
    }

    this.$updatingVGeometry = false;

    if (this.parent) this.$updateChildrenRect(this.parent);
  }
  $updateChildrenRect(component) {
    const children = component !== undefined ? component.children : undefined;
    if (!children || children.length === 0) {
      return;
    }

    let maxWidth = 0;
    let maxHeight = 0;
    let minX = children.length > 0 ? children[0].x : 0;
    let minY = children.length > 0 ? children[0].y : 0;

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      maxWidth = Math.max(maxWidth, child.x + child.width);
      maxHeight = Math.max(maxHeight, child.y + child.heighth);
      minX = Math.min(minX, child.x);
      minY = Math.min(minX, child.y);
    }

    component.childrenRect.x = minX;
    component.childrenRect.y = minY;
    component.childrenRect.width = maxWidth;
    component.childrenRect.height = maxHeight;
  }
});
