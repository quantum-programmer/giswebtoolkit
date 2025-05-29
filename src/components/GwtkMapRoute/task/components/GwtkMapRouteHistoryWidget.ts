/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Компонент "История маршрутов"                    *
 *                                                                  *
 *******************************************************************/

import { Component, Prop } from 'vue-property-decorator';
import {
    DELETE_ROUTE_FROM_HISTORY,
    GO_TO_ROUTE,
    GwtkMapRouteTaskState,
    HistoryListItem,
    SHOW_ROUTE_PAGE,
    RouteMeasure
} from '@/components/GwtkMapRoute/task/GwtkMapRouteTask';
import RouteDescription, {RouteFeatureJson} from '@/components/GwtkMapRoute/task/RouteDescription';
import {RoutePoint} from '~/types/Types';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import {SourceRoutes} from '~/types/Options';

/**
 * Компонент "История маршрутов"
 * @class GwtkMapRouteHistoryWidget
 * @extends BaseGwtkVueComponent
 */
@Component
export default class GwtkMapRouteHistoryWidget extends BaseGwtkVueComponent {

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkMapRouteTaskState>( key: K, value: GwtkMapRouteTaskState[K] ) => void;

    @Prop( { default: () => ({}) } )
    readonly historyList!: HistoryListItem[];

    @Prop( { default: () => ({})} )
    readonly typeOfRouteMeasurePanorama!: { list: { text: string; value: RouteMeasure }[], select: RouteMeasure };

    @Prop( { default: () => ({})} )
    readonly typeOfRouteMeasureYandex!: { list: { text: string; value: RouteMeasure }[], select: RouteMeasure };

    @Prop( { default: () => ({}) } )
    private readonly sourceRoutesList!: { text: string; value: SourceRoutes; }[];


    /**
     * Вернутся в раздель маршруты
     * @private
     * @method backToRoute
     */
    private backToRoute() {
        this.setState( SHOW_ROUTE_PAGE, undefined );
    }

    /**
     * Получить описание началной точки
     * @private
     * @method getRouteStartPointDescription
     * @param historyItem {HistoryListItem}
     * @param index {String} start | end
     * @return startPoint {String}
     */
    private getRoutePointDescription(historyItem: HistoryListItem, index: string ) {
        let pointDescription: {title: string, subtitle: string, sourceRoute:string, typeOfRouteMeasure: string} = {
            title: '',
            subtitle: '',
            sourceRoute: '',
            typeOfRouteMeasure: '',
        };
        const sourceRoute = this.sourceRoutesList.find(sourceRoute => sourceRoute.value === historyItem.sourceRoute )?.text || '';
        const typeOfRouteMeasure = this.getTypeOfRouteMeasure(historyItem);
        const routeDescription = RouteDescription.fromJSON(historyItem.routeDescription as RouteFeatureJson);
        const routePoints: RoutePoint[] = routeDescription.getRoutePoints();
        let routeIndex = index === 'end' ? (routePoints.length - 1) : 0;

        if ( routePoints[routeIndex] ) {
            if ( routePoints[routeIndex].name ) {
                pointDescription.title = routePoints[routeIndex].name as string;
                pointDescription.subtitle = this.getRoutePointCoordinateString(routePoints[routeIndex]);
                pointDescription.sourceRoute = sourceRoute;
                pointDescription.typeOfRouteMeasure = typeOfRouteMeasure;
            } else {
                pointDescription.title =  this.getRoutePointCoordinateString(routePoints[routeIndex]);
                pointDescription.sourceRoute = sourceRoute;
                pointDescription.typeOfRouteMeasure = typeOfRouteMeasure;
            }
        }

        return pointDescription;
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
     * Перейти к маршруту
     * @private
     * @method goToRoute
     * @param history {HistoryListItem}
     */
    private goToRoute(history: HistoryListItem) {
        this.setState( GO_TO_ROUTE, history );
    }

    /**
     * Удалить маршрут
     * @private
     * @method deleteRoute
     * @param index{Number}
     */
    private deleteRoute(index:number) {
        this.setState(DELETE_ROUTE_FROM_HISTORY, index);
    }
    /**
     * Получить тип расчета для маршрута
     * @method getTypeOfRouteMeasure
     * @param historyItem{HistoryListItem}
     */
    getTypeOfRouteMeasure(historyItem: HistoryListItem) {
        const typeOfRouteMeasure = historyItem.sourceRoute === SourceRoutes.Panorama ? this.typeOfRouteMeasurePanorama : this.typeOfRouteMeasureYandex;
        return typeOfRouteMeasure.list.find(item => item.value === historyItem.typeOfRouteMeasure)?.text || '';
    }


}

