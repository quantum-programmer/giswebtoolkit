import MapWindow from '~/MapWindow';

export function GwtkNspdObject( mapWindow: MapWindow ) {
    //регистрация задачи
    const taskDescription = {
        id: 'gwtknspd.main',
        getConstructor: () => import('./task/GwtkNspdObjectTask').then( m => m.default ),
        active: false,
        enabled: true,
        restartable: true,
        options: {
            icon: 'rosreestr',
            title: 'nspd.Information of the state real estate cadastre',
            helpPage: ''
        }
    };
    mapWindow.getTaskManager().registerTask( taskDescription );
}