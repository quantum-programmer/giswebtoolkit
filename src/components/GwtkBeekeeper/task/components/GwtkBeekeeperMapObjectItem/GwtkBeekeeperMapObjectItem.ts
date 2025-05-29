/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *    Компонент "Описание объекта карты для компонента Пчеловоды"   *
 *                                                                  *
 *******************************************************************/

import { Component, Prop, Vue } from 'vue-property-decorator';
import MapObjectContent from '~/mapobject/utils/MapObjectContent';

/**
 * Компонент "Описание объекта карты для компонента Пчеловоды"
 * @class GwtkBeekeeperMapObjectItem
 * @extends Vue
 */
@Component
export default class GwtkBeekeeperMapObjectItem extends Vue {

    @Prop( {
        default: () => ({})
    } )
    mapObjectContent!: MapObjectContent;

    @Prop( {
        default: () => false
    } )
    selected!: boolean;

}
