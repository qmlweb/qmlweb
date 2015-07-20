import QtQuick 2.0;

Rectangle {
    id: root
    color: 'white'
    x: 100

    Item {
        id: js
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
        id: page
        color: 'lightcyan'
        y: 30
        width:700
        height: output.bottom + 10
        border.width: 1
        border.color: 'red'

        Title {
            id: title
            title: 'Loader'
            anchors.horizontalCenter: page.horizontalCenter
        }
        Loader { id: pageLoader }

        TextInput {
            id: input
            text: 'HelloWorld.qml'
            width: 600
            anchors.top: title.bottom
            anchors.topMargin: 20
            anchors.horizontalCenter: page.horizontalCenter

           onAccepted: {
                src = js.makeUrl(text)
                pageLoader.setSource(src, null)
                output.text = pageLoader.qmlSource
            }
        }

        TextEdit {
            id: output
            width: 600
            height: 450
            anchors.horizontalCenter: page.horizontalCenter
            anchors.top: input.bottom
            anchors.topMargin: 20
            font.bold: true
            font.pointSize: 12
            text:
'Specify the name of a file to read in the TextInput.
Loader will load the source of the file and display it
in this TextEdit. Your server\'s URL routing needs
to take care that the file will be found on the server.
The client requests the file with an HTTP GET request.'

            MouseArea {
                anchors.fill: output
                onClicked: {
                    src = js.makeUrl(input.text)
                    pageLoader.setSource(src, null)
                    output.text = pageLoader.qmlSource
                }
            }
        }
    }
}
