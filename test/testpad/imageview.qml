/*
 * QMLWEB example: Image View
 */
import Qt 4.7

Rectangle {
    id: main
    width: 1024; height: 600;
    Image {
        id: full
        source: "../images/duckie.jpg"
        x: main.width / 2 - sourceSize.width / 2
        y: main.height / 2 - sourceSize.height / 2
    }
    Image {
        id: small
        source: "../images/duckie.jpg"
        width: 192; height: 108;
        anchors.right: main.right
        anchors.bottom: main.bottom
        MouseArea {
            anchors.fill: parent;
            function act(mouse) {
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
            onClicked: act(mouse)
        }
    }
    NumberAnimation {
        id: xanim
        target: full
        easing.type: Easing.InOutCubic
        duration: 1000
    }
    NumberAnimation {
        id: yanim
        target: full
        easing.type: Easing.InOutCubic
        duration: 1000
    }
    Rectangle {
        id: sr
        color: Qt.rgba(0,0,0,0);
        border.color: "black";
        border.width: 1;
        x: -full.x / full.sourceSize.width * small.width
            + main.width - small.width
        y: -full.y / full.sourceSize.height * small.height
            + main.height - small.height
        width: main.width / full.sourceSize.width * small.width;
        height: main.height / full.sourceSize.height * small.height;
    }
}
