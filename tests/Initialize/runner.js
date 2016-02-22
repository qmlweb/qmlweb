describe('Initialization.loadQml', function() {
    it('it can load qml without a file', function() {
        var div = loadQml("import QtQuick 2.0\nItem {}\n");
    });
});

var QtQuickModules = [
    {name: 'AnimatedImage', tags: []},
    {name: 'Animation', tags: []},
    {name: 'Behavior', tags: []},
    {name: 'BorderImage', tags: []},
    {name: 'Column', tags: ["dom"]},
    {name: 'DoubleValidator', tags: []},
    {name: 'Flow', tags: []},
    {name: 'Font', tags: []},
    {name: 'FontLoader', tags: []},
    {name: 'Grid', tags: ["dom"]},
    {name: 'Image', tags: ["dom"]},
    {name: 'IntValidator', tags: []},
    {name: 'ListElement', tags: []},
    {name: 'ListModel', tags: []},
    {name: 'ListView', tags: ["dom"]},
    {name: 'Loader', tags: []},
    {name: 'MouseArea', tags: ["dom"]},
    {name: 'NumberAnimation', tags: []},
    {name: 'ParallelAnimation', tags: []},
    {name: 'PropertyAnimation', tags: []},
    {name: 'Rectangle', tags: ["dom"]},
    {name: 'RegExpValidator', tags: []},
    {name: 'Repeater', tags: ["dom"]},
    {name: 'Rotation', tags: []},
    {name: 'Row', tags: ["dom"]},
    {name: 'Scale', tags: []},
    {name: 'SequentialAnimation', tags: []},
    {name: 'State', tags: []},
    {name: 'SystemPalette', tags: []},
    {name: 'Text', tags: ["dom"]},
    {name: 'TextInput', tags: ["dom"]},
    {name: 'Timer', tags: []},
    {name: 'Transition', tags: []},
    {name: 'Translate', tags: []},
]

var qmlTemplate = 'import QtQuick 2.0\n{{NAME}} { }\n'

function testModule(module, testFunc){
    module.forEach(function(name){
        testFunc(name)
    })
}

testModule(QtQuickModules, function(element){
    describe('Initialize.' + element.name, function() {
        it('can be loaded', function() {
            var engine = loadQml(qmlTemplate.replace(/\{\{NAME\}\}/g, element.name));
            var div = engine.rootElement
            var qml = engine.rootObject
            expect(div).not.toBe(undefined)
            if(element.tags.indexOf("dom") >= 0) {
                expect(div.className).toBe(element.name)
                expect(div.qml).not.toBe(undefined)
                expect(div.qml.Component).not.toBe(undefined)
            }
            else
                expect(qml.Component).not.toBe(undefined)
        });
    });
})


