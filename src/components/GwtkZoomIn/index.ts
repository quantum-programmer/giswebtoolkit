import MapWindow, { GwtkComponentPanel } from '~/MapWindow';

export function GwtkZoomIn( mapWindow: MapWindow ) {

    //регистрация задачи
    const taskDescription = {
        getConstructor: () => import('./task/GwtkZoomIn').then( ( module ) => module.default ),
        id: 'scaler_button-plus',
        active: false,
        enabled: true,
        options: {
            icon: 'plus',
            title: 'phrases.Zoom in',
            specifiedToolbar: GwtkComponentPanel.RIGHT_BAR
        }
    };

    mapWindow.getTaskManager().registerTask( taskDescription );
}