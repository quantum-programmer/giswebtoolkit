/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Компонент "Настройка параметров"                 *
 *                    подраздел "Поиск объектов"                    *
 *                                                                  *
 *******************************************************************/

import { Component, Prop, Vue } from 'vue-property-decorator';
import {
    GwtkMapOptionsTaskState,
    UPDATE_OBJECT_SEARCH_POINT_PIXEL_RADIUS,
    UPDATE_SEARCH_DIRECTION_SETTINGS,
    UPDATE_SEARCH_FILTER_SETTINGS
} from '@/components/GwtkMapOptions/task/GwtkMapOptionsTask';
import { ObjectSearch } from '~/utils/WorkspaceManager';
import { FINDDIRECTION, SORTTYPE } from '~/services/RequestServices/common/enumerables';

/**
 * Компонент "Настройка параметров", подраздел "Поиск объектов"
 * @class GwtkMapOptionsParametersObjectSearch
 * @extends Vue
 */
@Component
export default class GwtkMapOptionsParametersObjectSearch extends Vue {

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkMapOptionsTaskState>( key: K, value: GwtkMapOptionsTaskState[K] ) => void;

    @Prop( { default: () => ({}) } )
    private readonly objectSearch!: ObjectSearch;

    @Prop({ default: () => ({}) })
    private readonly searchFilterSettings!: {
        type: string,
        semantic: string,
        direction: string
    };

    @Prop({ default: () => ({}) })
    private readonly sortTypes!: {
        type: {
            text: string,
            type: SORTTYPE
        }[],
        direction: {
            direction: FINDDIRECTION,
            text: string
        }[],
    };

    /**
     * Обработчик для изменения значения радиуса поиска в точке
     * @private
     * @method changePixelRadius
     * @property value {String} значение поля
     */
    private changePixelRadius( value: string ) {
        this.setState( UPDATE_OBJECT_SEARCH_POINT_PIXEL_RADIUS, +value );
    }

    setSearchFilter(value: string) {
        this.setState(UPDATE_SEARCH_FILTER_SETTINGS, value);
    }

    setSearchDirection(value: string) {
        this.setState(UPDATE_SEARCH_DIRECTION_SETTINGS, value);
    }

    get currentSearchFilter() {
        return this.sortTypes.type.find(type => type.type === this.searchFilterSettings.type);
    }

    get currentSearchDirection() {
        return this.sortTypes.direction.find(direction => direction.direction === this.searchFilterSettings.direction);
    }
}
