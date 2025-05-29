import MapWindow from '~/MapWindow';

export function GwtkBuildFloodZone(mapWindow: MapWindow) {

    const taskDescription = {
        id: 'gwtkbuildfloodzone.main',
        getConstructor: () => import('./task/GwtkBuildFloodZoneTask').then(m => m.default),
        active: false,
        enabled: true,
        restartable: true,
        options: {
            icon: 'mdi-waves',
            title: 'floodzone.Build flood zone',
            helpPage: 'map_floodzone'
        }
    };

    mapWindow.getTaskManager().registerTask(taskDescription);

}
