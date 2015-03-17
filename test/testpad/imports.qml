import SomeModule.PartOne 1.0 

// e.g. import module as qualified name

// qtcore will lookup that module:

// * from addModulePath("SomeModule.PartOne",...path...) 
// * from base dir of current qml file
// * from addImportPath dirs

// In current test, case 2 will be used...

Rectangle {
    id: page
    width: 500; height: 200
    color: "lightgray"
    Text {
      text: "this is main object of the scene"
    }

    SomeItem {
      x: 30
      y: 30
    }
}
