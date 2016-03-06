#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include <QQmlContext>
#include <QUrl>

int main(int argc, char *argv[]) {
    if (argc <= 1) {
        printf("qmlscreenshot inputQmlFile outImageFile \n");
        return 1;
    }

    QString inputQmlFile,outImageFile;

    inputQmlFile = argc >=1 ? argv[1] : "";
    if (argc > 2 ) {
        outImageFile = argv[2];
    } else if (argc == 2) {
        outImageFile = inputQmlFile+".png";
    }

    QGuiApplication app(argc, argv);

    QQmlApplicationEngine engine;

    engine.rootContext()->setContextProperty("inputQmlFile", QVariant(QUrl::fromLocalFile(inputQmlFile)));
    engine.rootContext()->setContextProperty("outImageFile", QVariant(outImageFile));

    engine.load(QUrl("qrc:/main.qml"));

    return app.exec();
}
