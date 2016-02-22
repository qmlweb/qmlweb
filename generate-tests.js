var fs = require("fs")
var glob = require("glob")
var options = {}

var template = `//Generated -- remove this comment to prevent it from being overwritten
describe('QtQuick.$NAME', function() {
  var loader = prefixedQmlLoader('QtQuick/qml/$NAME');
  it('can be loaded', function() {
    var div = loader('Empty')
    expect(div.innerHTML).toBe('')
  }
})
`

var sourcePath = "src/qtcore/qml/elements/"
var testPath = "tests/"
glob(sourcePath + "**/*.js", options, function (er, files) {
    
    for(var f in files){
        var file = files[f].replace(".js", "").replace(sourcePath, "")
        var name = file.substr(file.lastIndexOf("/") + 1)
        var path = file.substr(0, file.lastIndexOf("/"))
        
        var testFilePath = testPath + "/" + file + ".js"
        if(fs.existsSync(testFilePath)) {
            var existingFile = fs.readFileSync(testFilePath)
            if(!existingFile.startsWith("//Generated"))
                continue;
        
        }
            
        var qmlFilePath = testPath + "/" + path + "/qml/" + name + "Empty.qml"
        
        var testFileContent = template.replace("$NAME", "name")
        var qmlFileContent = name + " { }"
        
        fs.writeFile(testFilePath, testFileContent)
        fs.writeFile(qmlFilePath, qmlFileContent)
        
        
        
        
    }
})