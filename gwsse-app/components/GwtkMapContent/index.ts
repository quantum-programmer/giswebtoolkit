import AppWindow from '../../AppWindow';

export function GwtkMapContentGwsse(mapWindow: AppWindow) {

    //регистрация задачи
    const taskDescription = {
        id: 'gwtkmapcontent.main',
        getConstructor: () => import('./task/GwtkMapContentTask').then((module) => module.default),
        active: false,
        enabled: true,
        restartable: true,
        options: {
            icon: 'layers',
            title: 'mapcontent.Map content',
            helpPage: 'map_contents',
            storedData: true
        }
    };

    mapWindow.getTaskManager().registerTask(taskDescription);
}