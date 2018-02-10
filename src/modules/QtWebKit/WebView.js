QmlWeb.registerQmlType({
  module: "QtWebKit",
  name: "WebView",
  versions: /^3\./,
  baseClass: "QtWebView.WebView", // It"s easier this way
  enums: {
    ErrorDomain: {
      NoErrorDomain: 0, InternalErrorDomain: 1, NetworkErrorDomain: 2,
      HttpErrorDomain: 3, DownloadErrorDomain: 4
    },
    LoadStatus: {
      LoadStartedStatus: 1, LoadSucceededStatus: 2, LoadFailedStatus: 3
    },
    NavigationRequestAction: { AcceptRequest: 0, IgnoreRequest: 255 },
    NavigationType: {
      LinkClickedNavigation: 0, FormSubmittedNavigation: 1,
      BackForwardNavigation: 2, ReloadNavigation: 3,
      FormResubmittedNavigation: 4, OtherNavigation: 5
    }
  },
  properties: {
    icon: "url"
  },
  signals: {
    navigationRequested: [
      { type: "var", name: "request" }
    ],
    linkHovered: [
      { type: "url", name: "hoveredUrl" },
      { type: "string", name: "hoveredTitle" }
    ]
  }
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);

    // TODO: implement more features on top of WebView
  }
});
