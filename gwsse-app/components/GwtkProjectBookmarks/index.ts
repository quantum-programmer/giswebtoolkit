import MapWindow, {GwtkComponentPanel} from '~/MapWindow';

export function GwtkProjectBookmarks(mapWindow: MapWindow) {

    const taskDescription = {
        id: 'gwtkprojectbookmarks.main',
        getConstructor: () => import('./task/GwtkProjectBookmarksTask').then( m => m.default ),
        active: false,
        enabled: true,
        restartable: false,
        options: {
            icon: 'mdi-bookmark-box-outline',
            title: 'bookmarks.Project bookmarks',
            //helpPage: 'map_marks',
            storedData: true,
            specifiedToolbar: GwtkComponentPanel.LEFT_TOOLBAR
        }
    };

    mapWindow.getTaskManager().registerTask( taskDescription );

}