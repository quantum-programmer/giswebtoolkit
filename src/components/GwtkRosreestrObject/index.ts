import MapWindow from '~/MapWindow';

export function GwtkRosreestrObject( mapWindow: MapWindow ) {
    //регистрация задачи
    const taskDescription = {
        id: 'gwtkrosreestr.main',
        getConstructor: () => import('./task/GwtkRosreestrObjectTask').then( m => m.default ),
        active: false,
        enabled: true,
        restartable: true,
        options: {
            icon: 'rosreestr',
            title: 'rosreestcontent.Information of the state real estate cadastre',
            helpPage: ''
        }
    };
    mapWindow.getTaskManager().registerTask( taskDescription );
}