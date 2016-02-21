describe('properties', function() {
    var loader = prefixedQmlLoader('QMLEngine/qml/Properties')
    it('can store values', function() {
        var qml = loader('Basic').qml;
        expect(qml.intProperty).toBe(10)
        expect(qml.doubleProperty).toBe(0.5)
        expect(qml.stringProperty).toBe("hello")
        expect(qml.itemProperty.x).not.toBe(undefined)
        expect(qml.arrayProperty).toEqual([1,2,"bar"])
    })

    it('can be aliased', function(){
        var qml = loader('Alias').qml
        expect(qml.childX).toBe(125)

    })
})