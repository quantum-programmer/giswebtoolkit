import MapWindow from '~/MapWindow';

export function GwtkMapObject( mapWindow: MapWindow ) {
    //регистрация задачи
    const taskDescription = {
        id: 'gwtkmapobject.main',
        getConstructor: () => import('./task/GwtkMapObjectTask').then( ( module ) => module.default ),
        active: false,
        enabled: true,
        options: {
            pureTask: true,
            title: 'phrases.Map objects',
            helpPage: 'map_object_info',
            storedData: true
        }
    };

    mapWindow.getTaskManager().registerTask( taskDescription );
}