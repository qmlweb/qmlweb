// Function used in Text and TextEdit

// Creates font css description
function fontCss(font) {
    var css = "";
    css += font.italic ? "italic " : "normal ";
    css += font.capitalization == "smallcaps" ? "small-caps " : "normal ";
    css += (font.weight == Font.Bold || font.weight == Font.DemiBold || font.weight == Font.Black || font.bold) ? "bold " : "normal ";
    css += font.pixelSize !== Undefined ? font.pixelSize + "px " : (font.pointSize || 10) + "pt ";
    css += this.lineHeight !== Undefined ? this.lineHeight + "px " : " ";
    css += (font.family || "sans-serif") + " ";
    return css;
}

// Transfer dom style to firstChild,
// then clear corresponding dom style
function updateCss(self) {
    var supported = [
        'border',
        'borderRadius',
        'borderWidth',
        'borderColor',
        'backgroundColor',
    ];

    var child_style = self.dom.firstChild.style;
    for (n = 0; n < supported.length; n++) {
        var o = supported[n];
        var v = self.css[o];
        if (v) {
            child_style[o] = v;
            self.css[o] = null;
        }
    }
}

// Create list of strings of object properties
function objList(obj, title) {
    var out = [title];
    for (o in obj) {
        var ov = obj[o];
        if (ov)
            out.push(o + ' : ' + ov);
    }
    return out;
}

// Temporary utility function
function logCss() {
    var out0 = objList(self.dom.style);
    console.log(out0.join('\n'));

    var out1 = objList(self.dom.firstChild.style);
    console.log(out1.join('\n'));
}
