/**
 *
 * HTML QML file loader
 *
 * TODO ? can there be more than one body tag ?
 *
 */
global.addEventListener('load', function () {
    var metaTags = document.getElementsByTagName('BODY');

    for (var i = 0; i < metaTags.length; ++i) {
        var metaTag = metaTags[i];
        var source = metaTag.getAttribute('data-qml');

        if (source != null) {
            global.qmlEngine = new QMLEngine();
            qmlEngine.loadFile(source);
            qmlEngine.start();
            break;
        }
    }
});
