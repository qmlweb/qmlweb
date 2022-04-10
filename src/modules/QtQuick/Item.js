// eslint-disable-next-line no-undef
class QtQuick_Item extends QtQml_QtObject {
  static properties = {
    $opacity: { type: "real", initialValue: 1 },
    parent: "Item",
    antialiasing: "bool",
    state: "string",
    states: "list",
    transitions: "list",
    children: "list",
    resources: "list",
    transform: "list",
    x: "real",
    y: "real",
    z: "real",
    width: {
      type: "real", initialValue: null,
      get: QtQuick_Item.prototype.$getWidth
    },
    height: {
      type: "real", initialValue: null,
      get: QtQuick_Item.prototype.$getHeight
    },
    implicitWidth: {
      type: "real",
      set: QtQuick_Item.prototype.$setImplicitWidth
    },
    implicitHeight: {
      type: "real",
      set: QtQuick_Item.prototype.$setImplicitHeight
    },
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
  };

  constructor(meta) {
    super(meta);

    if (!this.dom) { // Create a dom element for this item.
      this.dom = document.createElement(meta.tagName || "div");
    }
    this.dom.style.position = "absolute";
    this.dom.style.pointerEvents = "none";
    if (meta.style) {
      for (const key in meta.style) {
        if (!meta.style.hasOwnProperty(key)) continue;
        this.dom.style[key] = meta.style[key];
      }
    }

    // In case the class is qualified, only use the last part for the css class
    // name.
    const classComponent = meta.object.$class.split(".").pop();
    this.dom.className = `${classComponent}${this.id ? ` ${this.id}` : ""}`;
    this.css = this.dom.style;
    this.impl = null; // Store the actually drawn element

    this.css.boxSizing = "border-box";

    if (this.$isComponentRoot) {
      QmlWeb.createProperty("var", this, "activeFocus");
    }

    this.parentChanged.connect(this, this.$onParentChanged_);
    this.dataChanged.connect(this, this.$onDataChanged);
    this.stateChanged.connect(this, this.$onStateChanged);
    this.visibleChanged.connect(this, this.$onVisibleChanged_);
    this.clipChanged.connect(this, this.$onClipChanged);
    this.zChanged.connect(this, this.$onZChanged);
    this.xChanged.connect(this, this.$onXChanged);
    this.yChanged.connect(this, this.$onYChanged);
    this.widthChanged.connect(this, this.$onWidthChanged_);
    this.heightChanged.connect(this, this.$onHeightChanged_);
    this.focusChanged.connect(this, this.$onFocusChanged_);

    this.widthChanged.connect(this, this.$updateHGeometry);
    this.heightChanged.connect(this, this.$updateVGeometry);

    this.$isUsingImplicitWidth = true;
    this.$isUsingImplicitHeight = true;

    this.anchors = new QmlWeb.QMLAnchors(this);

    // childrenRect property
    this.childrenRect = new QmlWeb.QObject(this);
    QmlWeb.createProperties(this.childrenRect, {
      x: "real", // TODO ro
      y: "real", // TODO ro
      width: "real", // TODO ro
      height: "real" // TODO ro
    });

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
    const QMLItem = QmlWeb.getConstructor("QtQuick", "2.0", "Item");
    for (const i in newData) {
      const child = newData[i];
      if (child instanceof QMLItem) {
        child.parent = this; // This will also add it to children.
      } else {
        this.resources.push(child);
      }
    }
  }
  $onStateChanged(newVal, oldVal) {
    // let oldState; // TODO: do we need oldState?
    let newState;
    for (let i = 0; i < this.states.length; i++) {
      if (this.states[i].name === newVal) {
        newState = this.states[i];
      }
      /*
      else if (this.states[i].name === oldVal) {
        oldState = this.states[i];
      }
      */
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
        this.$applyChange(actions, changes[i]);
      }
    }

    // Set all property changes and fetch the actual values afterwards
    // The latter is needed for transitions. We need to set all properties
    // before we fetch the values because properties can be interdependent.
    for (const i in actions) {
      const action = actions[i];
      action.target.$properties[action.property].set(
        action.value, QmlWeb.QMLProperty.ReasonUser, action.target,
        newState ? newState.$context : action.target.$context
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
  $applyChange(actions, change) {
    const arrayFindIndex = QmlWeb.helpers.arrayFindIndex;
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

      const actionIndex = arrayFindIndex(actions, element =>
        element.target === action.target &&
        element.property === action.property
      );
      if (actionIndex !== -1) {
        actions[actionIndex] = action;
      } else {
        actions.push(action);
      }

      // Look for existing revert action, else create it
      const revertIndex = arrayFindIndex(this.$revertActions, element =>
        element.target === change.target &&
        element.property === item.property
      );
      if (revertIndex !== -1 && !change.restoreEntryValues) {
        // We don't want to revert, so remove it
        this.$revertActions.splice(revertIndex, 1);
      } else if (revertIndex === -1 && change.restoreEntryValues) {
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
  $onVisibleChanged_(newVal) {
    this.css.visibility = newVal ? "inherit" : "hidden";
  }
  $onClipChanged(newVal) {
    this.css.overflow = newVal ? "hidden" : "visible";
  }
  $onZChanged() {
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
  $onWidthChanged_(newVal) {
    this.css.width = newVal ? `${newVal}px` : "auto";
  }
  $onHeightChanged_(newVal) {
    this.css.height = newVal ? `${newVal}px` : "auto";
  }
  $onFocusChanged_(newVal) {
    if (newVal) {
      if (this.dom.firstChild) {
        this.dom.firstChild.focus();
      }
      document.qmlFocus = this;
      this.$context.activeFocus = this;
    } else if (document.qmlFocus === this) {
      document.getElementsByTagName("BODY")[0].focus();
      document.qmlFocus = QmlWeb.engine.rootContext().base;
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
    const QMLTranslate = QmlWeb.getConstructor("QtQuick", "2.0", "Translate");
    const QMLRotation = QmlWeb.getConstructor("QtQuick", "2.0", "Rotation");
    const QMLScale = QmlWeb.getConstructor("QtQuick", "2.0", "Scale");
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
      // should also consider z as zIndex for stacking order behaviour of qml
      // see http://doc.qt.io/qt-5/qml-qtquick-item.html#z-prop
      this.dom.style.zIndex = this.z;
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
  $getWidth() {
    return this.$properties.width.get() || this.implicitWidth;
  }
  $getHeight() {
    return this.$properties.height.get() || this.implicitHeight;
  }
  $setImplicitWidth(newVal) {
    if (newVal !== this.$properties.implicitWidth.get()) {
      this.$properties.implicitWidth.set(newVal);
      if (this.$isUsingImplicitWidth) {
        this.widthChanged();
      }
    }
  }
  $setImplicitHeight(newVal) {
    if (newVal !== this.$properties.implicitHeight.get()) {
      this.$properties.implicitHeight.set(newVal);
      if (this.$isUsingImplicitHeight) {
        this.heightChanged();
      }
    }
  }
  $updateHGeometry(newVal, oldVal, propName) {
    const anchors = this.anchors || this;
    if (this.$updatingHGeometry) {
      return;
    }
    this.$updatingHGeometry = true;

    const flags = QmlWeb.Signal.UniqueConnection;
    const lM = anchors.leftMargin || anchors.margins;
    const rM = anchors.rightMargin || anchors.margins;
    const w = this.width;
    const left = this.parent ? this.parent.left : 0;

    // Width
    if (propName === "width") {
      this.$isUsingImplicitWidth = false;
    }

    // Position TODO: Layouts

    const u = {}; // our update object

    if (anchors.fill !== undefined) {
      const fill = anchors.fill;
      const props = fill.$properties;
      props.left.changed.connect(this, this.$updateHGeometry, flags);
      props.right.changed.connect(this, this.$updateHGeometry, flags);
      props.width.changed.connect(this, this.$updateHGeometry, flags);

      this.$isUsingImplicitWidth = false;
      u.width = fill.width - lM - rM;
      u.x = fill.left - left + lM;
      u.left = fill.left + lM;
      u.right = fill.right - rM;
      u.horizontalCenter = (u.left + u.right) / 2;
    } else if (anchors.centerIn !== undefined) {
      const horizontalCenter = anchors.centerIn.$properties.horizontalCenter;
      horizontalCenter.changed.connect(this, this.$updateHGeometry, flags);

      u.horizontalCenter = anchors.centerIn.horizontalCenter;
      u.x = u.horizontalCenter - w / 2 - left;
      u.left = u.horizontalCenter - w / 2;
      u.right = u.horizontalCenter + w / 2;
    } else if (anchors.left !== undefined) {
      u.left = anchors.left + lM;
      if (anchors.right !== undefined) {
        u.right = anchors.right - rM;
        this.$isUsingImplicitWidth = false;
        u.width = u.right - u.left;
        u.x = u.left - left;
        u.horizontalCenter = (u.right + u.left) / 2;
      } else if (anchors.horizontalCenter !== undefined) {
        u.horizontalCenter = anchors.horizontalCenter;
        this.$isUsingImplicitWidth = false;
        u.width = (u.horizontalCenter - u.left) * 2;
        u.x = u.left - left;
        u.right = 2 * u.horizontalCenter - u.left;
      } else {
        u.x = u.left - left;
        u.right = u.left + w;
        u.horizontalCenter = u.left + w / 2;
      }
    } else if (anchors.right !== undefined) {
      u.right = anchors.right - rM;
      if (anchors.horizontalCenter !== undefined) {
        u.horizontalCenter = anchors.horizontalCenter;
        this.$isUsingImplicitWidth = false;
        u.width = (u.right - u.horizontalCenter) * 2;
        u.x = 2 * u.horizontalCenter - u.right - left;
        u.left = 2 * u.horizontalCenter - u.right;
      } else {
        u.x = u.right - w - left;
        u.left = u.right - w;
        u.horizontalCenter = u.right - w / 2;
      }
    } else if (anchors.horizontalCenter !== undefined) {
      u.horizontalCenter = anchors.horizontalCenter;
      u.x = u.horizontalCenter - w / 2 - left;
      u.left = u.horizontalCenter - w / 2;
      u.right = u.horizontalCenter + w / 2;
    } else {
      if (this.parent) {
        const leftProp = this.parent.$properties.left;
        leftProp.changed.connect(this, this.$updateHGeometry, flags);
      }

      u.left = this.x + left;
      u.right = u.left + w;
      u.horizontalCenter = u.left + w / 2;
    }

    for (const key in u) {
      this[key] = u[key];
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

    const flags = QmlWeb.Signal.UniqueConnection;
    const tM = anchors.topMargin || anchors.margins;
    const bM = anchors.bottomMargin || anchors.margins;
    const h = this.height;
    const top = this.parent ? this.parent.top : 0;

    // HeighttopProp
    if (propName === "height") {
      this.$isUsingImplicitHeight = false;
    }

    // Position TODO: Layouts

    const u = {}; // our update object

    if (anchors.fill !== undefined) {
      const fill = anchors.fill;
      const props = fill.$properties;
      props.top.changed.connect(this, this.$updateVGeometry, flags);
      props.bottom.changed.connect(this, this.$updateVGeometry, flags);
      props.height.changed.connect(this, this.$updateVGeometry, flags);

      this.$isUsingImplicitHeight = false;
      u.height = fill.height - tM - bM;
      u.y = fill.top - top + tM;
      u.top = fill.top + tM;
      u.bottom = fill.bottom - bM;
      u.verticalCenter = (u.top + u.bottom) / 2;
    } else if (anchors.centerIn !== undefined) {
      const verticalCenter = anchors.centerIn.$properties.verticalCenter;
      verticalCenter.changed.connect(this, this.$updateVGeometry, flags);

      u.verticalCenter = anchors.centerIn.verticalCenter;
      u.y = u.verticalCenter - h / 2 - top;
      u.top = u.verticalCenter - h / 2;
      u.bottom = u.verticalCenter + h / 2;
    } else if (anchors.top !== undefined) {
      u.top = anchors.top + tM;
      if (anchors.bottom !== undefined) {
        u.bottom = anchors.bottom - bM;
        this.$isUsingImplicitHeight = false;
        u.height = u.bottom - u.top;
        u.y = u.top - top;
        u.verticalCenter = (u.bottom + u.top) / 2;
      } else if ((u.verticalCenter = anchors.verticalCenter) !== undefined) {
        this.$isUsingImplicitHeight = false;
        u.height = (u.verticalCenter - u.top) * 2;
        u.y = u.top - top;
        u.bottom = 2 * u.verticalCenter - u.top;
      } else {
        u.y = u.top - top;
        u.bottom = u.top + h;
        u.verticalCenter = u.top + h / 2;
      }
    } else if (anchors.bottom !== undefined) {
      u.bottom = anchors.bottom - bM;
      if ((u.verticalCenter = anchors.verticalCenter) !== undefined) {
        this.$isUsingImplicitHeight = false;
        u.height = (u.bottom - u.verticalCenter) * 2;
        u.y = 2 * u.verticalCenter - u.bottom - top;
        u.top = 2 * u.verticalCenter - u.bottom;
      } else {
        u.y = u.bottom - h - top;
        u.top = u.bottom - h;
        u.verticalCenter = u.bottom - h / 2;
      }
    } else if (anchors.verticalCenter !== undefined) {
      u.verticalCenter = anchors.verticalCenter;
      u.y = u.verticalCenter - h / 2 - top;
      u.top = u.verticalCenter - h / 2;
      u.bottom = u.verticalCenter + h / 2;
    } else {
      if (this.parent) {
        const topProp = this.parent.$properties.top;
        topProp.changed.connect(this, this.$updateVGeometry, flags);
      }

      u.top = this.y + top;
      u.bottom = u.top + h;
      u.verticalCenter = u.top + h / 2;
    }

    for (const key in u) {
      this[key] = u[key];
    }

    this.$updatingVGeometry = false;

    if (this.parent) this.$updateChildrenRect(this.parent);
  }
  $updateChildrenRect(component) {
    if (!component || !component.children || component.children.length === 0) {
      return;
    }
    const children = component.children;

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
}
