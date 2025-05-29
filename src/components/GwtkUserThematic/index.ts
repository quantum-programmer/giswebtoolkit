import MapWindow from '~/MapWindow';

export function GwtkUserThematic( mapWindow: MapWindow ) {
    //регистрация задачи
    const taskDescription = {
        id: 'gwtkuserThematic.main',
        getConstructor: () => import('./task/GwtkUserThematicTask').then( m => m.default ),
        active: false,
        enabled: true,
        restartable: true,
        options: {
            icon: 'cartogram',
            title: 'userthematic.Cartogram',
            helpPage: 'thematic',
            storedData: true
        }
    };
    mapWindow.getTaskManager().registerTask( taskDescription );
}