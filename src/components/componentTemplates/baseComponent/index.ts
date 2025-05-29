import i18n from '@/plugins/i18n';
import MapWindow from '~/MapWindow';

const locale = {
    'basecomponent': {
        'Component name': 'Название компонента',
    }
};

export function BaseComponent(mapWindow: MapWindow) {
    i18n.mergeLocaleMessage('ru-ru', locale);
    
    const taskDescription = {
        id: 'basecomponent.main',
        getConstructor: () => import('./task/BaseComponentTask').then(m => m.default),
        active: false,
        enabled: true,
        options: {
            icon: 'mdi-check',
            title: i18n.tc('basecomponent.Component name')
        }
    };
    mapWindow.getTaskManager().registerTask(taskDescription);
}