ListModel {
  RestModel {
    property var resources

    id:  model
    url: '/laresource/index'

    onFetched: {
      parent.clear();
      for (var i = 0 ; i < resources.length ; ++i)
        parent.append(resources[i]);
    }
  }
}
