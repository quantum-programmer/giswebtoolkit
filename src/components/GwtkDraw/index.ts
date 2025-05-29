import MapWindow from '~/MapWindow';

export function GwtkDraw(mapWindow: MapWindow): void {
    const taskDescription = {
        id: 'gwtkdraw.main',
        getConstructor: () => import('./task/GwtkDrawTask').then(m => m.default),
        active: true,
        enabled: true,
        options: {
            pureTask: true
        }
    };
    mapWindow.getTaskManager().registerTask(taskDescription);
    mapWindow.getTaskManager().createTask('gwtkdraw.main');
}
