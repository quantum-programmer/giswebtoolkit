import MapWindow from '~/MapWindow';

export function GwtkSearchByName(mapWindow: MapWindow) {

    const taskDescription = {
        id: 'gwtksearchbyname.main',
        getConstructor: () => import('./task/GwtkSearchByNameTask').then((module) => module.default),
        active: false,
        enabled: true,
        restartable: true,
        options: {
            icon: 'search_lightning',
            title: 'searchbyname.Search by name',
            helpPage: 'searchbyname',
            storedData: true
        }
    };

    mapWindow.getTaskManager().registerTask(taskDescription);

}
