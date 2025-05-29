/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *  Компонент "Описание объекта карты для компонента Растениеводы"  *
 *                                                                  *
 *******************************************************************/


import { Component, Prop, Vue } from 'vue-property-decorator';
import MapObjectContent from '~/mapobject/utils/MapObjectContent';

/**
 * Компонент "Описание объекта карты для компонента Растениеводы"
 * @class GwtkPlantBreederMapObjectItem
 * @extends Vue
 */
@Component
export default class GwtkPlantBreederMapObjectItem extends Vue {

    @Prop( {
        default: () => ({})
    } )
    mapObjectContent!: MapObjectContent;

    @Prop( {
        default: () => false
    } )
    selected!: boolean;

}
