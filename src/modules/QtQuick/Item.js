function QMLItem(meta) {
    callSuper(this, meta);
    var child,
        o, i;

    if (this.$parent === null) { // This is the root element. Initialize it.
        this.dom = engine.rootElement || document.body;
        this.dom.innerHTML = "";
        var self = this;
        this.dom.style.position = "relative"; // Needed to make absolute positioning work
        this.dom.style.top = "0";
        this.dom.style.left = "0";
        this.dom.style.overflow = "hidden"; // No QML stuff should stand out the root element
    } else {
        if (!this.dom) // Create a dom element for this item.
            this.dom = document.createElement("div");
        this.dom.style.position = "absolute";
    }
    this.dom.style.pointerEvents = "none";
    this.dom.className = meta.object.$class + (this.id ? " " + this.id : "");
    this.css = this.dom.style;
    this.impl = null; // Store the actually drawn element

    this.css.boxSizing = 'border-box';

    this.parentChanged.connect(this, function(newParent, oldParent) {
        if (oldParent) {
            oldParent.children.splice(oldParent.children.indexOf(this), 1);
            oldParent.childrenChanged();
            oldParent.dom.removeChild(this.dom);
        }
        if (newParent && newParent.children.indexOf(this) == -1) {
            newParent.children.push(this);
            newParent.childrenChanged();
        }
        if (newParent)
            newParent.dom.appendChild(this.dom);
    });
    this.parentChanged.connect(this, updateHGeometry);
    this.parentChanged.connect(this, updateVGeometry);
    this.dataChanged.connect(this, function(newData) {
        for (var i in newData) {
            var child = newData[i];
            if (child.hasOwnProperty("parent")) // Seems to be an Item. TODO: Use real inheritance and ask using instanceof.
                child.parent = this; // This will also add it to children.
            else
                this.resources.push(child);
        }
    });

    if (this.$isComponentRoot)
      createProperty("var", this, "activeFocus");

    this.xChanged.connect(this, updateHGeometry);
    this.yChanged.connect(this, updateVGeometry);
    this.widthChanged.connect(this, updateHGeometry);
    this.heightChanged.connect(this, updateVGeometry);
    this.implicitWidthChanged.connect(this, updateHGeometry);
    this.implicitHeightChanged.connect(this, updateVGeometry);

    this.setupFocusOnDom = (function(element) {
      var updateFocus = (function() {
        var hasFocus = document.activeElement == this.dom || document.activeElement == this.dom.firstChild;

        if (this.focus != hasFocus)
          this.focus = hasFocus;
      }).bind(this);
      element.addEventListener("focus", updateFocus);
      element.addEventListener("blur",  updateFocus);
    }).bind(this);

    this.focusChanged.connect(this, (function(newVal) {
      if (newVal == true) {
        if (this.dom.firstChild != null)
          this.dom.firstChild.focus();
        document.qmlFocus = this;
        this.$context.activeFocus = this;
      } else if (document.qmlFocus == this) {
        document.getElementsByTagName("BODY")[0].focus();
        document.qmlFocus = engine.rootContext().base;
        this.$context.activeFocus = null;
      }
    }).bind(this));

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
    this.anchors.leftChanged.connect(this, updateHGeometry);
    this.anchors.rightChanged.connect(this, updateHGeometry);
    this.anchors.topChanged.connect(this, updateVGeometry);
    this.anchors.bottomChanged.connect(this, updateVGeometry);
    this.anchors.horizontalCenterChanged.connect(this, updateHGeometry);
    this.anchors.verticalCenterChanged.connect(this, updateVGeometry);
    this.anchors.fillChanged.connect(this, updateHGeometry);
    this.anchors.fillChanged.connect(this, updateVGeometry);
    this.anchors.centerInChanged.connect(this, updateHGeometry);
    this.anchors.centerInChanged.connect(this, updateVGeometry);
    this.anchors.leftMarginChanged.connect(this, updateHGeometry);
    this.anchors.rightMarginChanged.connect(this, updateHGeometry);
    this.anchors.topMarginChanged.connect(this, updateVGeometry);
    this.anchors.bottomMarginChanged.connect(this, updateVGeometry);
    this.anchors.marginsChanged.connect(this, updateHGeometry);
    this.anchors.marginsChanged.connect(this, updateVGeometry);

    // childrenRect property
    this.childrenRect = new QObject(this);
    createProperty("real", this.childrenRect, "x"); // TODO ro
    createProperty("real", this.childrenRect, "y"); // TODO ro
    createProperty("real", this.childrenRect, "width"); // TODO ro
    createProperty("real", this.childrenRect, "height"); // TODO ro

    this.stateChanged.connect(this, function(newVal, oldVal) {
        var oldState, newState, i, j, k;
        for (i = 0; i < this.states.length; i++)
            if (this.states[i].name === newVal)
                newState = this.states[i];
            else if (this.states[i].name === oldVal)
                oldState = this.states[i];

        var actions = this.$revertActions.slice();

        // Get current values for revert actions
        for (i in actions) {
            var action  = actions[i];
            action.from = action.target[action.property];
        }
        if (newState) {
            var changes = newState.$getAllChanges();

            // Get all actions we need to do and create actions to revert them
            for (i = 0; i < changes.length; i++) {
                var change = changes[i];

                for (j = 0; j < change.$actions.length; j++) {
                    var item = change.$actions[j];

                    var action = {
                        target: change.target,
                        property: item.property,
                        origValue: change.target.$properties[item.property].binding
                                    || change.target.$properties[item.property].val,
                        value: item.value,
                        from: change.target[item.property],
                        to: undefined,
                        explicit: change.explicit
                    };
                    var found = false;
                    for (k in actions)
                        if (actions[k].target == action.target
                            && actions[k].property == action.property) {
                            found = true;
                            actions[k] = action;
                            break;
                        }
                    if (!found)
                        actions.push(action);

                    // Look for existing revert action, else create it
                    var found = false;
                    for (k = 0; k < this.$revertActions.length; k++)
                        if (this.$revertActions[k].target == change.target
                            && this.$revertActions[k].property == item.property) {
                            if (!change.restoreEntryValues)
                                this.$revertActions.splice(k, 1); // We don't want to revert, so remove it
                            found = true;
                            break;
                        }
                    if (!found && change.restoreEntryValues)
                        this.$revertActions.push({
                            target: change.target,
                            property: item.property,
                            value: change.target.$properties[item.property].binding
                                        || change.target.$properties[item.property].val,
                            from: undefined,
                            to: change.target[item.property]
                        });
                }
            }
        }

        // Set all property changes and fetch the actual values afterwards
        // The latter is needed for transitions. We need to set all properties
        // before we fetch the values because properties can be interdependent.
        for (i in actions) {
            var action = actions[i];
            action.target.$properties[action.property].set(action.value, QMLProperty.ReasonUser, action.target,
                                                           newState ? newState.$context: action.target.$context);
        }
        for (i in actions) {
            var action = actions[i];
            action.to = action.target[action.property];
            if (action.explicit) {
                action.target[action.property] = action.target[action.property]; //Remove binding
                action.value = action.target[action.property];
            }
        }

        // Find the best transition to use
        var transition,
            rating = 0;
        for (var i = 0; i < this.transitions.length; i++) {
            this.transitions[i].$stop(); // We need to stop running transitions, so let's do
                                        // it while iterating through the transitions anyway
            var curTransition = this.transitions[i],
                curRating = 0;
            if (curTransition.from == oldVal || curTransition.reversible && curTransition.from == newVal)
                curRating += 2;
            else if (curTransition.from == "*")
                curRating++;
            else
                continue;
            if (curTransition.to == newVal || curTransition.reversible && curTransition.to == oldVal)
                curRating += 2;
            else if (curTransition.to == "*")
                curRating++;
            else
                continue;
            if (curRating > rating) {
                rating = curRating;
                transition = curTransition;
            }
        }
        if (transition)
            transition.$start(actions);
    });

    var QMLRotation  = getConstructor('QtQuick', '2.0', 'Rotation');
    var QMLScale     = getConstructor('QtQuick', '2.0', 'Scale');
    var QMLTranslate = getConstructor('QtQuick', '2.0', 'Translate');

    this.$updateTransform = function() {
            var transform = "rotate(" + this.rotation + "deg) scale(" + this.scale + ")";
            var filter = "";
            var transformStyle = "preserve-3d";

            for (var i = 0; i < this.transform.length; i++) {
                var t = this.transform[i];
                if (t instanceof QMLRotation)
                    transform += " rotate3d(" + t.axis.x + ", " + t.axis.y + ", " + t.axis.z + ", " + t.angle + "deg)";
                else if (t instanceof QMLScale)
                    transform += " scale(" + t.xScale + ", " + t.yScale + ")";
                else if (t instanceof QMLTranslate)
                    transform += " translate(" + t.x + "px, " + t.y + "px)";
                else if (typeof t.transformType != 'undefined') {
                    if (t.transformType == 'filter')
                      filter += t.operation + '(' + t.parameters + ') ';
                }
                else if (typeof t == 'string')
                    transform += t;
            }
            if (typeof this.z == "number")
              transform += " translate3d(0, 0, " + this.z + "px)";
            this.dom.style.transform = transform;
            this.dom.style.transformStyle = transformStyle;
            this.dom.style.MozTransform = transform;    // Firefox
            this.dom.style.webkitTransform = transform; // Chrome, Safari and Opera
            this.dom.style.webkitTransformStyle = transformStyle;
            this.dom.style.OTransform = transform;      // Opera
            this.dom.style.msTransform = transform;     // IE
            this.dom.style.filter = filter;
            this.dom.style.msFilter = filter;     // IE
            this.dom.style.webkitFilter = filter; // Chrome, Safari and Opera
            this.dom.style.MozFilter = filter;    // Firefox
    }
    this.rotationChanged.connect(this, this.$updateTransform);
    this.scaleChanged.connect(this, this.$updateTransform);
    this.transformChanged.connect(this, this.$updateTransform);
    this.visibleChanged.connect(this, function(newVal) {
        this.css.visibility = newVal ? "inherit" : "hidden";
    });
    this.clipChanged.connect(this, function(newVal) {
        this.css.overflow = newVal ? "hidden" : "visible";
    });
    this.zChanged.connect(this, function(newVal) {
        this.$updateTransform();
    });
    this.xChanged.connect(this, function(newVal) {
        this.css.left = newVal + "px";
    });
    this.yChanged.connect(this, function(newVal) {
        this.css.top = newVal + "px";
    });
    this.widthChanged.connect(this, function(newVal) {
        this.css.width = newVal ? newVal + "px" : "auto";
    });
    this.heightChanged.connect(this, function(newVal) {
        this.css.height = newVal ? newVal + "px" : "auto";
    });

    this.Component.completed.connect(this, this.$calculateOpacity);
    this.opacityChanged.connect(this, this.$calculateOpacity);
    if (this.$parent) {
      this.$parent.$opacityChanged.connect(this, this.$calculateOpacity);
    }

    this.spacing = 0;
    this.$revertActions = [];
    this.css.left = this.x + 'px';
    this.css.top = this.y + 'px';

    // Init size of root element
    if (this.$parent === null) {
        if (engine.rootElement == undefined) {
            // Case 1: Qml scene is placed in body tag

            // event handling by addEventListener is probably better than setting window.onresize
            var updateQmlGeometry = function() {
                self.implicitHeight = window.innerHeight;
                self.implicitWidth = window.innerWidth;
            }
            window.addEventListener( "resize", updateQmlGeometry );
            updateQmlGeometry();
        } else {
            // Case 2: Qml scene is placed in some element tag

            // we have to call `self.implicitHeight =` and `self.implicitWidth =`
            // each time the rootElement changes it's geometry
            // to reposition child elements of qml scene

            // it is good to have this as named method of dom element, so we can call it
            // from outside too, whenever element changes it's geometry (not only on window resize)
            this.dom.updateQmlGeometry = function() {
              self.implicitHeight = self.dom.offsetHeight;
              self.implicitWidth = self.dom.offsetWidth;
            };
            window.addEventListener( "resize", this.dom.updateQmlGeometry );
            this.dom.updateQmlGeometry();
        }
    }
}

QMLItem.prototype.$calculateOpacity = function() {
  // TODO: reset all opacity on layer.enabled changed
  if (false) { // TODO: check layer.enabled
    this.css.opacity = this.opacity;
  }
  const parentOpacity = (this.$parent && this.$parent.$opacity) || 1;
  this.$opacity = this.opacity * parentOpacity;
  if (this.impl) {
    this.impl.style.opacity = this.$opacity;
  }
};

registerQmlType({
  module: 'QtQuick',
  name: 'Item',
  versions: /.*/,
  baseClass: 'QtQml.QtObject',
  properties: {
    $opacity: {type: 'real', initialValue: 1},
    parent: 'Item',
    state: 'string',
    states: 'list',
    transitions: 'list',
    data: 'list',
    children: 'list',
    resources: 'list',
    transform: 'list',
    x: 'real',
    y: 'real',
    z: 'real',
    width: 'real',
    height: 'real',
    implicitWidth: 'real',
    implicitHeight: 'real',
    left: 'real',
    right: 'real',
    top: 'real',
    bottom: 'real',
    horizontalCenter: 'real',
    verticalCenter: 'real',
    rotation: 'real',
    scale: {type: 'real', initialValue: 1},
    opacity: {type: 'real', initialValue: 1},
    visible: {type: 'bool', initialValue: true},
    clip: 'bool',
    focus: 'bool'
  },
  defaultProperty: 'data',
  constructor: QMLItem
});
