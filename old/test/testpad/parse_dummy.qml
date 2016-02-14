// Dummy parsing test
Rectangle {
    id: rect; width: 400;
    // Testing javascript parsing
    height: 3*100+5-5+Math.sin(2^4);color: "lightgray"

    Text {
        // Testing object defines
        // Text will be centered. First example is illegal in QML, but the
        // point is to test parser for now.
        anchors.horizontalCenter: rect.width 
        anchors.horizontalCenter: rect.horizontalCenter
        anchors.verticalCenter: rect.verticalCenter

    
        // Testing Javascript parsing
        text: "Wohoo "
            + "I'm being rendered! "
            /* You know, |0 is floor in Javascript */
            + (Math.random()*10|0)
        color: "black"
    }
}
