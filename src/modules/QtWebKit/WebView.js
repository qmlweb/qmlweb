// eslint-disable-next-line no-undef
class QtWebKit_WebView extends QtWebView_WebView {
  static versions = /^3\./;
  static enums = {
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
  };
  static properties = {
    icon: "url"
  };
  static signals = {
    navigationRequested: [
      { type: "var", name: "request" }
    ],
    linkHovered: [
      { type: "url", name: "hoveredUrl" },
      { type: "string", name: "hoveredTitle" }
    ]
  };

  // TODO: implement more features on top of WebView
}
