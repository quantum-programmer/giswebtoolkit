import i18n from '@/plugins/i18n';
import MapWindow from '~/MapWindow';

const localeRu = {
    'gwtkbackgroundlayers': {
        'Cartographic backgrounds': 'Картографические подложки',
        'Component is not configured': 'Компонент не настроен',
        'Options': 'Параметры',

    }
};

const localeEn = {
    'gwtkbackgroundlayers': {
        'Cartographic backgrounds': 'Cartographic backgrounds',
        'Component is not configured': 'Component is not configured',
        'Options': 'Options',

    }
};

export function GwtkBackgroundLayers(mapWindow: MapWindow) {
    i18n.mergeLocaleMessage('ru-ru', localeRu);
    i18n.mergeLocaleMessage('en-us', localeEn);

    const taskDescription = {
        id: 'gwtkbackgroundlayers.main',
        getConstructor: () => import('./task/GwtkBackgroundLayersTask').then(m => m.default),
        active: false,
        enabled: true,
        restartable: true,
        options: {
            icon: 'layers-back-ground',
            title: 'gwtkbackgroundlayers.Cartographic backgrounds',
            storedData: true
        }
    };
    mapWindow.getTaskManager().registerTask(taskDescription);
}
