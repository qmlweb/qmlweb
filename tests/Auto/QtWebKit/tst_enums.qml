import QtQuick 2.0
import QtTest 1.0
import QtWebKit 3.0

TestCase {
  WebView { }

  function test_enums_WebView() {
    const enums = {
      // ErrorDomain
      NoErrorDomain: 0, InternalErrorDomain: 1, NetworkErrorDomain: 2,
      HttpErrorDomain: 3, DownloadErrorDomain: 4,

      // LoadStatus
      LoadStartedStatus: 0, LoadSucceededStatus: 2, LoadFailedStatus: 3,

      // NavigationRequestAction
      AcceptRequest: 0, IgnoreRequest: 255,

      // NavigationType
      LinkClickedNavigation: 0, FormSubmittedNavigation: 1,
      BackForwardNavigation: 2, ReloadNavigation: 3,
      FormResubmittedNavigation: 4, OtherNavigation: 5
    };

    Object.keys(enums).forEach(function(key) {
      compare(WebView[key], enums[key], key);
    });
  }
}
