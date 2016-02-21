function contextVariable(obj, name){
    return obj.$context[name]
}

describe('scope', function() {
    var loader = prefixedQmlLoader('QMLEngine/qml/Scope')
    it('can reference parent items id', function () {
        var qml = loader('Root').qml
        var parentItem = contextVariable(qml, "parentItem")
        expect(parentItem).not.toBe(undefined)
        expect(parentItem.$context).not.toBe(undefined)
        var childA = contextVariable(parentItem, "childA")
        expect(childA).not.toBe(undefined)
        var childB = contextVariable(parentItem, "childB")
        expect(childB).not.toBe(undefined)
    })
})