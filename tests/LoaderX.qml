import QtQuick 2.0;

Rectangle {
    width: 600
    height: 500
    color: 'white'

    Item {
        id: js_LdR
         function makeUrl(url) {
            var body = document.getElementsByTagName('BODY')[0];
            var file = body.getAttribute('data-qml');
            var base = file.split("/");
            base[base.length - 1] = url;
            base = base.join("/");
            return base;
        }
    }

    Title {
        id: title_LdR
        title: 'Loader'
        anchors.horizontalCenter: parent.horizontalCenter
    }

    Rectangle {
        id: page_LdR
        color: 'lightcyan'
        anchors.top: title_LdR.bottom + 25
        width: parent.width - 100
        height: parent.height - 50
        anchors.horizontalCenter: parent.horizontalCenter
        border.width: 1
        border.color: 'red'

        Loader { id: pageLoader }

        TextInput {
            id: input_LdR
            text: 'HelloWorld.qml'
            width: 100
            height: 30
            anchors.top: parent.top
            anchors.topMargin: 20
            anchors.left: parent.left + 50

           onAccepted: {
                src = js_LdR.makeUrl(text)
                pageLoader.setSource(src)
                output_LdR.text = pageLoader.sourceQml
            }
        }

        ComboBox {
            width: 100
            height: 30
            anchors.top: input_LdR.top
            anchors.left: input_LdR.right + 50

            model: [
            'HelloWorld', 'RectangleX', 'TextX', 'ImageX', 'ListViewX',
            'AnimationX', 'Widgets', 'Plugins', 'ColumnRow', 'TextEditX',
            'LoaderX', 'Demo', 'CanvasX', 'PathViewX', 'ZZ.Z']

            onAccepted: {
                input_LdR.text = currentText
                input_LdR.accepted()
            }
        }

        TextEdit {
            id: output_LdR
            width: parent.width - 50
            height: 300
            anchors.horizontalCenter: parent.horizontalCenter
            anchors.top: input_LdR.bottom
            anchors.topMargin: 20
            font.bold: true
            font.pointSize: 11
            text:
'Specify the name of a file to read in the TextInput.
Loader will load the source of the file and display it
in this TextEdit. Your server\'s URL routing needs
to take care that the file will be found on the server.
The client requests the file with an HTTP GET request.'

            MouseArea {
                anchors.fill: parent
                onClicked: {
                    src = js_LdR.makeUrl(input_LdR.text)
                    pageLoader.setSource(src)
                    output_LdR.text = pageLoader.sourceQml
                }
            }
        }
    }
}
