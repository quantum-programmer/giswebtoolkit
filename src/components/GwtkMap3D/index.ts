import MapWindow from '~/MapWindow';

export function GwtkMap3d( mapWindow: MapWindow ) {

    //регистрация задачи
    const taskDescription = {
        getConstructor: () => import('./task/GwtkMap3dTask').then( ( module ) => module.default ),
        id: 'gwtkmap3d.main',
        active: false,
        enabled: true,
        options: {
            icon: '3d-view',
            title: 'phrases.3D view',
        }
    };
    mapWindow.getTaskManager().registerTask( taskDescription );

    new GWTK.Map3d( mapWindow.getMap() );


}