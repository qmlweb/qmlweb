/**
 *
 * Utility functions used by Text and TextEdit (for now)
 * Defines the following functions
 *
 *  +   fontCss
 *  +   updateCSS
 *  +   objList
 *  +   logCSS
 *  +   descr
 *
 */

/**
 *
 * Create font description string from font object.
 * The created string is used in drawing the item.
 *
 * @param   font    font object
 *
 * @return  font description string
 *
 */
function fontCss(font) {
    var css = "";
    css += font.italic ? "italic " : "normal ";
    css += font.capitalization == "smallcaps" ? "small-caps " : "normal ";
    css += (font.weight == Font.Bold || font.weight == Font.DemiBold || font.weight == Font.Black || font.bold) ? "bold " : "normal ";
    css += font.pixelSize !== null ? font.pixelSize + "px " : (font.pointSize || 10) + "pt ";
    css += this.lineHeight !== null ? this.lineHeight + "px " : " ";
    css += (font.family || "sans-serif") + " ";
    return css;
}

/**
 *
 * Apply CSS style definitions of the parent to the first child.
 * The applied parent definitions are cleared in the parent.
 * Requires that a child DOMhas already been created.
 *
 * So far the following CSS elements are supported:
 *
 *  +   border
 *  +   borderRadius
 *  +   borderWidth
 *  +   borderColor
 *  +   backgroundColor
 *
 * @param   self    parent object
 *
 */
function updateCss(self) {
    var supported = [
        'border',
        'borderRadius',
        'borderWidth',
        'borderColor',
        'backgroundColor'
    ];

    var n, child_style = self.dom.firstChild.style;
    for (n = 0; n < supported.length; n++) {
        var o = supported[n];
        var v = self.css[o];
        if (v) {
            child_style[o] = v;
            self.css[o] = null;
        }
    }
}

/**
 *
 * Create a formatted list of object properties.
 * Unsophisticated. To be extended or deleted later.
 *
 * @param   obj     object to be list
 * @param   title   titlestring for the list
 *
 * @return  list of formatted object property strings
 *
 */
function objList(obj, title) {
    var o, out = [title];
    for (o in obj) {
        var ov = obj[o];
        if (ov)
            out.push(o + ' : ' + ov);
    }
    return out;
}

/**
 *
 * Log DOM object properties to the Javascript console.
 *
 * Visual QML items have a DOM akin to a HTML <body>
 * and a secondary child dom akin to a HTML <div>
 *
 */
function logCss() {
    var out0 = objList(self.dom.style);
    console.log(out0.join('\n'));

    var out1 = objList(self.dom.firstChild.style);
    console.log(out1.join('\n'));
}

/**
 * Helper function - migrated from qml.js
 * Prints msg and values of object. Workaround when using getter functions
 * as Chrome (at least) won't show property values for them.
 * @param   msg     Message
 * @param   obj     Object to use (will be "printed", too)
 * @param   vals    Values to list from the object.
 */
function descr(msg, obj, vals) {
    var str = msg + ": [" + obj.id + "] ",
        i;
    for (i = 0; i < vals.length; i++) {
        str += vals[i] + "=" + obj[vals[i]] + " ";
    }
    console.log(str, obj);
}

