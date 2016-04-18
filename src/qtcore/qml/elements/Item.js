function QMLItem(meta) {
    QMLBaseObject.call(this, meta);
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
    this.dom.qml = this;
    this.css = this.dom.style;

    this.css.boxSizing = 'border-box';

    createProperty({ type: "list", object: this, name: "data" });
    this.$defaultProperty = "data";
    createProperty({ type: "list", object: this, name: "children" });
    createProperty({ type: "list", object: this, name: "resources" });
    createProperty({ type: "Item", object: this, name: "parent" });
    this.children = [];
    this.resources = [];
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
      createProperty({ type: "var", object: this, name: "activeFocus" });
    createProperty({ type: "real", object: this, name: "x", initialValue: 0 });
    createProperty({ type: "real", object: this, name: "y", initialValue: 0 });
    createProperty({ type: "real", object: this, name: "width" });
    createProperty({ type: "real", object: this, name: "height" });
    createProperty({ type: "real", object: this, name: "implicitWidth", initialValue: 0 });
    createProperty({ type: "real", object: this, name: "implicitHeight", initialValue: 0 });
    createProperty({ type: "real", object: this, name: "left" });
    createProperty({ type: "real", object: this, name: "right" });
    createProperty({ type: "real", object: this, name: "top" });
    createProperty({ type: "real", object: this, name: "bottom" });
    createProperty({ type: "real", object: this, name: "horizontalCenter" });
    createProperty({ type: "real", object: this, name: "verticalCenter" });
    createProperty({ type: "real", object: this, name: "rotation", initialValue: 0 });
    createProperty({ type: "real", object: this, name: "scale", initialValue: 1 });
    createProperty({ type: "real", object: this, name: "z" });
    createProperty({ type: "list", object: this, name: "transform", initialValue: [] });
    createProperty({ type: "bool", object: this, name: "visible", initialValue: true });
    createProperty({ type: "real", object: this, name: "opacity", initialValue: 1 });
    createProperty({ type: "bool", object: this, name: "clip" });
    createProperty({ type: "bool", object: this, name: "focus", initialValue: false });
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
        document.qmlFocus = qmlEngine.rootContext().base;
        this.$context.activeFocus = null;
      }
    }).bind(this));

    this.$isUsingImplicitWidth = true;
    this.$isUsingImplicitHeight = true;

    this.anchors = new QObject(this);
    createProperty({ type: "real", object: this.anchors, name: "left" });
    createProperty({ type: "real", object: this.anchors, name: "right" });
    createProperty({ type: "real", object: this.anchors, name: "top" });
    createProperty({ type: "real", object: this.anchors, name: "bottom" });
    createProperty({ type: "real", object: this.anchors, name: "horizontalCenter" });
    createProperty({ type: "real", object: this.anchors, name: "verticalCenter" });
    createProperty({ type: "real", object: this.anchors, name: "fill" });
    createProperty({ type: "real", object: this.anchors, name: "centerIn" });
    createProperty({ type: "real", object: this.anchors, name: "margins", initialValue: 0 });
    createProperty({ type: "real", object: this.anchors, name: "leftMargin" });
    createProperty({ type: "real", object: this.anchors, name: "rightMargin" });
    createProperty({ type: "real", object: this.anchors, name: "topMargin" });
    createProperty({ type: "real", object: this.anchors, name: "bottomMargin" });
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
    createProperty({ type: "real", object: this.childrenRect, name: "x", initialValue: 0 }); // TODO ro
    createProperty({ type: "real", object: this.childrenRect, name: "y", initialValue: 0 }); // TODO ro
    createProperty({ type: "real", object: this.childrenRect, name: "width", initialValue: 0 }); // TODO ro
    createProperty({ type: "real", object: this.childrenRect, name: "height", initialValue: 0 }); // TODO ro

    createProperty({ type: "list", object: this, name: "states", initialValue: [] });
    createProperty({ type: "string", object: this, name: "state", initialValue: "" });
    createProperty({ type: "list", object: this, name: "transitions", initialValue: [] });
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
    this.opacityChanged.connect(this, function(newVal) {
        this.css.opacity = newVal;
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

    this.spacing = 0;
    this.$revertActions = [];
    this.xChanged(0);
    this.yChanged(0);

    // Init size of root element
    if (this.$parent === null) {
        if (engine.rootElement == undefined) {
            window.onresize = function() {
                self.implicitHeight = window.innerHeight;
                self.implicitWidth = window.innerWidth;
            }
            window.onresize();
        } else {
            this.implicitHeight = this.dom.offsetHeight;
            this.implicitWidth = this.dom.offsetWidth;
        }
    }
}
inherit(QMLItem, QMLBaseObject);

constructors['Item'] = QMLItem;
