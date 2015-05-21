Column {
    Text {
        text: "Alias changes signal test\n"+
              "Example: property alias newname: someobj.someprop\n"+
              "When `someobj.someprop` changes, `newname` must emit 'changed' signal too.\n\n"
    }

    property var counter: 0

    Row {
        Text {
            text: "someobj.someprop="
        }
        SomeObject {
          id: someobj 
        }
    }

    Repeater{
        id:rep
        model:1
        Text {
            text: "Binded alias val="+val
            property alias val: someobj.txt

            onValChanged: {
                console.log("val alias changed signal slot called");
                counter++;
            }
        }
    }

    Text {
        text: "Alias changes counter ="+counter
    }

    Button {
        text: "grow"
        onClicked: rep.model = 5
    }



}  
