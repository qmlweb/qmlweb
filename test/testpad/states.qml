/****************************************************************************
**
** Copyright (C) 2013 Digia Plc and/or its subsidiary(-ies).
** Contact: http://www.qt-project.org/legal
**
** This file is part of the examples of the Qt Toolkit.
**
** $QT_BEGIN_LICENSE:BSD$
** You may use this file under the terms of the BSD license as follows:
**
** "Redistribution and use in source and binary forms, with or without
** modification, are permitted provided that the following conditions are
** met:
**   * Redistributions of source code must retain the above copyright
**     notice, this list of conditions and the following disclaimer.
**   * Redistributions in binary form must reproduce the above copyright
**     notice, this list of conditions and the following disclaimer in
**     the documentation and/or other materials provided with the
**     distribution.
**   * Neither the name of Digia Plc and its Subsidiary(-ies) nor the names
**     of its contributors may be used to endorse or promote products derived
**     from this software without specific prior written permission.
**
**
** THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
** "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
** LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
** A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
** OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
** SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
** LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
** DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
** THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
** (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
** OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE."
**
** $QT_END_LICENSE$
**
****************************************************************************/

import QtQuick 1.0

Rectangle {
    id: page
    width: 640; height: 480
    color: "#343434"

    Rectangle {
        id: userIcon
        x: topLeftRect.x; y: topLeftRect.y
        width: 46; height: 54; radius: 6
        color: "darkred"
    }

    Rectangle {
        id: topLeftRect

        anchors { left: parent.left; top: parent.top; margins: 20 }
        width: 46; height: 54
        color: "Transparent"; border.color: "Gray"; radius: 6

        // Clicking in here sets the state to the default state, returning the image to
        // its initial position
        MouseArea { anchors.fill: parent; onClicked: page.state = '' }
    }

    Rectangle {
        id: topRightRect

        anchors { top: parent.top; right: parent.right; margins: 20 }
        width: 46; height: 54
        color: "Transparent"; border.color: "Gray"; radius: 6

        // Clicking in here sets the state to 'bottomRight'
        MouseArea { anchors.fill: parent; onClicked: page.state = 'topRight' }
    }

    Rectangle {
        id: bottomRightRect

        anchors { right: parent.right; margins: 20 }
        y: 400
        width: 46; height: 54
        color: "Transparent"; border.color: "Gray"; radius: 6

        // Clicking in here sets the state to 'bottomRight'
        MouseArea { anchors.fill: parent; onClicked: page.state = 'bottomRight' }
    }

    Rectangle {
        id: bottomLeftRect

        anchors { left:parent.left; margins: 20 }
        y: 400
        width: 46; height: 54
        color: "Transparent"; border.color: "Gray"; radius: 6

        // Clicking in here sets the state to 'bottomLeft'
        MouseArea { anchors.fill: parent; onClicked: page.state = 'bottomLeft' }
    }

    Text {
        id: moveBL
        anchors.centerIn: parent
        color: "lightgrey"
        text: "Click here to move bottom left rect"

        MouseArea {
            id: midMA
            hoverEnabled: true
            anchors.fill: parent
            onClicked: bottomLeftRect.y = 100
        }
    }
    Text {
        anchors {
            top: moveBL.bottom
            topMargin: 5
            horizontalCenter: parent.horizontalCenter
        }
        color: "lightgrey"
        text: "Click here to move bottom right rect"

        MouseArea {
            anchors.fill: parent
            onClicked: bottomRightRect.y = 100
        }
    }

    states: [
        // In state 'topRight', move the image to topRightRect
        State {
            name: "topRight"
            PropertyChanges { target: userIcon; y: topRightRect.y; x: topRightRect.x}
        },
        // In state 'bottomRight', move the image to bottomRightRect
        State {
            name: "bottomRight"
            extend: "topRight"
            PropertyChanges { restoreEntryValues: false; target: userIcon; y: bottomRightRect.y }
        },

        // In state 'bottomLeft', move the image to bottomLeftRect
        State {
            name: "bottomLeft"
            when: midMA.containsMouse
            PropertyChanges { target: userIcon; explicit: true; y: bottomLeftRect.y  }
        }
    ]

    // Transitions define how the properties change when the item moves between each state
    transitions: [
        // When transitioning to 'middleRight' move x,y over a duration of 1 second,
        // with OutBounce easing function.
        Transition {
            from: ""; to: "topRight"
            NumberAnimation { properties: "x,y"; easing.type: Easing.OutBounce; duration: 5000 }
        },

        // When transitioning to 'bottomLeft' move x,y over a duration of 2 seconds,
        // with InOutQuad easing function.
        Transition {
            from: "topRight"; to: ""
            NumberAnimation { properties: "x,y"; easing.type: Easing.InOutCubic; duration: 2000 }
        },

        // For any other state changes move x,y linearly over duration of 200ms.
        Transition {
            to: ""
            NumberAnimation { properties: "x,y"; duration: 2000 }
        }
    ]
}