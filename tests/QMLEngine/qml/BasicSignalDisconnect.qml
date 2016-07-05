import QtQuick 2.0

Item {
  id: mainitem

  signal sig1();

  property string log: ""
  Text {
    text: log
  }

  Item {
    id: item1
    function foo() {
      console.log("Item 1 got signal");
      mainitem.log = mainitem.log + "1";
      mainitem.sig1.disconnect( item1, item1.foo );
    }
  }

  Item {
    id: item2
    function foo() {
      console.log("Item 2 got signal");
      mainitem.log = mainitem.log + "2";
    }
  }

  Component.onCompleted: {
    mainitem.sig1.connect( item1, item1.foo );
    mainitem.sig1.connect( item2, item2.foo );
    mainitem.log = mainitem.log + "i";
    sig1();
    mainitem.log = mainitem.log + "i";
    sig1();
  }

  /* Expected behaviour (works well in qmlscene.exe Qt 5.3):
       sig1 => (item1.foo + disconnect item1.foo) + item2.foo
       sig1 => item2.foo
     e.g. log = "i12i2"

     Current qmlweb behaviour:
       sig1 => (item1.foo + disconnect item1.foo) + missing call to item2.foo
       sig1 => item2.foo
     e.g. log = "i1i2"
  */
}
