import QtQuick 2.0

BaseTest {
    id: test
    delay: 200

    startTest: function(){
        test.compareRender("", function(equal){
            expect(equal).toBe(true);
            testDone();
        });
    }
}
