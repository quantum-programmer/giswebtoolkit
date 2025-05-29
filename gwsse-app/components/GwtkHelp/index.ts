import MapWindow, {GwtkComponentPanel} from '~/MapWindow';

export function GwtkHelp( mapWindow: MapWindow ) {

    //регистрация задачи
    const taskDescription = {
        getConstructor: () => import('./task/GwtkHelp').then( ( module ) => module.default ),
        id: 'gwtkhelp.main',
        active: false,
        enabled: true,
        options: {
            icon: 'mdi-help-circle-outline',
            title: 'phrases.Help',
            specifiedToolbar: GwtkComponentPanel.LEFT_TOOLBAR,
            link: { href: 'https://help.gisserver.ru/v15/russian/giswebserverse/index.html', target: '_blank' }
        }
    };
    mapWindow.getTaskManager().registerTask( taskDescription );
}
