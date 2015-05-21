TextInput {
    property alias txt: fld.text
    width: 200
    id: fld
    text: "123"
    onTextChanged: {
        console.log("SomeObject val changed");
    }
}
