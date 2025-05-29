import MapWindow from '~/MapWindow';

export function GwtkMapRoute( mapWindow: MapWindow ) {
//регистрация задачи
    const taskDescription = {
        id: 'gwtkmaproute.main',
        getConstructor: () => import('./task/GwtkMapRouteTask').then( m => m.default ),
        active: false,
        enabled: !!mapWindow.getMap().options.routecontrol,
        restartable: true,
        options: {
            icon: 'route',
            title: 'phrases.Route',
            helpPage: 'build_route',
            storedData: true
        }
    };
    mapWindow.getTaskManager().registerTask( taskDescription );
}