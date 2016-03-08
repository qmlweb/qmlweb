Describe {
    id: test
    delay: 150
    expectedCalls: 5
    startupTimer.onTriggered: {
      console.log("test screenshot")
      test.compareRender("", function(equal){
          expect(equal).toBe(true);
      });
    }
}
