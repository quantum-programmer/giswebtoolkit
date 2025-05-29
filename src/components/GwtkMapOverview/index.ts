import MapWindow from '~/MapWindow';

export function GwtkMapOverview(mapWindow: MapWindow) {

    if (!mapWindow.getMap().options.mapoverview || !(mapWindow.getMap().options.controls.includes('*') || mapWindow.getMap().options.controls.includes('mapoverview'))) {
        return;
    }

    //регистрация задачи
    const taskDescription = {
        id: 'gwtkmapoverview.main',
        getConstructor: () => import('./task/GwtkMapOverviewTask').then((module) => module.default),
        active: true,
        enabled: true,
        options: {
            icon: '',
            title: 'mapoverview.Map overview',
            pureTask: true
        }
    };
    mapWindow.getTaskManager().registerTask(taskDescription);
    mapWindow.getTaskManager().createTask('gwtkmapoverview.main');
}
