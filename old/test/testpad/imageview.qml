/*
 * QMLWEB example: Image View
 */
import Qt 4.7

// Main "window"
Rectangle {
    id: main
    width: 1024; height: 600;
    
    // Big image
    Image {
        id: full
        source: "../images/duckie.jpg"
        // Put it to the center of window
        x: main.width / 2 - sourceSize.width / 2
        y: main.height / 2 - sourceSize.height / 2
    }
    
    // Finder / thumb image
    Image {
        id: small
        source: "../images/duckie.jpg"
        width: 192; height: 108;
        // Position to right bottom
        anchors.right: main.right
        anchors.bottom: main.bottom
        
        // Mousearea to create finder
        MouseArea {
            anchors.fill: parent;
            
            // Function to act on mouse click
            function act(mouse) {
                // Animate X and Y positions of big image to correspond
                // to click position on thumb image
                xanim.from = full.x;
                xanim.to = -mouse.x / small.width
                        * (full.sourceSize.width - main.width);
                xanim.property = "x";
                xanim.restart();
                yanim.from = full.y;
                yanim.to = -mouse.y / small.height
                    * (full.sourceSize.height - main.height)
                yanim.property = "y";
                yanim.restart();
            }
            // "Clickhandler"
            onClicked: act(mouse)
        }
    }

    // Animation for moving big image around; X direction
    NumberAnimation {
        id: xanim
        target: full
        easing.type: Easing.InOutCubic
        duration: 1000
    }
    
    // Animation for moving big image around; Y direction
    NumberAnimation {
        id: yanim
        target: full
        easing.type: Easing.InOutCubic
        duration: 1000
    }
    
    // Finder rectangle
    // Shows viewed area of big image in viewfinder
    Rectangle {
        id: sr
        color: Qt.rgba(0,0,0,0); // Transparent fill
        border.color: "black";   // Black edges (of 1 width)
        border.width: 1;
        
        // Positioning and size of the rectangle
        x: -full.x / full.sourceSize.width * small.width
            + main.width - small.width
        y: -full.y / full.sourceSize.height * small.height
            + main.height - small.height
        width: main.width / full.sourceSize.width * small.width;
        height: main.height / full.sourceSize.height * small.height;
 
    }
}
