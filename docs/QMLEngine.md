# QMLEngine

## new QMLEngine(element)

* `element` {HTMLElement}

Returns new QMLEngine object.

There could be only one running QMLEngine at the moment.

## engine.start()

Start the engine/application.

## engine.stop()

Stop the engine/application.

Restarting is experimental.

## engine.loadFile(file\[, parentComponent\]) {

* `file` {String} Path of file to load.
* `parentComponent` {Object} Parent component.

Load a `.qml` or `.qml.js` file, parse and construct.

## engine.loadQML(src\[, parentComponent \[, file\]\]) {

* `src` {String} QML source.
* `parentComponent` {Object} Parent component.
* `file` {String} Optional file name for debug purposes.

Parse and construct QML.

## engine.loadQMLTree(tree\[, parentComponent\[, file\]\]) {

* `tree` {Object} Parsed QML tree (see qmlweb-parser).
* `parentComponent` {Object} Parent component.
* `file` {String} Optional file name for debug purposes.

Construct from an already parsed QML tree.

## engine.rootContext()

Get the top-level context of the context hierarchy.

## engine.size()

Returns the dimensions of the root object, in format
`{ width: 100, height: 100 }`.

## engine.loadImports(imports\[, currentFileDir\])

* `importsArray` {Array} Import statements.
* `currentFileDir` {String} Base directory for imports lookup.

Performs loading of qmldir files from given qml import records.

`importsArray` is in qmlweb-parser notation, e.g. `[import1, import2, ...]`
where each `importN` is also an array:
`['qmlimport', 'name', version, as, isQualifiedName]`.

`currentFileDir` will be used together with `importPathList()`. It defaults to
base path extracted from the initially loaded file path.

### Implicit input

* engine object function `importPathList()` - list of urls bases used for qmldir
  files lookup

### Additional implicit input/output

* engine object variable `qmldirsContents` - used for caching, e.g. memory for
  previously loaded qmldir files

### Output

* engine object variable `qmldirs` - new records will be added there

### Return value

* nothing

### Details

For each of given import statements, loadImports

1. computes qmldir file location according to
   <http://doc.qt.io/qt-5/qtqml-syntax-imports.html>
2. calls `readQmlDir` for actual reading and parsing of qmldir file content
3. gets `external` declarations of that qmldir file and pushes them to
  `engine.qmldirs` hash.

`engine.qmldirs` is a hash of form: { componentName => componentFileUrl }
This hash then used by `qml.js::construct` method for computing component urls.

#### Notes

1. This method is not suited for loading js imports.
   This may be done probably after answering to Q1 (below).
2. Please look for additional notes at readQmlDir function.

#### QNA

* Q1: How and where in engine component names might be prefixed?
      E.g. names with dot inside: SomeModule.Component1
* A1: Seems it doesn't matter. Seems we may just save name with dot-inside
      right to qmldirs, and it may be used by construct() seamlessly. Check it.

* Q2: How we may access component object from here, to store qmldirs info in
      components logical scope, and not at engine scope?
* A2: Probably, answer is in Component.js and in QmlWeb.loadImports

#### TODO

* We have to keep output in component scope, not in engine scope.
* We have to add module "as"-names to component's names (which is possible after
  keeping imports in component scope).
* Determine how this stuff is related to `QmlWeb.loadImports`
* Check A1
* Make a complete picture of what going in with imports, including Component.js
  own imports loading.
* Note importJs method in import.js
