/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Компонент Яндекс панорамы                       *
 *                                                                  *
 *******************************************************************/


import Task from '~/taskmanager/Task';
import { GwtkComponentDescriptionPropsData } from '~/types/Types';
import MapWindow from '~/MapWindow';
import GwtkYandexPanoramaWidget from '@/components/GwtkYandexPanorama/task/GwtkYandexPanoramaWidget.vue';
import PickPointAction, { SET_COORDINATE_IN_POINT } from '~/systemActions/PickPointAction';
import GeoPoint from '~/geo/GeoPoint';
import PixelPoint from '~/geometry/PixelPoint';
import i18n from '@/plugins/i18n';
import Style from '~/style/Style';
import MarkerStyle from '~/style/MarkerStyle';
import SVGrenderer, { MAP_YANDEX_PANORAMA_MARKER_ID } from '~/renderer/SVGrenderer';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import VectorLayer from '~/maplayers/VectorLayer';
import { LOCALE, LogEventType } from '~/types/CommonTypes';
import { PointSelector } from '~/mapobject/geometry/BaseMapObjectGeometry';
import GwtkError from '~/utils/GwtkError';

declare const ymaps: { Player: YandexPlayer; ready: () => Promise<void>; panorama: YandexPanorama; };

type YandexPlayer = any;
type YandexPanorama = any;

export const CREATE_YANDEX_PANORAMA = 'gwtkyandexpanorama.createyandexpanorama';
export const SELECT_POINT_ACTION = 'gwtkyandexpanorama.selectpointaction';
export const UPDATE_KEY_API_YANDEX = 'gwtkyandexpanorama.updatekeyapiyandex';


export type GwtkYandexPanoramaTaskState = {
    [CREATE_YANDEX_PANORAMA]: boolean;
    [SELECT_POINT_ACTION]: boolean;
    [SET_COORDINATE_IN_POINT]: PixelPoint;
    [UPDATE_KEY_API_YANDEX]: string;
}

type WidgetParams = {
    setState: GwtkYandexPanoramaTask['setState'];
    idYandexPanoramaPlayer: string;
    apiYandexConnect: boolean;
    panoramaFound: boolean;
    keyApiYandex: string;
    loadingPanorama: boolean;
}

type ObjectDirect = {
    vectorPoint: number[],
    angle: number
}

type ObjectCoordinate = {
    coordinatePan: number[],
    coordinatePoint: GeoPoint,
    coordinateDirect: number[],
    verticalPitch: number,
    angle: number
};


/**
 * Компонент "Яндекс панорамы"
 * @class GwtkYandexPanoramaTask
 * @extends Task
 * @description
 */
export default class GwtkYandexPanoramaTask extends Task {
    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & WidgetParams}
     */
    private readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;
    private readonly pointObject: MapObject;
    private readonly pointSelector: PointSelector = { objectNumber: 0, positionNumber: 0, contourNumber: 0 };
    private activeYandexPanorama: boolean = false;

    // API-ключ получить ключ можно в Кабинете разработчика.
    // https://developer.tech.yandex.ru/services/
    private apiYandexKey = '';

    private playerYa?: YandexPlayer;
    /**
     * Объект для построения метки на карте
     * @type {{flagChange: boolean, coordinatePan: Array, coordinatePoint: Array, coordinateDirect: Array, verticalPitch: number, angle: number}}
     */
    private objCoordinate: ObjectCoordinate = {
        coordinatePan: [],      // координаты панорамы
        coordinatePoint: new GeoPoint(0, 0),    // координаты исходной точки на карте
        coordinateDirect: [],   // координаты направления взгляда
        verticalPitch: 0,  // угол подъема над линией горизонта в градусах.
        angle: 0           // угол поворота в градусах
    };

    /**
     * @constructor GwtkYandexPanoramaTask
     * @param mapWindow {MapWindow} Экземпляр окна приложения
     * @param id {string} Идентификатор задачи
     */
    constructor(mapWindow: MapWindow, id: string) {
        super(mapWindow, id);

        this.actionRegistry.push({
            getConstructor() {
                return PickPointAction;
            },
            id: SELECT_POINT_ACTION,
            active: false,
            enabled: true
        });

        const geoPoint = this.map.getCenterGeoPoint();
        if (geoPoint) {
            this.objCoordinate.coordinatePoint = new GeoPoint(parseFloat(geoPoint.getLongitude().toFixed(6)), parseFloat(geoPoint.getLatitude().toFixed(6)));
        }

        this.widgetProps = {
            taskId: this.id,
            description: this.mapWindow.getTaskManager().getTaskDescription(this.id),
            setState: this.setState.bind(this),
            idYandexPanoramaPlayer: 'yandexPanorama',
            apiYandexConnect: false,
            panoramaFound: false,
            keyApiYandex: this.apiYandexKey,
            loadingPanorama: false
        };

        const tempVectorLayer = VectorLayer.getEmptyInstance(this.map);

        this.pointObject = new MapObject(tempVectorLayer, MapObjectType.MultiPoint, { local: LOCALE.Point });
    }

    setup() {
        super.setup();

        const yandexParams=this.map.options.remoteServices?.find(item=>item.type==='Yandex');
        if(yandexParams) {
            this.setState(UPDATE_KEY_API_YANDEX, yandexParams.apikey);
        }
    }


    /**
     * регистрация Vue компонента
     */
    createTaskPanel() {
        // регистрация Vue компонента
        const nameWidget = 'GwtkYandexPanoramaWidget';
        const sourceWidget = GwtkYandexPanoramaWidget;
        this.mapWindow.registerComponent(nameWidget, sourceWidget);

        // Создание Vue компонента
        this.mapWindow.createWidget(nameWidget, this.widgetProps);

        // Помещаем в список удаления после деактивации
        this.addToPostDeactivationList(this.widgetProps);
    }

    protected destroy() {
        super.destroy();
        GwtkYandexPanoramaTask.setMainClientRect(false);
        this.setAction(SELECT_POINT_ACTION, false);
        this.pointObject.removeAllPoints();
        this.map.requestRender();
    }

    onPreRender() {
        if (this.pointObject.isDirty) {
            this.pointObject.isDirty = false;
            this.map.requestRender();
        }
    }

    onPostRender(renderer: SVGrenderer) {
        if (this.pointObject.hasPoints()) {
            this.map.mapObjectsViewer.drawMapObject(renderer, this.pointObject);
        }
    }

    setState<K extends keyof GwtkYandexPanoramaTaskState>(key: K, value: GwtkYandexPanoramaTaskState[ K ]) {
        switch (key) {
            case UPDATE_KEY_API_YANDEX:
                this.apiYandexKey = value as string;
                this.setState(CREATE_YANDEX_PANORAMA, true);
                break;
            case CREATE_YANDEX_PANORAMA:
                if (this.playerYa && this.objCoordinate.coordinatePoint) {
                    this.playerYa = undefined;
                    this.setAction(SELECT_POINT_ACTION, true);
                    if (ymaps) {
                        this.widgetProps.loadingPanorama = true;
                        ymaps.ready().then(() => {
                            this.callYandexPanoramaPlayer();
                        }).catch(() => {
                            this.onError();
                        });
                    }
                } else {
                    if (this.apiYandexKey && this.apiYandexKey !== '') {
                        this.widgetProps.loadingPanorama = true;
                        let script = document.getElementById('apiYandexKey');
                        if (!script) {
                            this.appendScriptYandex();
                        } else {
                            this.startPanoramaInPlayer();
                        }
                    } else {
                        let script = document.getElementById('apiYandexKey');
                        if (script) {
                            this.widgetProps.apiYandexConnect = true;
                            this.widgetProps.loadingPanorama = false;
                            this.mapWindow.addSnackBarMessage(i18n.tc('yandexpanorama.' + 'Pick a point on the map'));
                            this.setAction(SELECT_POINT_ACTION, true);
                        }
                    }
                }

                break;
            case SET_COORDINATE_IN_POINT:
                this.activeYandexPanorama = true;
                this.selectCoordinate(value as PixelPoint);
                break;

            default:
                if (this._action) {
                    this._action.setState(key, value);
                }
        }
    }

    /**
     *
     * @param id
     * @param active
     */
    private setAction(id: string, active: boolean) {
        if (active) {
            this.doAction(id);
        } else {
            this.quitAction(id);
        }
    }


    private selectCoordinate(coordinate: PixelPoint) {
        let coordinateGeo = this.convertCoordinateToFormat(coordinate);
        if (coordinateGeo) {
            this.objCoordinate.coordinatePoint = coordinateGeo;
            if (ymaps) {
                this.widgetProps.loadingPanorama = true;
                ymaps.ready().then(() => {
                    this.callYandexPanoramaPlayer();
                }).catch(() => {
                    this.onError();
                });
            }
        }
    }

    private convertCoordinateToFormat(coordinate: PixelPoint): GeoPoint | undefined {
        const geo = this.map.pixelToGeo(coordinate);
        if (geo) {
            return new GeoPoint(geo.getLongitude(), geo.getLatitude());
        }
    }

    /**
     * подключить скрипты Яндекс Карт
     * @method appendScriptYandex
     */
    private appendScriptYandex() {
        if (typeof this.apiYandexKey !== 'undefined' && this.apiYandexKey.length > 0
        ) {
            let script = document.createElement('script');
            script.src = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU' + '&apikey=' + this.apiYandexKey;
            script.id = 'apiYandexKey';

            script.onerror = () => {
                this.widgetProps.apiYandexConnect = false;
                this.onError();
            };
            script.onload = () => {
                // Проверить ключ
                if (ymaps) {
                    ymaps.ready().then(() => {
                        this.validateApiYandexKey();
                    }).catch(() => {
                        this.onError();
                    });
                }
            };

            script.addEventListener('error', function(e) {
                e.stopPropagation();
            });

            try {
                document.head.append(script);
            } catch (error) {
                const gwtkError = new GwtkError(error);
                this.map.writeProtocolMessage({ text: gwtkError.message, type: LogEventType.Error });
            }
        }

    }

    /**
     * Проверка Api ключа Яндекс карт
     */
    private validateApiYandexKey() {
        if (!ymaps.panorama.isSupported()) {
            this.onError();
            return;
        }
        // Панорама точно есть в этой точке
        ymaps.panorama.locate([55.733685, 37.588264]).then(this.startPanoramaInPlayer.bind(this), this.panoramaError.bind(this));
    }

    /**
     * Запустить режим поиска панорам
     */
    private startPanoramaInPlayer() {
        this.widgetProps.loadingPanorama = false;
        this.widgetProps.apiYandexConnect = true;
        this.mapWindow.addSnackBarMessage(i18n.tc('yandexpanorama.' + 'Pick a point on the map'));
        this.setAction(SELECT_POINT_ACTION, true);
    }

    /**
     * Вызвать Яндекс Панорамы
     * @method callYandexPanoramaPlayer
     */
    private callYandexPanoramaPlayer() {
        // Для начала проверим, поддерживает ли плеер браузер пользователя.
        if (!ymaps.panorama.isSupported()) {
            this.onError();
            return;
        }

        // Ищем панораму в переданной точке.
        if (!this.objCoordinate.coordinatePoint) {
            return;
        }
        if (!this.playerYa) {
            this.widgetProps.panoramaFound = true;
            ymaps.panorama.createPlayer(
                this.widgetProps.idYandexPanoramaPlayer,
                [this.objCoordinate.coordinatePoint.getLatitude(), this.objCoordinate.coordinatePoint.getLongitude()],
                // Зададим направление взгляда, отличное от значения
                // по умолчанию.
                {
                    direction: [0, 0],
                    controls: ['panoramaName', 'zoomControl', 'fullscreenControl'],
                    suppressMapOpenBlock: 'true'
                }
            )
                .then((player: YandexPlayer) => {
                    this.playerYa = player;
                    this.listenEventPanorama(player);
                }, this.panoramaError.bind(this));
        } else {
            // плеер уже создан, обновим панораму
            this.playerYa.moveTo([this.objCoordinate.coordinatePoint.getLatitude(), this.objCoordinate.coordinatePoint.getLongitude()], {
                direction: [0, 0],
                controls: ['panoramaName', 'zoomControl', 'fullscreenControl'],
                suppressMapOpenBlock: 'true'
            })
                .then(
                    () => {
                        this.widgetProps.loadingPanorama = false;
                    },
                    this.panoramaError.bind(this));
        }
    }

    /**
     * Ошибка при поиске панорамы
     */
    private panoramaError(e: { message: string; }) {
        this.widgetProps.loadingPanorama = false;
        if (e && e.message === 'scriptError') {
            this.mapWindow.addSnackBarMessage(i18n.tc('yandexpanorama.Invalid API key'));
            this.widgetProps.apiYandexConnect = false;
            this.widgetProps.panoramaFound = false;
            this.map.writeProtocolMessage({
                text: i18n.tc('yandexpanorama.Invalid API key') + ' ( ' + e.message + ')',
                type: LogEventType.Error
            });
            GwtkYandexPanoramaTask.deleteScript();
        } else {
            this.mapWindow.addSnackBarMessage(i18n.tc('yandexpanorama.Panorama not found'));
            if (!this.playerYa) {
                this.widgetProps.panoramaFound = false;
            }
        }
    }

    /**
     * События плеера
     * @param player
     */
    private listenEventPanorama(player: YandexPlayer) {
        this.widgetProps.loadingPanorama = false;
        if (player) {

            GwtkYandexPanoramaTask.fixButtonYandexView();

            this.playerYa = player;
            let panCoordinate = player.getPanorama().getPosition();
            if (panCoordinate != null) {
                this.widgetProps.panoramaFound = true;
                this.objCoordinate.coordinatePan = panCoordinate;
                this.showLabel();
                // let directPan = player.getDirection();

                this.setObjectCoordinate(panCoordinate, player.getDirection());
            }

            // TODO:Добавить максимальный размер главному окну, что бы после открытия панорамы на весь экран маркер не убегал
            GwtkYandexPanoramaTask.appendEventFullScreenMouseDown();


            // Изменилось направление взгляда
            player.events.add('directionchange',
                () => {
                    this.setObjectCoordinate(player.getPanorama().getPosition(), player.getDirection());
                    // TODO: обновить направление маркера на карте
                }, this);

            // Был включен полноэкранный режим
            player.events.add('fullscreenenter', GwtkYandexPanoramaTask.fixButtonYandexView.bind(this));
            // Полноэкранный режим был выключен
            player.events.add('fullscreenexit', GwtkYandexPanoramaTask.fullScreenExit.bind(this));

            // Изменилась панорама
            player.events.add('panoramachange',
                () => {
                    this.setObjectCoordinate(player.getPanorama().getPosition(), player.getDirection());
                }, this);

            // // закрыли плеер
            // player.events.add( 'destroy', this.eventPanoramaDestroy.bind( this ) );

            player.events.add('error', this.onError.bind(this));
        }
    }

    /**
     * Отобразить отметку точки
     * @method showLabel
     */
    private showLabel() {
        if (this.objCoordinate.coordinatePoint) {
            this.pointObject.removeAllPoints();
            this.pointObject.addGeoPoint(this.objCoordinate.coordinatePoint, this.pointSelector);
            this.pointObject.addStyle(new Style({
                marker: new MarkerStyle({
                    markerId: MAP_YANDEX_PANORAMA_MARKER_ID
                })
            }));
        }
    }


    private setObjectCoordinate(coordinatePanorama: number[], directionPanorama: number[]) {
        this.objCoordinate.coordinatePan = coordinatePanorama;
        // // Возвращает текущее направление обзора в формате [bearing, pitch],
        // // где bearing — азимут направления в градусах, pitch — угол подъема над линией горизонта в градусах.
        let objDirect = GwtkYandexPanoramaTask.calcCoordinateDirect(directionPanorama[0], coordinatePanorama);
        this.objCoordinate.coordinateDirect = objDirect.vectorPoint;
        this.objCoordinate.angle = objDirect.angle;
        this.objCoordinate.verticalPitch = directionPanorama[1];
        this.changeCoordinate();
    }

    /**
     * Произошли изменения в панораме, нужно отобразить их на карте
     * @method changeCoordinate
     */
    private changeCoordinate() {
        let geoPoint = new GeoPoint(this.objCoordinate.coordinatePan[1], this.objCoordinate.coordinatePan[0], 0, this.map.ProjectionId).toMapPoint();

        if (geoPoint) {
            this.pointObject.updatePoint(geoPoint, this.pointSelector);
        }
    }

    /**
     * Ошибка в работе плеера
     * @method onError
     * @returns {number}
     */
    private onError() {
        this.widgetProps.loadingPanorama = false;
        this.mapWindow.addSnackBarMessage(i18n.tc('yandexpanorama.Yandex panorama') + '. ' + i18n.tc('yandexpanorama.The browser does not support the ability to display street panoramas'));
        this.widgetProps.apiYandexConnect = false;
        this.widgetProps.panoramaFound = false;
        GwtkYandexPanoramaTask.deleteScript();
    }


    /**
     * Рассчитать координаты точки направления взгляда
     * @method calcCoordinateDirect
     * @param azimuth - азимут направления обзора
     * @param coordinatePan - координаты панорамы
     * return - координаты направления взгляда
     * @returns {{vectorPoint: Array, angle: (*|number)}}
     * @private
     */
    private static calcCoordinateDirect(azimuth: number, coordinatePan: number[ ]): ObjectDirect {
        let angle = azimuth;
        let vectorPoint: number[] = [];
        const degToRad = Math.PI / 180;

        vectorPoint[0] = (coordinatePan[0] + 0.0001 * Math.cos(angle * degToRad));
        vectorPoint[1] = (coordinatePan[1] + 0.0001 * Math.sin(angle * degToRad));

        return {
            vectorPoint: vectorPoint,
            angle: angle
        };
    }

    /**
     * Настроить вид кнопок
     */
    private static fixButtonYandexView() {
        // Изменить вид кнопок в плеере
        let buttonYa = document.getElementsByClassName('ymaps-2-1-79-islets_round-button__icon');
        if (buttonYa && buttonYa.length > 0) {
            for (let numberButton = 0; numberButton < buttonYa.length; numberButton++) {
                buttonYa[numberButton].setAttribute('style', 'padding:0px; margin: 6px');
            }
        }
    }

    /**
     * TODO:Добавить максимальный размер главному окну, что бы после открытия панорамы на весь экран маркер не убегал
     * @private
     */
    private static appendEventFullScreenMouseDown() {
        const fullScreenButton = document.querySelector('.ymaps-2-1-79-panorama-control__fullscreen');
        if (fullScreenButton) {
            fullScreenButton.addEventListener('mousedown', GwtkYandexPanoramaTask.setMainClientRect.bind(this, true),
                { once: false });
        }
    }


    /**
     * Событие входа из полноэкранного режима
     * @private
     */
    private static fullScreenExit() {
        GwtkYandexPanoramaTask.setMainClientRect(false);
        // TODO:Добавить максимальный размер главному окну, что бы после открытия панорамы на весь экран маркер не убегал
        GwtkYandexPanoramaTask.appendEventFullScreenMouseDown();
        GwtkYandexPanoramaTask.fixButtonYandexView();
    }


    /**
     * Установить/удалить максимальную высоту окна gwtk-main-app-element, что бы маркер на карте не убегал, после открытия панорамы в полноэкранном режиме
     * @param value {boolean}
     * @private
     */
    private static setMainClientRect(value: boolean) {
        const mainElem = document.querySelector('.gwtk-main-app-element');
        if (mainElem) {
            const clr = mainElem.getClientRects();
            const elem = mainElem;
            if (elem) {
                if (value) {
                    elem.setAttribute('style', 'max-height:' + clr[0].height + 'px; max-width:' + clr[0].width + 'px');
                } else {
                    elem.removeAttribute('style');
                }
            }
        }

    }

    /**
     * Удалить скрипт подключения яндекс карт
     * @private
     */
    private static deleteScript() {
        let script = document.getElementById('apiYandexKey');
        if (script) {
            script.remove();
        }
    }
}
