if (typeof window != "undefined") {
  window.addEventListener('load', function() {
    var metaTags = document.getElementsByTagName('BODY');

    for (var i = 0 ; i < metaTags.length ; ++i) {
      var metaTag = metaTags[i];
      var source  = metaTag.getAttribute('data-qml');

      if (source != null) {
        window.qmlEngine = new QMLEngine();
        qmlEngine.loadFile(source);
        qmlEngine.start();
        break ;
      }
    }
  });
}
