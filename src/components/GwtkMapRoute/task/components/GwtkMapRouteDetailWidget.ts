/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Компонент "Подробный маршрут"                    *
 *                                                                  *
 *******************************************************************/

import { Component, Prop } from 'vue-property-decorator';
import {
    GwtkMapRouteTaskState,
    SET_ACTIVE_DETAIL_ITEM,
    SHOW_ROUTE_PAGE
} from '@/components/GwtkMapRoute/task/GwtkMapRouteTask';
import RouteDescription from '@/components/GwtkMapRoute/task/RouteDescription';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import { BrowserService } from '~/services/BrowserService';


/**
* Компонент "Подробный маршрут"
* @class GwtkMapRouteDetailWidget
* @extends BaseGwtkVueComponent
*/
@Component
export default class GwtkMapRouteDetailWidget extends BaseGwtkVueComponent {

    @Prop({ default: () => ({}) })
    private readonly setState!: <K extends keyof GwtkMapRouteTaskState>(key: K, value: GwtkMapRouteTaskState[K]) => void;

    @Prop({ default: () => ({}) })
    private readonly routeDescription!: RouteDescription;

    private readonly turnIconsList: [string, string][] = [
        ['arrow-up', this.$t('route.straight') + ':'],
        ['arrow-top-right', this.$t('route.slightly to the right') + ':'],
        ['mdi-arrow-right-top', this.$t('route.to the right') + ':'],
        ['arrow-right', this.$t('route.sharply to the right') + ':'],
        ['arrow-u-down-left', this.$t('route.turn round') + ':'],
        ['arrow-left', this.$t('route.sharply to the left') + ':'],
        ['mdi-arrow-left-top', this.$t('route.to the left') + ':'],
        ['arrow-top-left', this.$t('route.slightly to the left') + ':'],
        ['mdi-rotate-3d-variant', this.$t('route.enter roundabout') + ':'],
        ['mdi-location-exit', this.$t('route.leave roundabout') + ':'],
        ['mdi-merge', this.$t('route.merge') + ':'],
        ['mdi-ferry', this.$t('route.board ferry') + ':'],
        ['arrow-top-right', this.$t('route.Exit right') + ':'],
        ['arrow-top-left', this.$t('route.Exit left') + ':'],
    ];

    private get routeDetails() {
        return this.routeDescription._routeDetails;
    }

    private get moveList() {
        const routePointStart = this.routeDescription.getRoutePointStart();
        const routePointEnd = this.routeDescription.getRoutePointEnd();
        let moveList = `${this.$t('route.Route')} `;
        moveList += `${this.$t('route.from')} ` + (routePointStart.name ? routePointStart.name :
            `[ ${routePointStart.coordinate?.getLatitude()}, ${routePointStart.coordinate?.getLongitude()} ]`);
        moveList += ` ${this.$t('route.to')} ` + (routePointEnd.name ? routePointEnd.name + '.' :
            `[ ${routePointEnd.coordinate?.getLatitude()}, ${routePointEnd.coordinate?.getLongitude()} ].`);
        moveList += '\n\t' + `${this.$t('route.Route')} `;
        if (this.routeDetails) {
            for (let i = 0; i < this.routeDetails.length; i++) {

                for (let j = 0; j < this.routeDetails[i].detail.length; j++) {
                    const segment = this.routeDetails[i].detail[j];
                    //извлечение из строки вида '~2 мин (1.52 км)' времени '~2 мин'
                    const segmentTime = /~\d+\s*(мин|ч|min|h)/g.exec(this.timeAndLengthToString(segment.time, segment.length))?.[0];
                    //извлечение из строки вида '~2 мин (1.52 км)' длины '1.52 км'
                    const segmentLength = /\s*\d+\.\d+\s*(км|м|km|m)/g.exec(this.timeAndLengthToString(segment.time, segment.length))?.[0];
                    if (j < this.routeDetails[i].detail.length - 1) {

                        moveList +=
                            this.turnIconsList[segment.code][1] + ' '
                            + (segmentTime)
                            + (segment.name ? ` ${this.$t('route.to')} ${segment.name} ` : '') +
                            `, ${this.$t('route.passing through')} ${(segmentLength)}., `;
                    } else {
                        moveList +=
                            this.turnIconsList[segment.code][1] + ' '
                            + (segmentTime)
                            + (segment.name ? ` ${this.$t('route.to')} ${segment.name} ` : '') +
                            `, ${this.$t('route.passing through')} ${(segmentLength)}. `;

                    }
                    if (this.routeDetails.length > 1 && j === this.routeDetails[i].detail.length - 1) {
                        const segmentTotalLength = /\s*\d+\.\d+\s*(км|м|km|m)/g.exec(this.timeAndLengthToString(this.routeDetails[i].time, this.routeDetails[i].length))?.[0];
                        const segmentTotalTime = /~\d+\s*(мин|ч|min|h)/g.exec(this.timeAndLengthToString(this.routeDetails[i].time, this.routeDetails[i].length))?.[0];
                        moveList += ` ${this.$t('route.Length of the road section')} ${i + 1} - ${segmentTotalLength}, ${this.$t('route.driving time')}  - ${segmentTotalTime}.`;
                        if (i < this.routeDetails.length - 1) {
                            moveList += '\n\t' + `${this.$t('route.Further')} `;
                        }
                    }
                }
            }
            moveList += ` ${this.$t('route.End of the route')}.`;
        }
        const routesTotalLength = /\s*\d+\.\d+\s*(км|м|km|m)/g.exec(this.getTimeAndLengthString() || '')?.[0];
        const routesTotalTime = /~\d+\s*(мин|ч|min|h)/g.exec(this.getTimeAndLengthString() || '')?.[0];
        moveList += `\n${this.$t('route.Total route distance')}  - ${routesTotalLength}, ${this.$t('route.driving time')} - ${routesTotalTime}.`;
        return moveList;
    }



    private copyMoveListToClipBoard() {
        BrowserService.copyToClipboard(this.moveList);

    }
    private setActiveDetailItem({ index1, index2 }: { index1: number, index2: number }) {
        this.setState(SET_ACTIVE_DETAIL_ITEM, [index1, index2]);
    }

    /**
     * Получить время и длину маршрута
     * @return {string} Время и длина маршрута
     */
    private getTimeAndLengthString() {
        if (this.routeDetails) {
            let time = 0;
            let length = 0;
            for (let i = 0; i < this.routeDetails.length; i++) {
                time += this.routeDetails[i].time;
                length += this.routeDetails[i].length;
            }
            return this.timeAndLengthToString(time, length);
        }
    }

    /**
     * Преобразование значений времени и длины в строку
     * @param time {number} Время
     * @param length {number} Длина
     * @return {string}
     */
    private timeAndLengthToString(time: number, length: number) {
        time /= 60;

        if (time < 1)
            time = 1;
        let timeUnit = ' ' + this.$t('phrases.min') + '. ('; // fixme
        let lengthUnit = ' ' + this.$t('phrases.m') + '.)'; // fixme

        if (time > 60) {
            time /= 60;
            timeUnit = ' ' + this.$t('phrases.h') + '. ('; // fixme
        }

        if (length > 1000) {
            length /= 1000;
            lengthUnit = ' ' + this.$t('phrases.km') + '.)'; // fixme
        }

        const result: string[] = [];
        result[0] = '~' + time.toFixed(0);
        result[1] = length.toFixed(2);

        if (length !== 0) {
            return result.join(timeUnit) + lengthUnit;
        } else {
            return '';
        }
    }

    /**
     * Вернутся в раздел маршруты
     * @private
     * @method backToRoute
     */
    private backToRoute() {
        this.setState(SHOW_ROUTE_PAGE, undefined);
    }
}
