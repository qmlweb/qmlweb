## Javascript powered QML Engine

[![Join the chat at https://gitter.im/qmlweb/qmlweb](https://badges.gitter.im/qmlweb/qmlweb.svg)](https://gitter.im/qmlweb/qmlweb?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

CSS and HTML are boring and lame. And they suck at designing cool, interactive interfaces. Qt came up with a much better answer for its renowned framework: `QML`, a declarative language perfect for designing UIs (and much more). Here's a sample of how QML looks like:

```QML
import QtQuick 2.0

Rectangle {
   width: 500; height: 200
   color: "lightgray"

   Text {
       id: helloText
       text: "Hello world!"
       anchors.verticalCenter: parent.verticalCenter
       anchors.horizontalCenter: parent.horizontalCenter
       font.pointSize: 24; font.bold: true
   }
}
```

This project aims at bringing the power of QML to the web browser.

This is a fork from `git://anongit.kde.org/qmlweb` in [Webapps written in qml not far from reality anymore](http://akreuzkamp.de/2013/07/10/webapps-written-in-qml-not-far-from-reality-anymore)

# Summary
* [How to use](#how-to-use)
* [How to use with Gulp](#how-to-use-with-gulp)
* [How to extend](#how-to-extend)
* [How is this fork different](#how-is-this-fork-different)
* [Todo](#todo)

## How to use
#### Add the library to your web page
Download the file `lib/qt.js` and preload it in an HTML page.

```HTML
<script type="text/javascript" src="/lib/qt.js"></script>
```

#### Auto-load
You may then modify the `<body>` element to specify what QML file to load when the page is opened.

```HTML
<body style="margin: 0;" data-qml="qml/main.qml">
````

## How to use with Gulp
See [gulp-qmlweb](https://github.com/qmlweb/gulp-qmlweb) package.

## How to extend
When implementing new features, you may need to get away from QML and create your own QML components from scratch, using directly the engine's API.

```Javascript
registerQmlType({
  module:   'MyModule',
  name:     'MyTypeName',
  versions: /^1(\.[0-3])?$/, // that regexp must match the version number for the import to work
  constructor: function(meta) {
    QMLItem.call(this, meta);

    var self = this;

    // Managing properties
    createSimpleProperty("string", this, "name"); // creates a property 'name' of type string
    createSimpleProperty("var", this, "data"); // creates a property 'data' of undefined type
    this.name = 'default name'; // sets a default value for the property 'name'

    // Signals
    this.somethingHappened = Signal(); // creates a signal somethingHappened

    this.somethingHappened.connect(this, function() {
      console.log('You may also connect to signals in Javascript');
    });
  
    // Using the DOM
    function updateText() {
      var text = '';
      for (var i = 0 ; i < self.data.length ; ++i)
        text += '[' + data[i] + '] ';
      self.dom.textContent = text; // Updating the dom
      self.somethingHappened(); // triggers the 'somethingHappened' signal.
    }

    // Run updateText once, ensure it'll be executed whenever the 'data' property changes.
    updateText();
    this.onDataChanged.connect(this, updateText);
  }
});
```

And here's how you would use that component in a regular QML file:
```QML
import MyModule 1.3

MyTypeName {
  name: 'el nombre'
  data: [ 1, 2, 3 ]

  onSomethingHappened: console.log(data)
}
```

## How is this fork different
#### Implemented 'import'
- QML Types are now registered into different modules. They're only made available once
  their module has been required (e.g: can't use Rectangle unless there's an `import QtQuick`).
  Versions can also be matched by the types when they're registered, to allow people to implement
  different behaviors for different versions of the same module.

- It is now possible to import javascript files in a QML file.

#### Implemented pre-loading
Implemented a Gulp module that:
- parses QML file and store the parsed tree in a `qrc` object.
- detect symbols from JS files and store the result and source in a `qrc` object.
- don't use any HTTP request to load qml/js files if they are already in `qrc`.

#### Implemented new types
- Video           (QtMultimedia)
- GeoLocation     (QtMobility)
- RegExpValidator (QtQuick)
- IntValidator    (QtQuick)
- DoubleValidator (QtQuick)
- Settings        (Qt.labs.settings)
- SystemPalette   (QtQuick)

#### Improved implementations
* TextInput supports properties focus, maximumLength, readOnly, validator, [partially] echoMode
* Image supports property mirror, supports fill modes PreserveAspectFit, PreserveAspectCrop, Tile, TileVertically

## Todo
- Unit Testing for each Components using Jasmine
- Improve the implementation of `focus`, use it to implements `Keys` and `FocusScope`
- Implement Gradient and GradientStop using CSS3
- Implement StateGroup, StateChangeScript, ParentChange, AnchorChange
- Implement ListView, GridView, PathView
- Implement QtQuick.Controls (Action, ProgressBar, Label, ComboBox, ExclusiveGroup, GroupBox, Calendar, Button)
