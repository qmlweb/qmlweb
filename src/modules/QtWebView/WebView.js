QmlWeb.registerQmlType({
  module: "QtWebView",
  name: "WebView",
  versions: /^1\./,
  baseClass: "QtQuick.Item",
  properties: {
    canGoBack: "bool", // TODO
    canGoForward: "bool", // TODO
    loadProgress: "int",
    loading: "bool",
    title: "string",
    url: "url"
  },
  signals: {
    /* // TODO
    loadingChanged: [
      { type: "WebViewLoadRequest", name: "loadRequest" }
    ]
    */
  }
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);

    this.urlChanged.connect(this, this.$onUrlChanged);

    const iframe = this.impl = document.createElement("iframe");
    iframe.style.display = "block";
    iframe.style.position = "absolute";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.borderWidth = "0";
    iframe.style.pointerEvents = "auto";
    this.dom.appendChild(iframe);

    iframe.onload = () => {
      try {
        this.title = iframe.contentDocument.title;
      } catch (e) {
        console.log(`CSP prevents us from reading title for ${this.url}`);
        this.title = "";
      }
      this.loadProgress = 100;
      this.loading = false;
    };
    iframe.onerror = () => {
      this.title = "";
      this.loadProgress = 0;
      this.loading = false;
    };
  }
  $onUrlChanged(newVal) {
    this.loadProgress = 0;
    this.loading = true;
    this.impl.src = newVal;
  }
});
