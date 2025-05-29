/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Системный компонент окно задачи                  *
 *                                                                  *
 *******************************************************************/

import { Component } from 'vue-property-decorator';
import GwtkCommonContainer from '../GwtkCommonContainer';
import VueDraggableResizable from 'vue-draggable-resizable';
import Vue from 'vue';
import 'vue-draggable-resizable/dist/VueDraggableResizable.css';

Vue.component( 'VueDraggableResizable', VueDraggableResizable );

/**
 * Системный компонент окно задачи
 * @class GwtkWindow
 * @extends GwtkCommonContainer
 */
@Component( { components: { VueDraggableResizable } } )
export default class GwtkWindow extends GwtkCommonContainer {

    get value() {
        return this.components.length > 0;
    }

    showItem = true;

    setVisibility(value: boolean) {
        this.showItem = value;
    }

    created() {
        this.$on( 'component:focus', this.popupComponent );
    }

    private popupComponent( taskId: string ) {
        const component = this.components.find( curComponent => curComponent.propsData.taskId === taskId );
        if ( component ) {
            this.showComponent( component.propsData );
        }
    }

}
