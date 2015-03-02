# A QML engine in a web browser

The QML language is well-suited for building web applications. Goal is
to develop the required technologies for that. This is a runtime
environment in JavaScript and the required QML modules to render in
web browsers. Other applications can be considered. Main focus is on
developing hybrid-applications using native (Qt) and web technologies
of any scale, not forgetting the creation of sole web applications.
QmlWeb is not intended to run native QtQuick applications using QmlWeb
without migration effort.

### Get started

To use QmlWeb, you need a simple html file to load and start QmlWeb.
This simple file will do:

```html
<!DOCTYPE html>
<html>
    <head>
        <title>QmlWeb Demo</title>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <script type="text/javascript" src="../qmlweb/src/parser.js"></script>
        <script type="text/javascript" src="../qmlweb/src/import.js"></script>
        <script type="text/javascript" src="../qmlweb/src/qtcore.js"></script>
    </head>
    <body style="margin: 0;">
        <script type="text/javascript">
            var qmlEngine = new QMLEngine();
            qmlEngine.loadFile("main.qml");
            qmlEngine.start();
        </script>
    </body>
</html>
```

The next thing you need is a QML-file:

```qml
import QtQuick 1.1

Item {

    Text {
        anchors.centerIn: parent
        text: "Hello World!"
        font.pointSize: 12
        color: grey
    }

}
```

That's it.

_Hint: To get the root Item fill the whole screen, just don't set it's size._