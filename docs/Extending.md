# Extending QmlWeb

When implementing new features, you may need to get away from QML and create
your own QML components from scratch, using directly the engine's API.

```javascript
QmlWeb.registerQmlType({
  module: "MyModule",
  name: "MyTypeName",
  versions: /^1(\.[0-3])?$/, // that regexp must match the version number for the import to work
  baseClass: "QtQuick.Item",
  properties: {
    // creates a property `data` of undefined type
    data: "var",
    // creates a property `name` of type string, with a default value
    name: { type: "string", initialValue: "default name" }
  },
  signals: {
    // creates a signal somethingHappened with no arguments
    somethingHappened: []
  }
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);

    this.somethingHappened.connect(this, function() {
      console.log('You may also connect to signals in JavaScript');
    });

    // Run updateText once, ensure it'll be executed whenever the 'data' property changes.
    this.updateText();
    this.onDataChanged.connect(this, this.updateText);
  }

  // Using the DOM
  updateText() {
    let text = "";
    for (let i = 0 ; i < self.data.length ; ++i) {
      text += `[${data[i]}] `;
    }
    this.dom.textContent = text; // Updating the dom
    this.somethingHappened(); // triggers the `somethingHappened` signal.
  }
});
```

And here's how you would use that component in a regular QML file:

```qml
import MyModule 1.3

MyTypeName {
  name: "el nombre"
  data: [ 1, 2, 3 ]

  onSomethingHappened: console.log(data)
}
```

For more examples, see the `src/modules/` directory — you can access all API
used there from your code.
