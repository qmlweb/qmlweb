import "../PartTwo" // e.g. import from relative dir

Rectangle {
  width: 400
  height: 100
  color: "green"

  Text {
    text: 'This is SomeItem from module SomeModule.PartOne'
  }
 
  ItemTwo {
    x: 20
    y: 20
    color: "#0c0"
  }
  
}