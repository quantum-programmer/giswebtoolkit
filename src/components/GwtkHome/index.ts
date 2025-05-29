import MapWindow from '~/MapWindow';

export function GwtkHome( mapWindow:MapWindow ) {
    //регистрация задачи
    const taskDescription = {
        id: 'gwtkhome.main',
        getConstructor: () => import('./task/GwtkHomeTask').then( (module)=> module.default ),
        active: false,
        enabled: true,
        options: {
            icon: 'mdi-home-outline',
            title: 'rgis.Home'
        }
    };

    mapWindow.getTaskManager().registerTask( taskDescription );
    mapWindow.getTaskManager().createTask( 'gwtkhome.main' );
}