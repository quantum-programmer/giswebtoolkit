import MapWindow from '~/MapWindow';


export function GwtkMapObjectTooltip( mapWindow: MapWindow ): void {

    //регистрация задачи
    const taskDescription = {
        id: 'gwtkmapobjecttooltip.main',
        getConstructor: () => import('./task/GwtkMapObjectTooltipTask').then( m => m.default ),
        active: false,
        enabled: true,
        options: {
            pureTask: true,
        }
    };
    mapWindow.getTaskManager().registerTask( taskDescription );

    mapWindow.getTaskManager().createTask( 'gwtkmapobjecttooltip.main' );
}