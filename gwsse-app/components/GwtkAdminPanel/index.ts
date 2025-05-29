import {GwtkComponentPanel} from '~/MapWindow';
import GISWebServerSEService from '../../service/GISWebServerSEService';
import {CommonAppWindow} from '../../Types';

export function GwtkAdminPanel(mapWindow: CommonAppWindow) {

    const projectId = mapWindow.getMap().options.id;

    const href = `${new GISWebServerSEService().adminPanelLink}?projectid=${projectId}`;

    //регистрация задачи
    const taskDescription = {
        getConstructor: () => import('./task/GwtkAdminPanel').then((module) => module.default),
        id: 'gwtkadmin.main',
        active: false,
        enabled: true,
        options: {
            icon: 'mdi-cog-outline',
            title: 'gwsse.Administrator',
            specifiedToolbar: GwtkComponentPanel.LEFT_TOOLBAR,
            link: {href, target: '_self'}
        }
    };
    mapWindow.getTaskManager().registerTask(taskDescription);
}
