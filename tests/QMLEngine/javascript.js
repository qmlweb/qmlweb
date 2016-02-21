/**
 * Created by henrik on 21.02.16.
 */
describe('QMLEngine.javascript', function() {
    var loader = prefixedQmlLoader('QMLEngine/qml/Javascript');
    it('can be parsed', function() {
        var div = loader('BasicSyntax');
        div.remove()

    });
});