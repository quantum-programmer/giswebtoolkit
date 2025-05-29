import MapWindow, { GwtkComponentPanel } from '~/MapWindow';

export function GwtkZoomOut( mapWindow: MapWindow ) {

    //регистрация задачи
    const taskDescription = {
        getConstructor: () => import('./task/GwtkZoomOut').then( ( module ) => module.default ),
        id: 'scaler_button-minus',
        active: false,
        enabled: true,
        options: {
            icon: 'minus',
            title: 'phrases.Zoom out',
            specifiedToolbar: GwtkComponentPanel.RIGHT_BAR
        }
    };

    mapWindow.getTaskManager().registerTask( taskDescription );
}