import MapWindow from '~/MapWindow';

export function GwtkDocumentViewer(mapWindow: MapWindow) {

    //регистрация задачи
    const taskDescription = {
        id: 'gwtkdocumentviewer.main',
        getConstructor: () => import('./task/GwtkDocumentViewerTask').then((module) => module.default),
        active: false,
        enabled: true,
        restartable: false,
        options: {
            pureTask: !(mapWindow.getMap().options.controls.includes( '*' ) || mapWindow.getMap().options.controls.includes( 'documentviewer' )),
            icon: 'mdi-text-box-multiple-outline',
            title: 'documentviewer.Document viewer',
            storedData: false,
            helpPage: 'document_viewer'
        }
    };

    mapWindow.getTaskManager().registerTask(taskDescription);

}
