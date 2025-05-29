import MapWindow, { GwtkComponentPanel } from '~/MapWindow';

export function GwtkFrameScalingIn( mapWindow: MapWindow ) {

    //регистрация задачи
    const taskDescription = {
        id: 'gwtkframescalingin.main',
        getConstructor: () => import('./task/GwtkFrameScalingInTask').then( ( module ) => module.default ),
        active: false,
        enabled: true,
        options: {
            icon: 'scale-by-rect-plus',
            title: 'phrases.Scale up',
            specifiedToolbar: GwtkComponentPanel.RIGHT_BAR
        }
    };

    mapWindow.getTaskManager().registerTask( taskDescription );
}