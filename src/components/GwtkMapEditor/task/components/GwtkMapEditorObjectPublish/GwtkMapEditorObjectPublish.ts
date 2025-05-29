/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                          Панель создания объектов                *
 *                                                                  *
 *******************************************************************/

import { Component, Prop, Vue } from 'vue-property-decorator';
import {
    CLICK_PUBLISH_OBJECT_BUTTON_CANCEL,
    CLICK_PUBLISH_OBJECT_BUTTON_OK,
    GwtkMapEditorTaskState,
    PublishObject,
    SET_PUBLISH_OBJECT_CRS
} from '../../../task/GwtkMapEditorTask';

/**
 * Виджет компонента
 * @class GwtkMapEditorObjectPublish
 * @extends BaseGwtkVueComponent
 */
@Component
export default class GwtkMapEditorObjectPublish extends Vue {
    @Prop( { default: () => ({}) } )
    readonly setState!: <K extends keyof GwtkMapEditorTaskState>( key: K, value: GwtkMapEditorTaskState[K] ) => void;

    @Prop( { default: () => ({}) } )
    readonly publishObject!: PublishObject;

    changePublishObjectCrs(value: string) {
        this.setState(SET_PUBLISH_OBJECT_CRS, value);
    }

    applyUpload() {
        this.setState(CLICK_PUBLISH_OBJECT_BUTTON_OK, undefined);
    }

    cancelUpload() {
        this.setState(CLICK_PUBLISH_OBJECT_BUTTON_CANCEL, undefined);
    }
    get crsItems() {
        return this.publishObject.crsList.list.map(item => ({
            ...item,
            title: `${item.name} (${item.epsg})`,
        }));
    }
}
