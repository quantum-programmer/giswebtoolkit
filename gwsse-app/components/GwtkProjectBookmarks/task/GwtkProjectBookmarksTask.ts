/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Задача Закладки проекта                         *
 *                                                                  *
 *******************************************************************/

import Task from '~/taskmanager/Task';
import {GwtkComponentDescriptionPropsData} from '~/types/Types';
import MapWindow from '~/MapWindow';
import GwtkProjectBookmarksWidget from './GwtkProjectBookmarksWidget.vue';
import {BrowserService} from '~/services/BrowserService';
import {
    PROJECT_SETTINGS_ACTIVE_TASK_LIST,
    PROJECT_SETTINGS_VISIBLE_MODELS,
    VIEW_SETTINGS_PARAMS3D
} from '~/utils/WorkspaceManager';
import {LogEventType} from '~/types/CommonTypes';
import i18n from '@/plugins/i18n';
import GeoPoint from '~/geo/GeoPoint';
import {MapPoint} from '~/geometry/MapPoint';
import GISWebServerSEService from './../../../service/GISWebServerSEService';
import AppWindow from '../../../AppWindow';
import {
    BookmarkSearch,
    BookmarksUpdate,
    BookmarkValue,
    ProjectBookmarksRequestResult,
    ProjectBookmarksRequestResultItem
} from '../../../service/GISWebServerSEService/Types';


export const ADD_BOOKMARK = 'gwtkprojectbookmarks.addbookmark';
export const SET_SORT_FILTER = 'gwtkprojectbookmarks.setsortfilter';
export const SET_SEARCH_VALUE = 'gwtkprojectbookmarks.setsearchvalue';
export const GET_NEXT_PORTION = 'gwtkprojectbookmarks.getnextportion';
export const SET_ACTIVE_BOOKMARK = 'gwtkprojectbookmarks.setactivebookmark';
export const MOVE_TO_BOOKMARK = 'gwtkprojectbookmarks.movetobookmark';
export const CREATE_SHARE_URL = 'gwtkprojectbookmarks.createshareurl';
export const SET_PUBLIC_ACCESS = 'gwtkprojectbookmarks.setpublicaccess';
export const DELETE_BOOKMARK = 'gwtkprojectbookmarks.deletebookmark';

export type GwtkProjectBookmarksTaskState = {
    [ADD_BOOKMARK]: string;
    [SET_SORT_FILTER]: BookmarksSortType;
    [SET_SEARCH_VALUE]: string;
    [GET_NEXT_PORTION]: undefined;
    [SET_ACTIVE_BOOKMARK]: BookmarkItem;
    [MOVE_TO_BOOKMARK]: BookmarkItem;
    [CREATE_SHARE_URL]: string;
    [SET_PUBLIC_ACCESS]: BookmarkItem;
    [DELETE_BOOKMARK]: BookmarkItem;
};

type ExtentParameters = {
    scale: number;
    latitude: number | string;
    longitude: number | string;
    layers?: string[];
    projectId?: string;
    activeTask?: string;
    selectedObjects?: {
        service: string;
        layerId: string;
        objectGid: string;
    }[];
    map3d?: {
        incline: number;
        rotate: number;
        models3d: string[];
    };
};

export type BookmarkItem = {
    id: string;
    guid: string;
    title: string;
    projectId: string;
    createTime: string;
    isPublic: boolean;
    isSelected: boolean;
};

type WidgetParams = {
    setState: GwtkProjectBookmarksTask['setState'];
    bookmarksList: BookmarkItem[];
    bookmarksTotal: number;
    bookmarkSearch: BookmarkSearch;
    selectedSortType: BookmarksSortType;
    sortTypes: BookmarksSortType[];
    searchValue: string;
    isAuth: boolean;
};

export type BookmarksSortType = {
    text: string;
    field: string;
    type: string;
};

type WorkSpaceData = {
    selectedSortType: BookmarksSortType;
}

/**
 * Задача "Закладки проекта"
 * @class GwtkProjectBookmarksTask
 * @extends Task
 */
export default class GwtkProjectBookmarksTask extends Task {

    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & WidgetParams}
     */
    private readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;

    /**
     * Ссылка на выполняющий файл
     * @private
     * @readonly
     * @property urlToService {String}
     */
    private readonly urlToService = new GISWebServerSEService().getDefaults().url + 'query.php';

    protected workspaceData: WorkSpaceData = {
        selectedSortType: {
            text: i18n.t('bookmarks.By name') + ' - ' + i18n.t('bookmarks.Descending'),
            field: 'title',
            type: 'DESC'
        }
    };

    /**
     * @constructor GwtkProjectBookmarksTask
     * @param mapVue {MapWindow} Экземпляр окна карты
     * @param id {string} Идентификатор задачи
     */
    constructor(mapVue: MapWindow, id: string) {
        super(mapVue, id);

        this.widgetProps = {
            description: this.mapWindow.getTaskManager().getTaskDescription(this.id),
            taskId: this.id,
            setState: this.setState.bind(this),
            bookmarksList: [],
            bookmarksTotal: 0,
            bookmarkSearch: {
                searchList: [],
                strict: true,
                limit: 10,
                offset: 0,
                order: []
            },
            selectedSortType: {
                text: i18n.t('bookmarks.By name') + ' - ' + i18n.t('bookmarks.Descending'),
                field: 'title',
                type: 'DESC'
            },
            sortTypes: [],
            searchValue: '',
            isAuth: this.isAuth()
        };

    }

    setup() {
        super.setup();
        if (!this.workspaceData) {
            this.workspaceData = {
                selectedSortType: this.widgetProps.selectedSortType
            };
        } else {
            this.widgetProps.selectedSortType = this.workspaceData.selectedSortType;
        }

        this.widgetProps.bookmarkSearch.order.splice(0);
        this.widgetProps.bookmarkSearch.order.push({
            field: this.widgetProps.selectedSortType.field,
            type: this.widgetProps.selectedSortType.type
        });

        this.fillSortList();
        this.getBookmarks();
    }

    createTaskPanel() {
        // регистрация Vue компонента
        const name = 'GwtkProjectBookmarksWidget';
        const source = GwtkProjectBookmarksWidget;

        this.mapWindow.registerComponent(name, source);

        // Создание Vue компонента
        this.mapWindow.createWidget(name, this.widgetProps);

        // Добавить в список для удаления при деактивации
        this.addToPostDeactivationList(this.widgetProps);
    }

    /**
     * Установить параметры работы
     * @method setState
     */
    setState<K extends keyof GwtkProjectBookmarksTaskState>(key: K, value: GwtkProjectBookmarksTaskState[K]) {
        switch (key) {
            case ADD_BOOKMARK:
                this.addBookmark(value as string);
                break;
            case SET_SORT_FILTER:
                this.widgetProps.selectedSortType = value as BookmarksSortType;
                this.widgetProps.bookmarkSearch.order.splice(0);
                this.widgetProps.bookmarkSearch.order.push({
                    field: this.widgetProps.selectedSortType.field,
                    type: this.widgetProps.selectedSortType.type
                });

                this.workspaceData.selectedSortType = value as BookmarksSortType;
                this.writeWorkspaceData(true);

                this.widgetProps.bookmarksList.splice(0);
                this.getBookmarks();
                break;
            case SET_SEARCH_VALUE:
                this.widgetProps.searchValue = value as string;
                this.widgetProps.bookmarkSearch.searchList.splice(0);
                this.widgetProps.bookmarkSearch.offset = 0;
                if (this.widgetProps.searchValue !== '') {
                    this.widgetProps.bookmarkSearch.searchList.push({
                        field: 'title',
                        condition: 'LIKE',//'GLOB',
                        value: '%' + this.widgetProps.searchValue + '%'//'*' + this.widgetProps.searchValue + '*'
                    });
                }

                this.widgetProps.bookmarksList.splice(0);
                this.getBookmarks();
                break;
            case GET_NEXT_PORTION:
                this.widgetProps.bookmarkSearch.offset = this.widgetProps.bookmarkSearch.offset + 10;

                this.getBookmarks();
                break;
            case SET_ACTIVE_BOOKMARK:
                const selectedBookmark = value as BookmarkItem;
                this.widgetProps.bookmarksList.forEach((bookmark) => {
                    if (bookmark.id === selectedBookmark.id && bookmark.guid === selectedBookmark.guid && !bookmark.isSelected) {
                        bookmark.isSelected = true;
                    } else if (bookmark.id === selectedBookmark.id && bookmark.guid === selectedBookmark.guid && bookmark.isSelected) {
                        bookmark.isSelected = false;
                    } else {
                        bookmark.isSelected = false;
                    }
                });
                break;
            case MOVE_TO_BOOKMARK:
                this.moveToBookmark(value as BookmarkItem);
                break;
            case CREATE_SHARE_URL:
                const href = this.map.getShareLocation();
                const mapLink = href + '?projectid=' + value as string;

                // скопировать в буфер обмена
                BrowserService.copyToClipboard(mapLink).then(() => {
                    this.mapWindow.addSnackBarMessage(i18n.tc('phrases.Link copied to clipboard'));
                }).catch(() => {
                    this.mapWindow.addSnackBarMessage(i18n.tc('phrases.Copy failed'));
                });
                break;
            case SET_PUBLIC_ACCESS:
                this.setPublicAccess(value as BookmarkItem);
                break;
            case DELETE_BOOKMARK:
                this.deleteBookmark(value as BookmarkItem);
                break;
            default:
                break;
        }
    }

    /**
     * Получить список закладок
     * @private
     * @method getBookmarks
     */
    private getBookmarks() {
        const requestService = new GISWebServerSEService();
        requestService.getBookmarksList(this.widgetProps.bookmarkSearch).then((response) => {
            if (response.data) {
                if (response.data.status && response.data.status === 200) {
                    const responseData = response.data.data as ProjectBookmarksRequestResult;
                    this.widgetProps.bookmarksTotal = responseData.total;
                    responseData.result.forEach((result) => {
                        this.widgetProps.bookmarksList.push({
                            id: result.id as string,
                            guid: result.guid as string,
                            title: result.title as string,
                            projectId: result.original_project_id as string,
                            createTime: result.create_time as string,
                            isPublic: parseInt(result.is_public as string, 10) == 1,
                            isSelected: false
                        });
                    });
                } else {
                    this.map.writeProtocolMessage({
                        text: response.data.errorCode.message as string,
                        type: LogEventType.Error
                    });
                }
            } else {
                this.map.writeProtocolMessage({text: response.error as string, type: LogEventType.Error});
            }
        }).catch((error) => {
            this.map.writeProtocolMessage({text: error, type: LogEventType.Error});
        });
    }

    /**
     * Перейти по закладке
     * @private
     * @method moveToBookmark
     * @param bookmark {BookmarkItem}
     */
    private moveToBookmark(bookmark: BookmarkItem) {
        this.mapWindow.getTaskManager().showOverlayPanel();
        const selectFirst: BookmarkValue[] = [
            {fieldName: 'guid', fieldValue: bookmark.guid}
        ];
        const requestService = new GISWebServerSEService();
        requestService.findFirstBookmark(selectFirst).then((response) => {
            if (response.data) {
                if (response.data.status && response.data.status === 200 && response.data.data) {
                    if (typeof response.data.data !== 'string' && response.data.data?.result) {

                        this.setState(SET_ACTIVE_BOOKMARK, bookmark);

                        const result = response.data.data?.result as ProjectBookmarksRequestResultItem;
                        const parameters = JSON.parse(result.parameters as string) as ExtentParameters;

                        if (parameters.projectId && parameters.projectId !== this.map.options.id) {
                            const requestProjectService = new GISWebServerSEService({url: ''});
                            requestProjectService.getProjectDescription({
                                cmd: 'projparams',
                                projid: parameters.projectId
                            }).then((result) => {
                                if (result.data && result.data.options) {
                                    const currentOptions = result.data.options;
                                    this.map.workspaceManager.close().then(() => {
                                        (this.mapWindow as AppWindow).initMapOptions(currentOptions).then(() => {
                                            this.setBookmarkBounds(parameters.latitude as string, parameters.longitude as string);
                                            this.setBookmarkZoom(parameters.scale);
                                            this.setBookmarkActiveTask(parameters.activeTask);
                                            this.setBookmarkVisibleLayers(parameters.layers);
                                        });
                                    });
                                }
                            });
                        } else {
                            this.setBookmarkBounds(parameters.latitude as string, parameters.longitude as string);
                            this.setBookmarkZoom(parameters.scale);
                            this.setBookmarkActiveTask(parameters.activeTask);
                            this.setBookmarkVisibleLayers(parameters.layers);
                        }
                    } else {
                        this.map.writeProtocolMessage({
                            text: response.data.errorCode.message as string,
                            type: LogEventType.Error
                        });
                    }
                } else {
                    this.map.writeProtocolMessage({
                        text: response.data.errorCode.message as string,
                        type: LogEventType.Error
                    });
                }
            } else {
                this.map.writeProtocolMessage({text: response.error as string, type: LogEventType.Error});
            }
            this.mapWindow.getTaskManager().removeOverlayPanel();
        }).catch((error) => {
            this.mapWindow.getTaskManager().removeOverlayPanel();
            this.map.writeProtocolMessage({text: error, type: LogEventType.Error});
        });
    }

    /**
     * Устоновить публичный доступ закладке
     * @private
     * @method setPublicAccess
     * @param bookmark {BookmarkItem}
     */
    private setPublicAccess(bookmark: BookmarkItem) {
        const updateParams: BookmarksUpdate = {
            data: [
                {
                    fieldName: 'is_public',
                    fieldValue: bookmark.isPublic ? '0' : '1'
                }
            ],
            rules: [
                {
                    fieldName: 'id',
                    fieldValue: bookmark.id
                },
                {
                    fieldName: 'guid',
                    fieldValue: bookmark.guid
                }
            ],
            strict: true
        };
        const requestService = new GISWebServerSEService();
        requestService.updateBookmark(updateParams).then((response) => {
            if (response.data) {
                if (response.data.status && response.data.status === 200 && response.data.data) {
                    if (response.data.data === 'Record is updated') {
                        this.widgetProps.bookmarksList.forEach((bookmarkItem) => {
                            if (bookmarkItem.id === bookmark.id && bookmarkItem.guid === bookmark.guid) {
                                bookmarkItem.isPublic = !bookmark.isPublic;
                            }
                        });
                    } else {
                        this.map.writeProtocolMessage({
                            text: response.data.errorCode.message as string,
                            type: LogEventType.Error
                        });
                    }
                } else {
                    this.map.writeProtocolMessage({
                        text: response.data.errorCode.message as string,
                        type: LogEventType.Error
                    });
                }
            } else {
                this.map.writeProtocolMessage({text: response.error as string, type: LogEventType.Error});
            }
        }).catch((error) => {
            this.map.writeProtocolMessage({text: error, type: LogEventType.Error});
        });
    }

    /**
     * Добавить закладку в БД
     * @private
     * @method addBookmark
     * @param bookmarkName {String}
     */
    private addBookmark(bookmarkName: string) {
        const extentParams = this.getExtentParameters();
        const sendValues: BookmarkValue[] = [
            {
                fieldName: 'title',
                fieldValue: bookmarkName
            },
            {
                fieldName: 'parameters',
                fieldValue: JSON.stringify(extentParams)
            },
            {
                fieldName: 'original_project_id',
                fieldValue: extentParams.projectId as string
            }
        ];

        const requestService = new GISWebServerSEService();
        requestService.addNewBookMark(sendValues).then((response) => {
            if (response.data) {
                if (response.data.status && response.data.status === 200) {
                    this.widgetProps.searchValue = '';
                    this.widgetProps.bookmarkSearch.searchList.splice(0);
                    this.widgetProps.bookmarkSearch.offset = 0;
                    this.widgetProps.bookmarksList.splice(0);

                    this.getBookmarks();

                    const text: string = i18n.t('bookmarks.Bookmark added') as string;
                    this.mapWindow.addSnackBarMessage(text);
                } else {
                    this.map.writeProtocolMessage({
                        text: response.data.errorCode.message as string,
                        type: LogEventType.Error
                    });
                }
            } else {
                this.map.writeProtocolMessage({text: response.error as string, type: LogEventType.Error});
            }
        }).catch((error) => {
            this.map.writeProtocolMessage({text: error, type: LogEventType.Error});
        });
    }

    /**
     * Удалить закладку
     * @private
     * @method deleteBookmark
     * @param bookmark {BookmarkItem}
     */
    private deleteBookmark(bookmark: BookmarkItem) {
        const sendValue: BookmarkValue[] = [
            {
                fieldName: 'id',
                fieldValue: bookmark.id
            },
            {
                fieldName: 'guid',
                fieldValue: bookmark.guid
            }
        ];

        const requestService = new GISWebServerSEService();
        requestService.deleteBookmark(sendValue).then((response) => {
            if (response.data) {
                if (response.data.status && response.data.status === 200) {
                    this.widgetProps.bookmarksList.splice(0);

                    this.getBookmarks();

                    const text: string = i18n.t('bookmarks.Bookmark deleted') as string;
                    this.mapWindow.addSnackBarMessage(text);
                } else {
                    this.map.writeProtocolMessage({
                        text: response.data.errorCode.message as string,
                        type: LogEventType.Error
                    });
                }
            } else {
                this.map.writeProtocolMessage({text: response.error as string, type: LogEventType.Error});
            }
        }).catch((error) => {
            this.map.writeProtocolMessage({text: error, type: LogEventType.Error});
        });
    }

    /**
     * Получить парметры с экстента
     * @private
     * @method getExtentParameters
     *
     * @return ExtentParameters
     */
    private getExtentParameters() {
        const geoPoint = this.map.getCenterGeoPoint();
        const projectId = this.map.options.id;
        const layers = this.map.tiles.getVisibleLayers();
        const activeTask = this.map.workspaceManager.getValue(PROJECT_SETTINGS_ACTIVE_TASK_LIST);
        const selectedObjects = this.map.getSelectedObjects();
        const params3d = this.map.workspaceManager.getValue(VIEW_SETTINGS_PARAMS3D);
        const params3dLayers = this.map.workspaceManager.getValue(PROJECT_SETTINGS_VISIBLE_MODELS);

        let extentParams: ExtentParameters = {
            scale: this.map.options.tilematrix,
            latitude: geoPoint.getLatitude().toFixed(6),
            longitude: geoPoint.getLongitude().toFixed(6)
        };

        if (projectId) {
            extentParams.projectId = projectId;
        }

        if (layers) {
            extentParams.layers = [];
            layers.forEach((layer) => {
                extentParams.layers?.push(layer.xId);
            });
        }

        if (activeTask) {
            extentParams.activeTask = activeTask;
        }

        if (selectedObjects && selectedObjects.length > 0) {
            extentParams.selectedObjects = [];
            selectedObjects.forEach((object) => {
                extentParams.selectedObjects?.push({
                    service: object.vectorLayer.serviceUrl,
                    layerId: object.vectorLayer.idLayer,
                    objectGid: object.gmlId
                });
            });
        }

        if (params3d && params3dLayers) {
            if (params3d.active) {
                extentParams.map3d = {
                    incline: params3d.incline,
                    rotate: params3d.rotate,
                    models3d: params3dLayers
                };
            }
        }

        return extentParams;
    }

    /**
     * Заполнить список типов сортировки закладок
     * @private
     * @method fillSortList
     */
    private fillSortList() {
        this.widgetProps.sortTypes.push({
            text: i18n.t('bookmarks.By name') + ' - ' + i18n.t('bookmarks.Descending'),
            field: 'title',
            type: 'DESC'
        });
        this.widgetProps.sortTypes.push({
            text: i18n.t('bookmarks.By name') + ' - ' + i18n.t('bookmarks.Ascending'),
            field: 'title',
            type: 'ASC'
        });
        this.widgetProps.sortTypes.push({
            text: i18n.t('bookmarks.By creation date') + ' - ' + i18n.t('bookmarks.Descending'),
            field: 'create_time',
            type: 'DESC'
        });
        this.widgetProps.sortTypes.push({
            text: i18n.t('bookmarks.By creation date') + ' - ' + i18n.t('bookmarks.Ascending'),
            field: 'create_time',
            type: 'ASC'
        });
    }

    /**
     * Установить координаты закладки
     * @private
     * @method setBookmarkBounds
     * @param latitude{String} - широта
     * @param  longitude{String} - долгота
     */
    private setBookmarkBounds(latitude: string, longitude: string) {
        if (latitude && longitude) {
            const geoPoint = new GeoPoint(
                parseFloat(longitude),
                parseFloat(latitude),
                0,
                this.map.options.tilematrixset
            );
            const mapPoint = geoPoint.toMapPoint() as MapPoint;

            this.map.setMapCenter(mapPoint, true);
            this.map.overlayRefresh();
        }
    }

    /**
     * Установить масштаб закладки
     * @private
     * @method setBookmarkZoom
     * @param zoom{Number} - масштаб
     */
    private setBookmarkZoom(zoom: number) {
        if (zoom) {
            this.map.setZoom(zoom);
        }
    }

    /**
     * Устонвить активный таск закладки
     * @private
     * @method setBookmarkActiveTask
     * @param activeTask{String | undefined} - масштаб
     */
    private setBookmarkActiveTask(activeTask: string | undefined) {
        if (activeTask) {
            this.mapWindow.getTaskManager().createTask(activeTask);
        }
    }

    /**
     * Устонвить видимые слои закладки
     * @private
     * @method setBookmarkVisibleLayers
     * @param layers{String[] | undefined} - список слоев
     */
    private setBookmarkVisibleLayers(layers: string[] | undefined) {
        if (layers && layers.length > 0) {
            this.map.layers.forEach((layer) => {
                if (layers?.indexOf(layer.xId) !== -1) {
                    layer.show();
                } else {
                    layer.hide();
                }
            });
            this.map.getTaskManager().onDataChanged({ type: 'resetlayersvisibility' });
            this.map.tiles.wmsUpdate();
            this.map.redraw();
        }
    }

    /**
     * Признак авторизованного пользователя
     * @private
     * @method isAuth
     */
    private isAuth() {
        return this.map.options.username.toLowerCase() !== 'anonymous';
    }
}
