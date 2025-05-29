import MapWindow, { GwtkComponentPanel } from '~/MapWindow';

export function GwtkFrameScalingOut( mapWindow: MapWindow ) {

    //регистрация задачи
    const taskDescription = {
        id: 'gwtkframescalingout.main',
        getConstructor: () => import('./task/GwtkFrameScalingOutTask').then( ( module ) => module.default ),
        active: false,
        enabled: true,
        options: {
            icon: 'scale-by-rect-minus',
            title: 'phrases.Scale down',
            specifiedToolbar: GwtkComponentPanel.RIGHT_BAR
        }
    };

    mapWindow.getTaskManager().registerTask( taskDescription );
}