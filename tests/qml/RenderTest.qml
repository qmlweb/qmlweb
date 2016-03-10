import QtQuick 2.0

BaseTest {
    id: test
    delay: 200
    startTest: _startTest //temporary workaround
    function _startTest(){
        test.compareRender("", function(equal){
            expect(equal).toBe(true);
            testDone();
        });
    }
}
