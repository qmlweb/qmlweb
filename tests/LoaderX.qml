import QtQuick 2.0;

Rectangle {
    width: 500
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

    Rectangle {
        id: page_LdR
        color: 'lightcyan'
        anchors.top: 0
        width: 400
        height: 450
        anchors.horizontalCenter: parent.horizontalCenter
        border.width: 1
        border.color: 'red'

        Title {
            id: title_LdR
            title: 'Loader'
            anchors.horizontalCenter: parent.horizontalCenter
        }
        Loader { id: pageLoader }

        TextInput {
            id: input_LdR
            text: 'HelloWorld.qml'
            width: parent.width - 50
            anchors.top: title_LdR.bottom
            anchors.topMargin: 20
            anchors.horizontalCenter: parent.horizontalCenter

           onAccepted: {
                src = js_LdR.makeUrl(text)
                pageLoader.setSource(src)
                output_LdR.text = pageLoader.sourceQml
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
                anchors.fill: output_LdR
                onClicked: {
                    src = js_LdR.makeUrl(input_LdR.text)
                    pageLoader.setSource(src)
                    output_LdR.text = pageLoader.sourceQml
                }
            }
        }
    }
}
