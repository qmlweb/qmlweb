var fs = require("fs")
var glob = require("glob")
var options = {}

var template = `//Generated -- remove this comment to prevent it from being overwritten
describe('QtQuick.{{NAME}}', function() {
  var loader = prefixedQmlLoader('QtQuick/qml/{{NAME}}');
  it('can be loaded', function() {
    var div = loader('Empty')
    div.remove()
  })
})
`
var qmlTemplate = `import QtQuick 2.0
{{NAME}} { 
    
}
`

var sourcePath = "src/qtcore/qml/elements/"
var testPath = "tests/"
glob(sourcePath + "QtQuick/**/*.js", options, function (er, files) {
    
    for(var f in files){
        var file = files[f].replace(".js", "").replace(sourcePath, "")
        var name = file.substr(file.lastIndexOf("/") + 1)
        var path = file.substr(0, file.lastIndexOf("/"))
        
        var testFilePath = testPath + "/" + file + ".js"
        if(fs.existsSync(testFilePath)) {
            var existingFile = fs.readFileSync(testFilePath).toString("ascii")
            console.log("exists")
            console.log(existingFile)
            if(existingFile != "" && !existingFile.startsWith("//Generated")){
                console.log("skip")
                continue;
            }
                
        
        }
            
        var qmlFilePath = testPath + "/" + path + "/qml/" + name + "Empty.qml"
        
        var testFileContent = template.replace(/{{NAME}}/g, name)
        var qmlFileContent = qmlTemplate.replace(/{{NAME}}/g, name)
        console.log(qmlFilePath)
        fs.writeFile(testFilePath, testFileContent)
        fs.writeFile(qmlFilePath, qmlFileContent)
        
        
        
        
    }
})