import QtQuick 2.2

Item {
  id: item
  property variant child

  function foo() {
      console.log("colour changed");
  }

  Item {
      id: some_child
  }

  function create_object() {
    return Qt.createQmlObject(
      "import QtQuick 2.2\nRectangle { color: 'green'; width: 320; height: 32; }",
      some_child,
      "inlinecode1"
    );
  }
}
