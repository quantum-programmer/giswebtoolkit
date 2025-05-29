import {GwtkComponentPanel} from '~/MapWindow';
import AppWindow from '../../AppWindow';

export function GwtkGeoDB(mapWindow: AppWindow) {

    const params = mapWindow.appParams;

    //регистрация задачи
    const taskDescription = {
        getConstructor: () => import('./task/GwtkGeoDB').then((module) => module.default),
        id: 'gwtkgeodb.main',
        active: false,
        enabled: true,
        options: {
            icon: 'mdi-database-outline',
            title: params.geoDB.title,
            specifiedToolbar: GwtkComponentPanel.LEFT_TOOLBAR,
            link: {
                href: window.location.href.split('/').slice(0, window.location.href.split('/').length - 2).join('/') + params.geoDB.url,
                target: '_blank'
            }
        }
    };
    mapWindow.getTaskManager().registerTask(taskDescription);
}
