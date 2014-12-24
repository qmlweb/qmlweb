Rectangle {
  property var model;

  RemoteRow {
    model: parent.model
    attribute: 'reponse'
  }

  RemoteRow {
    model: parent.model
    attribute: 'coucou'
  }
}
