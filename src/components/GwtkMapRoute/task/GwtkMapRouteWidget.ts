/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                      Компонент "Маршруты"                        *
 *                                                                  *
 *******************************************************************/

import { Component, Prop } from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import { TaskDescription } from '~/taskmanager/TaskManager';
import RouteDescription from '@/components/GwtkMapRoute/task/RouteDescription';
import {
    GwtkMapRouteTaskState,
    HistoryListItem,
    RESET_ENTIRE_ROUTE,
    SET_ACTIVE_DETAIL_ITEM,
    ADD_ANOTHER_ROUTE_POINT,
    SET_ACTIVE_ROUTE_POINT,
    REMOVE_ROUTE_POINT,
    UPDATE_POINTS_ORDER,
    SHOW_ROUTE_HISTORY_LIST,
    SET_FOCUSED_ROUTE,
    SET_PROMP_VALUE,
    SET_SOURCE_ROUTE,
    UPDATE_KEY_API_YANDEX,
    SHOW_ROUTE_DETAIL_LIST,
    BUILDING_ROUTE,
    ADD_ROUTE_POINTS,
    SET_COORDINATE_VALID_FLAG,
    TOGGLE_TYPE_OF_ROUTE_MEASURE,
    RouteMeasure,
} from '@/components/GwtkMapRoute/task/GwtkMapRouteTask';
import Draggable from 'vuedraggable';
import { RoutePoint } from '~/types/Types';
import GwtkMapRouteHistoryWidget from '@/components/GwtkMapRoute/task/components/GwtkMapRouteHistoryWidget.vue';
import GwtkMapRouteDetailWidget from '@/components/GwtkMapRoute/task/components/GwtkMapRouteDetailWidget.vue';
import GeoPoint from '~/geo/GeoPoint';
import i18n from '@/plugins/i18n';
import { PROJECT_SETTINGS_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG } from '~/utils/WorkspaceManager';
import {SourceRoutes} from '~/types/Options';

/**
 * Компонент "Маршруты"
 * @class GwtkMapRouteWidget
 * @extends BaseGwtkVueComponent
 */
@Component( { components: { Draggable, GwtkMapRouteHistoryWidget, GwtkMapRouteDetailWidget } } )
export default class GwtkMapRouteWidget extends BaseGwtkVueComponent {
    @Prop( { default: '' } )
    private readonly taskId!: string;

    @Prop( { default: () => ({}) } )
    private readonly description!: TaskDescription;

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkMapRouteTaskState>( key: K, value: GwtkMapRouteTaskState[K] ) => void;

    @Prop( { default: () => ({}) } )
    private readonly routeDescription!: RouteDescription;

    @Prop( { default: false } )
    private readonly showHistoryPanel!: boolean;

    @Prop( { default: false } )
    private readonly showDetailPanel!: boolean;

    @Prop( { default: () => ({}) } )
    private readonly historyList!: HistoryListItem[];

    @Prop( { default: 0 } )
    private readonly focusedRoute!: number;

    @Prop( { default: () => ({}) } )
    private readonly historyPrompList!: RoutePoint[];

    @Prop( { default: () => ({}) } )
    private readonly sourceRoutesList!: { text: string; value: SourceRoutes; }[];

    @Prop( { default: false } )
    private readonly apiYandexConnect!: boolean;

    @Prop( { default: false } )
    private readonly apiYandexRouterConnect!: boolean;

    @Prop( { default: false } )
    private readonly loadingYmapsScript!: boolean;

    @Prop( { default: '' } )
    private keyApiYandex!: string;

    @Prop( { default: '' } )
    private keyApiYandexRouter!: string;

    @Prop( { default: '' } )
    private readonly sourceRoute!: SourceRoutes;

    @Prop( { default: () => ([]) } )
    private readonly coordinateValidFlag!: boolean[];

    @Prop( { default: false } )
    private readonly startFindInPointAndSetRoutePoint!: boolean;

    @Prop( { default: () => ({})} )
    readonly typeOfRouteMeasurePanorama!: { list: { text: string; value: RouteMeasure }[], select: RouteMeasure };

    @Prop( { default: () => ({})} )
    readonly typeOfRouteMeasureYandex!: { list: { text: string; value: RouteMeasure }[], select: RouteMeasure };

    private key: string = '';


    private selectSourceRoute(value: SourceRoutes) {
        this.setState(SET_SOURCE_ROUTE, value);
    }

    private sendKey() {
        this.setState( UPDATE_KEY_API_YANDEX, this.key );
    }

    get isAllCoordinateValid() {
        return this.coordinateValidFlag.every(element => element === true);
    }
    get keyApiYandexValue() {
        return this.keyApiYandex;
    }

    set keyApiYandexValue( value: string ) {
        this.key = value;
    }

    get keyApiYandexRouterValue() {
        return this.keyApiYandexRouter;
    }

    set keyApiYandexRouterValue( value: string ) {
        this.key = value;
    }


    get isYandexMapRoutes() {
        return this.sourceRoute === SourceRoutes.Yandex;
    }

    get isYandexRouter() {
        return this.sourceRoute === SourceRoutes.YandexRouter;
    }

    get isPanoramaRoutes() {
        return this.sourceRoute === SourceRoutes.Panorama;
    }

    get typeOfRouteMeasure () {
        return this.isPanoramaRoutes? this.typeOfRouteMeasurePanorama: this.typeOfRouteMeasureYandex;
    }

    get typeOfRouteMeasureValue () {
        return this.typeOfRouteMeasure.list.find(item => item.value === this.typeOfRouteMeasure.select);
    }

    updateOrder( { oldIndex, newIndex }: { oldIndex: number; newIndex: number; } ) {
        this.setState( UPDATE_POINTS_ORDER, [oldIndex, newIndex] );
    }

    get clearDisabled() {
        return this.routeDescription.getRoutePoints().every( value => value === null );

    }
    get isCoordWasEdit () {
        return this.routeDescription.getRoutePoints().every( value => value === null );
    }


    private get routesTotalLength() {
        return /\s*\d+\.\d+\s*(км|м|km|m)/g.exec(this.getTimeAndLengthString() || '')?.[0];
    }
    private get routesTotalTime() {
        return /~\d+\s*(мин|ч|min|h)/g.exec(this.getTimeAndLengthString() || '')?.[0];
    }
    // получение строки с временем и датой прибытия
    private get arrivalTime() {
        //извлечение из строки вида '~2 мин (1.52 км)' времени '2 мин'
        const timeMatch = /~(\d+) (мин|ч|min|h)/g.exec(this.routesTotalTime || '');
        if (!timeMatch) {
            this.mapVue.addSnackBarMessage(i18n.tc('route.Route points match'));
            return '';
        }
        const now = new Date();
        const nowDate = now.getDate();
        const minutes = +timeMatch[1];
        const hours = timeMatch[2] === 'ч' ? minutes : 0;
        now.setMinutes(now.getMinutes() + minutes);
        now.setHours(now.getHours() + hours);

        const formattedTime = now.getHours().toString().padStart(2, '0') + ':' +
            now.getMinutes().toString().padStart(2, '0');

        const formattedTimeWithDate = `${now.toLocaleDateString('ru-RU', { month: 'long', day: 'numeric' })}, в ${formattedTime}`;

        return nowDate === now.getDate() ? `в ${formattedTime}` : formattedTimeWithDate;

    }

    private get isEnoughRoutePoints() {
        return this.routeDescription.isEnoughRoutePoints();
    }
    buildingRoute() {
        this.setState( BUILDING_ROUTE, undefined );
    }
    setActiveRoutePoint( index: number ) {
        this.setState( SET_ACTIVE_ROUTE_POINT, index );
    }

    clearPoints() {
        this.setState( RESET_ENTIRE_ROUTE, undefined );
    }

    removeRoutePoint( index: number ) {
        this.setState( REMOVE_ROUTE_POINT, index );
    }

    setActiveDetailItem( { index1, index2 }: { index1: number, index2: number } ) {
        this.setState( SET_ACTIVE_DETAIL_ITEM, [index1, index2] );
    }

    addRoutePoint() {
        this.setState( ADD_ANOTHER_ROUTE_POINT, undefined );
    }


    getRoutePointIcon( index: number ) {
        if ( index === this.routeDescription.getRoutePointsCount() - 1 ) {
            return 'map-marker';
        }

        return 'circle-bold';
    }

    /**
     * Получить время и длину маршрута
     * @return {string} Время и длина маршрута
     */
    getTimeAndLengthString() {
        if ( this.routeDescription._routeDetails ) {
            const routeDetails = this.routeDescription._routeDetails;

            let time = 0;
            let length = 0;

            for ( let i = 0; i < routeDetails.length; i++ ) {
                time += routeDetails[ i ].time;
                length += routeDetails[ i ].length;
            }

            return this.timeAndLengthToString( time, length );

        }

    }

    /**
     * Преобразование значений времени и длины в строку
     * @param time {number} Время
     * @param length {number} Длина
     * @return {string}
     */
    timeAndLengthToString( time: number, length: number ) {
        time /= 60;

        if ( time < 1 )
            time = 1;
        let timeUnit = ' ' + this.$t( 'phrases.min' ) + '. ('; // fixme
        let lengthUnit = ' ' + this.$t( 'phrases.m' ) + '.)'; // fixme

        if ( time > 60 ) {
            time /= 60;
            timeUnit = ' ' + this.$t( 'phrases.h' ) + '. ('; // fixme
        }

        if ( length > 1000 ) {
            length /= 1000;
            lengthUnit = ' ' + this.$t( 'phrases.km' ) + '.)'; // fixme
        }

        const result: string[] = [];
        result[ 0 ] = '~' + time.toFixed( 0 );
        result[ 1 ] = length.toFixed( 2 );

        if (length !== 0) {
            return result.join(timeUnit) + lengthUnit;
        } else {
            return '';
        }
    }

    /**
     * Получить строку координат пункта маршрута
     * @param point {RoutePoint} Пункт маршрута
     * @return {string}
     */
    getRoutePointCoordinateString( point: RoutePoint ) {
        const result: string[] = [];
        result[ 0 ] = point.coordinate ? point.coordinate.getLatitude().toFixed( 6 ) : '';
        result[ 1 ] = point.coordinate ? point.coordinate.getLongitude().toFixed( 6 ) : '';

        if ( result[ 0 ] !== '' && result[ 1 ] !== '' ) {
            return result.join( ', ' );
        } else {
            return '';
        }
    }

    /**
     * Показать историю маршрутов
     * @private
     * @method showRouteHistoryList
     */
    private showRouteHistoryList() {
        this.setState( SHOW_ROUTE_HISTORY_LIST, undefined );
    }

    /**
     * Показать подробный маршрут
     * @private
     * @method showRouteDetailList
     */
    private showRouteDetailList() {
        this.setState( SHOW_ROUTE_DETAIL_LIST, undefined );
    }

    /**
     * Установить флаг изменения поля ввода координат
     * @private
     * @method setCoordinateValidFlag
     */
    setCoordinateValidFlag(index:number,value:boolean) {
        this.setState( SET_COORDINATE_VALID_FLAG, {index,value});
    }

    /**
     * Установить координаты точки вручную
     * @private
     * @method setRoutePoint
     */

    private setRoutePoint(index: number, inputValue: string, name: string) {
        if (index !== this.routeDescription.getActiveRoutePoint()) {
            //чтобы срабатывание происходило только на вызываемом поле ввода
            return;
        }
        this.routeDescription.setActiveRoutePoint(index);
        //регулярное выражение для валидации значения координат, широта находится в диапазоне от -90 до 90,
        //долгота - в диапазоне от -180 до 180, включая возможные десятичные значения.
        const coordinateRegex = /^-?(?:[1-8]?[0-9](?:\.\d+)?|90(?:\.0+)?),\s*-?(?:1[0-7][0-9]|180|0?\d{1,2})(?:\.\d+)?$/;
        if (coordinateRegex.test(inputValue.trim())) {
            const [latitude, longitude] = inputValue.split(',').map(coord => parseFloat(coord.trim()));
            let routePoint: RoutePoint[] = [];
            routePoint.push({
                coordinate: new GeoPoint(longitude, latitude),
                name: null
            });
            this.setCoordinateValidFlag(index,true);
            this.setState(ADD_ROUTE_POINTS, routePoint);
        } else if (inputValue === name) {
            //если вместо координат в поле появляется геокодированное имя объекта
            this.setCoordinateValidFlag(index,true);
        } else {
            this.setCoordinateValidFlag(index, false);
            this.mapVue.addSnackBarMessage(`${i18n.tc('route.Incorrect format of the coordinate string')} ${index + 1}`);
        }
    }

    /**
     * Установить индекс выбраного поля
     * @private
     * @method setFocusedRoute
     */
    private setFocusedRoute(index: number) {
        this.setState(SET_FOCUSED_ROUTE, index);
    }

    /**
     * Установить выбранное значение из подсказок в поле
     * @private
     * @method setPrompListValue
     * @param value {Number}
     */
    private setPrompListValue(value: number) {
        this.setState( SET_PROMP_VALUE, value );
    }
    get isReducedSizeInterface() {
        return this.mapVue.getMap().workspaceManager.getValue(PROJECT_SETTINGS_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG);
    }
    /**
     * Установить тип расчета маршрута (по минимальному расстоянию,
     *  минимальному времени, с учетом пробок или без)
     * @method toggleTypeOfRouteMeasure
     * @param value {RouteMeasure}
    */
    toggleTypeOfRouteMeasure(value: RouteMeasure) {
        this.setState(TOGGLE_TYPE_OF_ROUTE_MEASURE, value);
    }
}
