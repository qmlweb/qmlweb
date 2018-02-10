# JavaScript powered QML Engine

[![Join the chat at https://gitter.im/qmlweb/qmlweb](https://badges.gitter.im/qmlweb/qmlweb.svg)](https://gitter.im/qmlweb/qmlweb)
[![Build Status](https://travis-ci.org/qmlweb/qmlweb.svg?branch=master)](https://travis-ci.org/qmlweb/qmlweb)
[![codecov](https://codecov.io/gh/qmlweb/qmlweb/branch/master/graph/badge.svg)](https://codecov.io/gh/qmlweb/qmlweb)

[![npm](https://img.shields.io/npm/v/qmlweb.svg)](https://www.npmjs.com/package/qmlweb)
[![Bower](https://img.shields.io/bower/v/qmlweb.svg)](http://bower.io/search/?q=qmlweb)
[![GitHub tag](https://img.shields.io/github/tag/qmlweb/qmlweb.svg)](https://github.com/qmlweb/qmlweb/releases)

This project aims at bringing the power of QML to the web browser.
Here's a sample of how QML looks like:

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

## How to use

### Add the library to your web page

Using one of the methods below, install the qmlweb JavaScript library:

* [npm](https://www.npmjs.com/package/qmlweb) — `npm install qmlweb`
* GitHub [releases](https://github.com/qmlweb/qmlweb/releases) —
  `tar -xaf v0.2.0.tar.gz`
* Manually (recommended if you cloned from git) — `npm install && npm run build`

Next, simply add `lib/qmlweb.js` to the list of other JavaScript files in your
app's HTML file:

```HTML
<script type="text/javascript" src="/lib/qmlweb.js"></script>
```

See the [examples](examples) directory for more details and complete usage
examples.

### Testing from a local folder

Note that due to security restrictions (which are there to protect you!)
browsers do not allow loading arbitrary local files, which includes `*.qml`.

Because of that, to test the goodness of QmlWeb on your own machine, you
have to spin up a local http server, e.g. by running `npx http-server`.

Or try out [qmlweb-viewer](https://github.com/qmlweb/qmlweb-viewer).

### API

You can use DOM elements as the base for QML components:

```js
var div = document.getElementById('embed'); // this is your DOM element
var engine = new QmlWeb.QMLEngine(div);
engine.loadFile('qml/main.qml');
engine.start();
```

See also
[`engine.loadQML`](docs/QMLEngine.md#engineloadqmlsrc-parentcomponent--file-)
for constructing a QML element from a source string.

### Auto-load

You can modify the `<body>` element to specify what QML file to load when
the page is opened. The loaded QML element will fill the whole page.

```HTML
<!DOCTYPE html>
<html>
  <head>
    <title>QML Auto-load Example</title>
    <script type="text/javascript" src="/lib/qmlweb.js"></script>
  </head>
  <body style="margin: 0" data-qml="qml/main.qml">
  </body>
</html>
```

### Web Components

You can register QML files as
[Custom Elements](https://www.w3.org/TR/custom-elements/).

Note: browser support for Custom Elements v1 is limited, and QmlWeb does not
include a polyfill. You might want to load a
[polyfill](https://github.com/webcomponents/custom-elements) manually.

Registering the element:

```js
QmlWeb.registerElement('qml-main', 'qml/main.qml');
```

Using the element:

```html
<qml-main height="300" color="red" firstName="World"></qml-main>
```

Top-level properties get exported as HTML attributes and are binded to them,
real-time updates are possible.

## Supported modules and elements

Approximate modules support status for the git version could be viewed on the
[Projects](https://github.com/qmlweb/qmlweb/projects/1) page.

You can click on the module cards for per-class details.

## How to use with Gulp

See [gulp-qmlweb](https://github.com/qmlweb/gulp-qmlweb) package.

## How to extend

See [Extending](docs/Extending.md).

## Related efforts

### [Qt Quick WebGL streaming](http://blog.qt.io/blog/2017/02/22/qt-quick-webgl-streaming/)

That will allow users to run the main Qt process on the server and render on
HTML clients through WebGL. Qt WebGL streaming requires one application process
on server per each client — only the painting is delegated to the client.

The usecase differs significantly from QmlWeb, as QmlWeb runs all code on the
clients, attempting to reuse browser APIs as much as possible to provide
better integration. No server-side code is needed, server provides static files.

### [PureQml framework](https://github.com/pureqml/qmlcore)

PureQml aims to implement a language close to original QML, but it does not
target 100% compatibility with Qt QML, unlike QmlWeb.
They also provide a framework based on their language and target support for a
great variety of platforms.

### [Qt/QML + Emscripten](https://dragly.org/2016/04/27/experimental-qt-and-qml-in-the-browser/)

Transplitting all the required Qt/QML libraries to JS/WebAssembley and rendering
everything to Canvas provides the best possible compatibility with upstream Qt.
That comes at a price, though — the runtime is pretty big, and that approach
does not allow to reuse many existing browser APIs and components.

### [Qt for WebAssembly port](https://github.com/msorvig/qt-webassembly-examples/)

Similar as the above «Qt/QML + Emscripten», but more up to date.
Upstream issue: [QTBUG-63917](https://bugreports.qt.io/browse/QTBUG-63917).

Examples at <https://msorvig.github.io/qt-webassembly-examples/>.
