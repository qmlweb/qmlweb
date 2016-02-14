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

 import QtQuick 1.1

 Rectangle {
     id: page
     width: 420; height: 420

     Column {
         id: layout1
         y: 0

         Rectangle { color: "red"; width: 100; height: 50; border.color: "black"; radius: 15 }

         Rectangle {
             id: blueV1
             width: 100; height: 50
             color: "lightsteelblue"
             border.color: "black"
             radius: 15
         }

         Rectangle { color: "green"; visible: false; width: 100; height: 50; border.color: "black"; radius: 15 }

         Rectangle {
             id: blueV2
             width: 100; height: 50
             color: "lightsteelblue"
             border.color: "black"
             opacity: 0
             radius: 15
         }

         Rectangle { color: "orange"; width: 100; height: 50; border.color: "black"; radius: 15 }
     }

     Row {
         id: layout2
         y: 300

         Rectangle { color: "red"; width: 50; height: 100; border.color: "black"; radius: 15 }

         Rectangle {
             id: blueH1
             width: 50; height: 100
             color: "lightsteelblue"
             border.color: "black"
             radius: 15
         }

         Rectangle { color: "green"; visible: false; width: 50; height: 100; border.color: "black"; radius: 15 }

         Rectangle {
             id: blueH2
             width: 50; height: 100
             color: "lightsteelblue"
             border.color: "black"
             opacity: 0
             radius: 15
         }

         Rectangle { color: "orange"; width: 50; height: 100; border.color: "black"; radius: 15 }
     }

     Grid {
         x: 200; y: 0
         columns: 3
         flow: Grid.TopToBottom
         layoutDirection: Qt.RightToLeft

         Rectangle { color: "red"; width: 50; height: 50; border.color: "black"; radius: 15 }

         Rectangle {
             id: blueG1
             width: 50; height: 50
             color: "lightsteelblue"
             border.color: "black"
             radius: 15
         }

         Rectangle { color: "green"; width: 50; height: 50; border.color: "black"; radius: 15 }

         Rectangle {
             id: blueG2
             width: 50; height: 50
             color: "lightsteelblue"
             border.color: "black"
             radius: 15
         }

         Rectangle { color: "orange"; width: 50; height: 50; border.color: "black"; radius: 15 }

         Rectangle {
             id: blueG3
             width: 50; height: 50
             color: "lightsteelblue"
             border.color: "black"
             radius: 15
             scale: 2
             transform: [
                 Rotation {
                     axis.y: 1
                     angle: 45
                 },
                 Rotation {
                     angle: -15
                 },
                 Scale {
                     xScale: 0.5
                     yScale: 0.8
                 },
                 Translate {
                     x: 30
                     y: -10
                 }
            ]
            Text {
                anchors.centerIn: parent
                horizontalAlignment: Text.AlignHCenter
                text: "3D-\ntransform"
            }
         }

         Rectangle { color: "red"; width: 50; height: 50; border.color: "black"; radius: 15 }
         Rectangle { color: "green"; width: 50; height: 50; border.color: "black"; radius: 15 }
         Rectangle { color: "orange"; width: 50; height: 50; border.color: "black"; radius: 15 }
     }

     Flow {
         id: layout4
         x: 260; y: 250; width: 150
         layoutDirection: Qt.RightToLeft

         Rectangle { color: "red"; width: 50; height: 50; border.color: "black"; radius: 15 }

         Rectangle {
             id: blueF1
             width: 60; height: 50
             color: "lightsteelblue"
             border.color: "black"
             radius: 15
         }

         Rectangle { color: "green"; width: 30; height: 50; border.color: "black"; radius: 15 }

         Rectangle {
             id: blueF2
             width: 60; height: 50
             color: "lightsteelblue"
             border.color: "black"
             radius: 15
         }

         Rectangle { color: "orange"; width: 50; height: 50; border.color: "black"; radius: 15 }

         Rectangle {
             id: blueF3
             width: 40; height: 50
             color: "lightsteelblue"
             border.color: "black"
             radius: 15
         }

         Rectangle { color: "red"; width: 80; height: 50; border.color: "black"; radius: 15 }
     }

 }