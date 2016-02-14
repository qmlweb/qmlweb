import Qt 4.7
Rectangle {
    id: base
    width: 1024; height: 600;
    
    // Slide number
    property int slide: 0

    // Changes slide
    function changeSlide(forward) {
        var slides = [welcome, intro, status, demos, conclusion];

        // Change slide number
        var prevSlide = slide;
        forward ? slide++ : slide--;
        // 0 <= slide < slides.length
        slide = Math.max(0, Math.min(slide, slides.length - 1));

        // Hide all but target slide
        for (var i in slides) {
            slides[i].visible = false;
        }
        slides[slide].visible = true;
        slides[prevSlide].visible = true;

        // Show/hide next/prev buttons
        previmg.visible = (slide != 0);
        nextimg.visible = (slide != slides.length - 1);
        
        // Update slide status text
        state.text = (slide + 1) + " of " + slides.length + " ";
        console.log(state.text);
        
        if (curSlideAnim.running) {
            curSlideAnim.complete();
        }
        if (prevSlideAnim.running) {
            prevSlideAnim.complete();
        }
        
        // Animate the change
        if (prevSlide != slide) {
            curSlideAnim.target = slides[slide];
            curSlideAnim.property = "x";
            curSlideAnim.to = 0;
            prevSlideAnim.target = slides[prevSlide];
            prevSlideAnim.property = "x";
            prevSlideAnim.from = 0;

            if (forward) {
                curSlideAnim.from = base.width;
                prevSlideAnim.to = -base.width;
            } else {
                curSlideAnim.from = -base.width;
                prevSlideAnim.to = base.width;
            }

            curSlideAnim.start();
            prevSlideAnim.start();
        }
    }

    // Animations
    NumberAnimation {
        id: curSlideAnim
        duration: 500
    }
    NumberAnimation {
        id: prevSlideAnim
        duration: 500
    }


    // Previous and next images
    // (images by tango project)
    Image {
        id: previmg
        visible: false
        source: "images/go-previous.png"
        anchors.bottom: base.bottom
        anchors.left: base.left
        MouseArea {
            anchors.fill: parent
            onClicked: base.changeSlide(false);
        }
    }
    Image {
        id: nextimg
        source: "images/go-next.png"
        anchors.bottom: base.bottom;
        anchors.right: base.right;
        MouseArea {
            anchors.fill: parent
            onClicked: base.changeSlide(true);
        }
    }
    // Status text (X of Y)
    Text {
        id: state
        anchors.bottom: parent.bottom;
        anchors.right: nextimg.left;
    }

    // Welcome slide
    Item {
        id: welcome
        visible: true
        width: base.width; height: base.height;
        Text {
            text: "QMLWEB Project"
            font.pointSize: 64
            anchors.centerIn: parent
        }
        Text {
            text: "Porting QML to web browser"
            font.pointSize: 32
            y: base.height / 3 * 2
            anchors.horizontalCenter: parent.horizontalCenter
        }
        Text {
            // text: "" /* Inject presenter information here */
            font.pointSize: 24
            anchors.horizontalCenter: parent.horizontalCenter
            anchors.bottom: parent.bottom
        }
    }
    
    // Intro slide
    Item {
        id: intro
        visible: false
        Text { 
            text: "About QMLWEB project"
            font.pointSize: 48
            color: "green"
            x: 20
            Text {
                text: "- Hobby project"
                font.pointSize: 32
                anchors.top: parent.bottom; anchors.left: parent.left
                Text {
                text: "- Goal: Port QML to web browser"
                font.pointSize: 32
                anchors.top: parent.bottom; anchors.left: parent.left
                Text {
                text: "- Idea & first demos by Pietu Pohjalainen"
                font.pointSize: 32
                anchors.top: parent.bottom; anchors.left: parent.left
                Text {
                text: "- Current code by Lauri Paimen and Anton Kreuzkamp"
                width: base.width
                wrapMode: Text.Wrap
                font.pointSize: 32
                anchors.top: parent.bottom; anchors.left: parent.left

                }
                }
                }
            }
        }
    }
    
    // Status slide
    Item {
        id: status
        visible: false
        Text {
            text: "Current status"
            font.pointSize: 48
            color: "green"
            x: 20
            Text {
                text: "- Source at https://gitorious.org/qmlweb"
                font.pointSize: 32
                anchors.top: parent.bottom; anchors.left: parent.left

                Text {
                text: "- 3200 lines of code (1350 from UglifyJS)"
                font.pointSize: 32
                anchors.top: parent.bottom; anchors.left: parent.left


                Text {
                text: "- Uses HTML5 (no plugins required)"
                font.pointSize: 32
                anchors.top: parent.bottom; anchors.left: parent.left

                Text {
                text: "   > All major browsers supported"
                font.pointSize: 24
                anchors.top: parent.bottom; anchors.left: parent.left
                
                Text {
                text: "   > Windows, Mac, Linux, N9(00), iPhone, Android, PS3"
                font.pointSize: 24
                anchors.top: parent.bottom; anchors.left: parent.left
/*
                Text {
                text: "- Basics of"
                font.pointSize: 32
                anchors.top: parent.bottom; anchors.left: parent.left

                Text {
                text: "   > QML parser"
                font.pointSize: 24
                anchors.top: parent.bottom; anchors.left: parent.left

                Text {
                text: "   > QML binding, scoping and anchoring"
                font.pointSize: 24
                anchors.top: parent.bottom; anchors.left: parent.left

                Text {
                text: "   > Text, Rectangle, Image, MouseArea, Item"
                font.pointSize: 24
                anchors.top: parent.bottom; anchors.left: parent.left

                Text {
                text: "      Timer, [Number|Sequential]Animation"
                font.pointSize: 24
                anchors.top: parent.bottom; anchors.left: parent.left

                }
                }
                }
                }
                }*/
                }
                }
                }
                }                
            }
        }
    }

    // Demo slide
    Item {
        id: demos
        visible: false
        Text {
            text: "Demos"
            font.pointSize: 48
            color: "green"
            x: 20
            Text {
                text: "- This slideset is a QML application"
                font.pointSize: 32
                anchors.top: parent.bottom; anchors.left: parent.left
                Text {
                    text: "   > Start up your favorite browser and go to:"
                    font.pointSize: 24;
                    anchors.top: parent.bottom; anchors.left: parent.left

                    Text {
                    text: "        tinyurl.com/qmlslides"
                    font.pointSize: 24; color: "blue"
                    anchors.top: parent.bottom; anchors.left: parent.left

                    Text {
                    text: "   > Also check other demos from drop-down box"
                    font.pointSize: 24
                    anchors.top: parent.bottom; anchors.left: parent.left

                    Text {
                    text: "- Write your own web-ran QML at"
                    font.pointSize: 32
                    anchors.top: parent.bottom; anchors.left: parent.left

                    Text {
                    text: "   http://lauri.paimen.info/qmlweb/test/testpad/testpad.html"
                    font.pointSize: 24; color: "blue"
                    anchors.top: parent.bottom; anchors.left: parent.left

                    }
                    }
                    }
                    }
                }
            }
        }
    }
    
    // Future slide (unused)
    Item {
        id: future
        visible: false
        Text {
            text: "Future"
            font.pointSize: 48
            color: "green"
            x: 20
            Text {
                text: "- Redesign binding, scoping and anchoring"
                font.pointSize: 32
                anchors.top: parent.bottom; anchors.left: parent.left

                    Text {
                    text: "- Complete the parser"
                    font.pointSize: 32
                    anchors.top: parent.bottom; anchors.left: parent.left

                    Text {
                    text: "- Transition to WebGL?"
                    font.pointSize: 32
                    anchors.top: parent.bottom; anchors.left: parent.left

                    Text {
                    text: "- Elements and features (rotation etc)"
                    font.pointSize: 32
                    anchors.top: parent.bottom; anchors.left: parent.left

                    Text {
                    text: "- QML minifier (for networked QML apps)"
                    font.pointSize: 32
                    anchors.top: parent.bottom; anchors.left: parent.left
                    }
                    }
                    }
                }
            }
        }
    }

    // Conclusion slide
    Item {
        id: conclusion
        visible: false
        width: base.width; height: base.height;
        Text {
            text: "Questions?"
            font.pointSize: 48
            color: "green"
            anchors.centerIn: parent
            Text {
                text: "lauri@paimen.info"
                font.pointSize: 32
                color: "blue"
                anchors.top: parent.bottom
                anchors.horizontalCenter: parent.horizontalCenter
                Text {
                text: "https://gitorious.org/qmlweb"
                font.pointSize: 24
                anchors.top: parent.bottom;
                anchors.horizontalCenter: parent.horizontalCenter
                }
            }
        }
    }

}
