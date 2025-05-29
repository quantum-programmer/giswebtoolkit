/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Компонент Обзорная карта                      *
 *                                                                  *
 *******************************************************************/

import Task from '~/taskmanager/Task';
import MapWindow from '~/MapWindow';
import { GwtkComponentDescriptionPropsData, GwtkMap } from '~/types/Types';
import GwtkMapOverviewWidget from './GwtkMapOverviewWidget.vue';
import { GwtkOptions, MapOverviewOptions } from '~/types/Options';
import { VIEW_SETTINGS_MAPCENTER, VIEW_SETTINGS_ZOOM_LEVEL } from '~/utils/WorkspaceManager';
import Utils from '~/services/Utils';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import VectorLayer from '~/maplayers/VectorLayer';
import Style from '~/style/Style';
import Stroke from '~/style/Stroke';
import { MapPoint } from '~/geometry/MapPoint';


type WidgetParams = {
    setState: GwtkMapOverviewTask['setState'];
    active: boolean;
    showMap: boolean;
    width: number;
    height: number;
    mapContainerId: string;
}

export const TOGGLE = 'gwtkmapoverview.toggle';
export const CREATE_MAP = 'gwtkmapoverview.createmap';

export type GwtkMapOverviewTaskState = {
    [TOGGLE]: undefined;
    [CREATE_MAP]: string;
}

type WorkSpaceData = {
    activeFlag: boolean;
    optionsActiveFlag: boolean;
}

/**
 * Компонент "Обзорная карта"
 * @class GwtkMapOverviewTask
 * @extends Task
 */
export default class GwtkMapOverviewTask extends Task {
    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & WidgetParams}
     */
    private readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;

    private readonly options: MapOverviewOptions;

    private miniMap?: GwtkMap;

    private animationProcess?: number;

    private readonly mapObject;

    private readonly mapObjectStyle = new Style({
        stroke: new Stroke({
            width: '3px',
            color: 'var(--color-purple-03)',
            opacity: 0.66,
            dasharray: '9, 6'
        })
    });

    protected workspaceData: WorkSpaceData = { activeFlag: false, optionsActiveFlag: false };

    /**
     * @constructor GwtkCopyRightTask
     * @param mapWindow {MapWindow} Экземпляр окна приложения
     * @param id {string} Идентификатор задачи
     */
    constructor(mapWindow: MapWindow, id: string) {
        super(mapWindow, id);

        const navigatorcontrol = this.map.options.mapoverview;

        if (!navigatorcontrol || !navigatorcontrol.zoomStep || !navigatorcontrol.url) {
            throw Error('Invalid MapOverview parameters');
        }

        this.options = {
            zoomStep: navigatorcontrol.zoomStep,
            width: navigatorcontrol.width,
            height: navigatorcontrol.height,
            url: navigatorcontrol.url,
            active: navigatorcontrol.active
        };


        const tempVectorLayer = VectorLayer.getEmptyInstance(this.map);
        this.mapObject = new MapObject(tempVectorLayer, MapObjectType.Polygon);

        this.widgetProps = {
            taskId: this.id,
            description: this.mapWindow.getTaskManager().getTaskDescription(this.id),
            setState: this.setState.bind(this),
            showMap: false,
            active: false,
            width: 0,
            height: 0,
            mapContainerId: Utils.generateGUID()
        };

        this.updateSize();
    }

    setup() {
        super.setup();
        const optionsActiveFlag = this.options.active || false;
        if (!this.workspaceData) {
            this.workspaceData = {
                activeFlag: optionsActiveFlag,
                optionsActiveFlag
            };
        } else {
            if (this.workspaceData.optionsActiveFlag !== optionsActiveFlag) {
                this.workspaceData.optionsActiveFlag = optionsActiveFlag;
                this.workspaceData.activeFlag = optionsActiveFlag;
            }
        }

        if (this.workspaceData.activeFlag) {
            this.setState(TOGGLE, undefined);
        }

    }

    protected destroy() {
        super.destroy();
        this.miniMap?.destroy();
    }

    canShowTooltip() {
        return true;
    }

    createTaskPanel() {
        // регистрация Vue компонента
        const nameWidget = 'GwtkMapOverviewWidget';
        const sourceWidget = GwtkMapOverviewWidget;
        this.mapWindow.registerComponent(nameWidget, sourceWidget);

        // Создание Vue компонента
        this.mapWindow.createFooterWidget(nameWidget, this.widgetProps);

        // Помещаем в список удаления после деактивации
        this.addToPostDeactivationList(this.widgetProps);
    }

    setState<K extends keyof GwtkMapOverviewTaskState>(key: K, value: GwtkMapOverviewTaskState[ K ]) {
        switch (key) {
            case TOGGLE:
                this.widgetProps.active = !this.widgetProps.active;
                this.workspaceData.activeFlag = this.widgetProps.active;
                this.writeWorkspaceData(true);

                if (this.widgetProps.active) {
                    this.updateSize();
                    this.updateFrame();
                }

                this.waitForAnimation();
                break;

            case CREATE_MAP:
                this.miniMap = this.createMiniMap(value as string);
                this.updateFrame();
                this.miniMap?.trigger({ type: 'postrender', target: 'map' });
                break;
        }
    }

    private createMiniMap(containerId: string) {

        const mapOptions = this.map.options;

        const options: GwtkOptions = {
            authheader: '',
            contenttree: [],
            controls: [],
            controlspanel: false,
            extauth: false,
            helpUrl: '',
            highlightmode: '',
            locale: '',
            loggedbefore: false,
            mergewmslayers: false,
            objectinfo: { area: false, number: false, semantic: false },
            pamauth: false,
            params3d: { active: false, incline: 0, quality: 0, rotate: 0 },
            servicepam: false,
            shortlegend: 0,
            showsettings: false,
            useform: false,
            username: '',
            usetoken: false,
            'url': mapOptions.url,
            'id': '55',
            'maxbounds': mapOptions.maxbounds,
            'center': mapOptions.center,
            'tilematrix': Math.max(mapOptions.tilematrix - this.options.zoomStep, 1),
            'tilematrixset': mapOptions.tilematrixset,
            'noStorage': true,
            'maxzoom': mapOptions.maxzoom - this.options.zoomStep,
            'minzoom': Math.max(mapOptions.minzoom - this.options.zoomStep, 1),
            'layers': [
                {
                    'id': Utils.generateGUID(),
                    'alias': 'minimapalias',
                    'selectObject': true,
                    'hidden': 0,
                    'url': this.options.url
                }
            ]
        };
        const miniMap = new GWTK.Map(containerId, options);

        miniMap.handlers.mousewheelscaling = function() {
            return false;
        };

        miniMap.on({ type: 'prerender', target: 'map' }, () => {
            if (miniMap && this.mapObject.isDirty) {
                this.mapObject.isDirty = false;
                miniMap.requestRender();
            }
        });

        miniMap.on({ type: 'postrender', target: 'map' }, () => {
            if (this.mapObject.hasPoints()) {
                miniMap.mapObjectsViewer.drawMapObject(miniMap.vectorRenderer, this.mapObject, this.mapObjectStyle);
            }
        });

        miniMap.on({ type: 'mapdrag', target: 'map' }, () => {
            if (this.widgetProps.active && this.animationProcess === undefined) {
                this.map.setMapCenter(miniMap.mapcenter);
                this.map.tiles.wmsManager.onMapDragStart();
                this.map.redraw();
                this.map.requestRender();
            }
        });

        miniMap.on('mapdragend', () => {
            if (this.widgetProps.active && this.animationProcess === undefined) {
                this.map.showMap();
                this.map.requestRender();
            }
        });

        miniMap.on({type: 'click', target: 'map'}, (e: { originalEvent: MouseEvent }) => {
            if (this.widgetProps.active && this.animationProcess === undefined) {
                const newMapCenter = miniMap.pixelToPlane({x: e.originalEvent.offsetX, y: e.originalEvent.offsetY});
                miniMap.setMapCenter(newMapCenter);
                this.map.setMapCenter(newMapCenter);
                this.map.showMap();
                this.map.requestRender();
            }
        });

        this.map.on({ type: 'workspacechanged', target: 'map' }, (e) => {
            if (this.widgetProps.active && this.animationProcess === undefined) {
                if (e.item.key === VIEW_SETTINGS_MAPCENTER || e.item.key === VIEW_SETTINGS_ZOOM_LEVEL) {
                    miniMap.setView(this.map.getCenter(), this.map.options.tilematrix - this.options.zoomStep);
                    miniMap.redraw();
                    this.updateFrame();
                }
            }
        });

        this.map.on({ type: 'overlayRefresh' }, (e) => {
            if (e.cmd === 'resize') {
                this.updateSize();
                this.updateFrame();
                this.waitForAnimation();
            }
        });

        return miniMap;
    }

    private updateFrame() {
        this.mapObject.removeAllPoints();

        const borders = this.map.getWindowBounds();

        const minPoint = borders.min;
        const maxPoint = borders.max;

        const borderSize = borders.getSize();
        const miniMapSize = this.miniMap?.getWindowBounds().getSize();

        if (!miniMapSize || borderSize.x >= miniMapSize.x || borderSize.y >= miniMapSize.y) {
            return;
        }

        this.mapObject.addPoint(minPoint);
        this.mapObject.addPoint(new MapPoint(minPoint.x, maxPoint.y, 0));
        this.mapObject.addPoint(maxPoint);
        this.mapObject.addPoint(new MapPoint(maxPoint.x, minPoint.y, 0));
    }

    private updateSize() {

        let height = this.options.height;
        let width = this.options.width;

        if (!height && width) {
            height = Math.ceil(width * 3 / 4);
        } else if (!width && height) {
            width = Math.ceil(height * 4 / 3);
        }

        if (!width || !height) {
            const size = this.map.getSize();

            width = Math.ceil(size.x / 6);
            height = Math.ceil(size.y / 6);

            if (size.x / size.y < 4 / 3) {
                width = Math.ceil(height * 4 / 3);
            } else {
                height = Math.ceil(width * 3 / 4);
            }
        }

        this.widgetProps.width = width;

        this.widgetProps.height = height;

    }

    private waitForAnimation() {
        if (this.animationProcess !== undefined) {
            window.clearTimeout(this.animationProcess);
            this.animationProcess = undefined;
        }

        this.animationProcess = window.setTimeout(() => {
            if (this.widgetProps.active) {
                this.widgetProps.showMap = true;
                if (this.miniMap) {
                    this.miniMap.resizing();
                    this.miniMap.setView(this.map.getCenter(), this.map.options.tilematrix - this.options.zoomStep);
                    this.miniMap.refresh();
                }
            } else {
                this.widgetProps.showMap = false;
            }

            this.animationProcess = undefined;
        }, 200);
    }
}
