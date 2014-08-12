import QtQuick 1.1

Item {
    width: 500; height: 500

    Keys.onPressed: masterText.text += event.text;

    Text {
        id: masterText
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.bottom: parent.verticalCenter
        anchors.margins: 30
    }

    Button {
        text: "Active focus to top left"
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.bottom: parent.verticalCenter
        onClicked: rect1.forceActiveFocus();
        width: 150; height: 20
    }
    Button {
        text: "focus FocusScope 2"
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.top: parent.verticalCenter
        onClicked: fs2.focus = true;
        width: 150; height: 20
    }

    FocusScope {
        width: 500; height: 200
        Rectangle {
            anchors.centerIn: parent
            width: 20; height: 20
            color: Qt.rgba(parent.focus ? 1 : 0, parent.activeFocus ? 1 : 0, 0, 1);
        }
        Rectangle {
            id: rect1
            width: 200; height: 200
            color: activeFocus ? "green" : focus ? "lightsteelblue" : "grey"

            Text {
                id: tt1
                anchors.centerIn: parent
                text: "Please type"
            }

            Keys.onPressed: tt1.text += event.text;
        }
        Rectangle {
            id: rect2
            width: 200; height: 200; x: 300
            color: activeFocus ? "green" : focus ? "lightsteelblue" : "grey"

            Text {
                id: tt2
                anchors.centerIn: parent
                text: "Please type"
            }

            Keys.onPressed: tt2.text += event.text;
        }
    }
    FocusScope {
        id: fs2
        y: 300
        width: 500; height: 200
        Rectangle {
            anchors.centerIn: parent
            width: 20; height: 20
            color: Qt.rgba(parent.focus ? 1 : 0, parent.activeFocus ? 1 : 0, 0, 1);
        }
        Rectangle {
            width: 200; height: 200
            color: activeFocus ? "green" : focus ? "lightsteelblue" : "grey"

            Text {
                id: tt3
                anchors.centerIn: parent
                text: "Please type"
            }

            Keys.onPressed: tt3.text += event.text;
            Keys.onAsteriskPressed: { color = "AliceBlue"; tt3.text = "asterisk"; }
            Keys.onBackPressed: { color = "AntiqueWhite"; tt3.text = "back"; }
            Keys.onBacktabPressed: { color = "Aqua"; tt3.text = "backtab"; }
            Keys.onCallPressed: { color = "Aquamarine"; tt3.text = "call"; }
            Keys.onCancelPressed: { color = "Azure"; tt3.text = "cancel"; }
            Keys.onContext1Pressed: { color = "Beige"; tt3.text = "context1"; }
            Keys.onContext2Pressed: { color = "Bisque"; tt3.text = "context2"; }
            Keys.onContext3Pressed: { color = "Black"; tt3.text = "context3"; }
            Keys.onContext4Pressed: { color = "BlanchedAlmond"; tt3.text = "context4"; }
            Keys.onDeletePressed: { color = "Blue"; tt3.text = "delete"; }
            Keys.onDigit0Pressed: { color = "BlueViolet"; tt3.text = "digit0"; }
            Keys.onDigit1Pressed: { color = "Brown"; tt3.text = "digit1"; }
            Keys.onDigit2Pressed: { color = "BurlyWood"; tt3.text = "digit2"; }
            Keys.onDigit3Pressed: { color = "CadetBlue"; tt3.text = "digit3"; }
            Keys.onDigit4Pressed: { color = "Chartreuse"; tt3.text = "digit4"; }
            Keys.onDigit5Pressed: { color = "Chocolate"; tt3.text = "digit5"; }
            Keys.onDigit6Pressed: { color = "Coral"; tt3.text = "digit6"; }
            Keys.onDigit7Pressed: { color = "CornflowerBlue"; tt3.text = "digit7"; }
            Keys.onDigit8Pressed: { color = "Cornsilk"; tt3.text = "digit8"; }
            Keys.onDigit9Pressed: { color = "Crimson"; tt3.text = "digit9"; }
            Keys.onDownPressed: { color = "Cyan"; tt3.text = "down"; }
            Keys.onEnterPressed: { color = "DarkBlue"; tt3.text = "enter"; }
            Keys.onEscapePressed: { color = "DARKCYAN"; tt3.text = "escape"; }
            Keys.onFlipPressed: { color = "DARKGOLDENROD"; tt3.text = "flip"; }
            Keys.onHangupPressed: { color = "DARKGRAY"; tt3.text = "hangup"; }
            Keys.onLeftPressed: { color = "DARKGREEN"; tt3.text = "left"; }
            Keys.onMenuPressed: { color = "DARKKHAKI"; tt3.text = "menu"; }
            Keys.onNoPressed: { color = "DARKMAGENTA"; tt3.text = "no"; }
            Keys.onReturnPressed: { color = "DARKOLIVEGREEN"; tt3.text = "return"; }
            Keys.onRightPressed: { color = "DARKORANGE"; tt3.text = "right"; }
            Keys.onSelectPressed: { color = "DARKORCHID"; tt3.text = "select"; }
            Keys.onSpacePressed: { color = "DARKRED"; tt3.text = "space"; }
            Keys.onTabPressed: { color = "DarkSalmon"; tt3.text = "tab"; }
            Keys.onUpPressed: { color = "DarkSeaGreen"; tt3.text = "up"; }
            Keys.onVolumeDownPressed: { color = "DarkSlateBlue"; tt3.text = "volumeDown"; }
            Keys.onVolumeUpPressed: { color = "DarkSlateGray"; tt3.text = "volumeUp"; }
            Keys.onYesPressed: { color = "DarkTurquoise"; tt3.text = "yes"; }
        }
        Rectangle {
            width: 200; height: 200; x: 300
            color: activeFocus ? "green" : focus ? "lightsteelblue" : "grey"

            Text {
                id: tt4
                anchors.centerIn: parent
                text: "Please type"
            }
            Component.onCompleted: focus = true;

            Keys.onPressed: {
                if (event.key == Qt.Key_Escape)
                    height -= 10;
                tt4.text += event.text;
                event.accepted = true;
            }
        }
    }
}