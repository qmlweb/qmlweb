window.addEventListener('load', () => {
  var metaTags = document.getElementsByTagName('BODY');

  for (var i = 0 ; i < metaTags.length ; ++i) {
    var metaTag = metaTags[i];
    var source  = metaTag.getAttribute('data-qml');

    if (source != null) {
      QmlWeb.qmlEngine = new QMLEngine();
      QmlWeb.qmlEngine.loadFile(source);
      QmlWeb.qmlEngine.start();
      break ;
    }
  }
});
