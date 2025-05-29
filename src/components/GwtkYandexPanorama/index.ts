import MapWindow from '~/MapWindow';

export function GwtkYandexPanorama( mapWindow: MapWindow ) {
    //регистрация задачи
    const taskDescription = {
        id: 'gwtkyandexpanorama.main',
        getConstructor: () => import('./task/GwtkYandexPanoramaTask').then( m => m.default ),
        active: false,
        enabled: true,
        options: {
            icon: 'panorama360',
            title: 'yandexpanorama.Yandex panorama'
        }
    };
    mapWindow.getTaskManager().registerTask( taskDescription );
}