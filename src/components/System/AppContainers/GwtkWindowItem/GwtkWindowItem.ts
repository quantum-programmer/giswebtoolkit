/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *           Системный компонент оболочки для окна задачи           *
 *                                                                  *
 *******************************************************************/

import { Component, Prop } from 'vue-property-decorator';
import GwtkCommonItem from '../GwtkCommonItem';
import { SimpleJson } from '~/types/CommonTypes';
import i18n from '@/plugins/i18n';
import { PROJECT_SETTINGS_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG } from '~/utils/WorkspaceManager';

type WindowCachedData = {
    x: number;
    y: number;
    width: number;
    height: number;
};

/**
 * Системный компонент оболочки для окна задачи
 * @class GwtkWindowItem
 * @extends GwtkCommonItem
 */
@Component
export default class GwtkWindowItem extends GwtkCommonItem {

    @Prop( { default: 300 } )
    private readonly minHeight!: number;

    @Prop( { default: 300 } )
    private readonly minWidth!: number;

    private readonly initialPosition = { x: 0, y: 0, width: 300, height: 300 };

    @Prop( { default: true } )
    private readonly showDialog!: boolean;

    @Prop( { default: null } )
    private readonly titleBackgroundColor!: string | null;

    @Prop( { default: null } )
    private readonly titleTextColor!: string | null;

    @Prop({default: () => ({x: 0, y: 0})})
    private readonly startPosition!: { x: number; y: number; };

    created() {
        let cachedData = GwtkWindowItem.readCachedData( this.taskId );

        if ( !cachedData ) {
            cachedData = GwtkWindowItem.createCachedData( this.taskId );
            cachedData.x = this.startPosition.x;
            cachedData.y = this.startPosition.y;
            cachedData.width = this.minWidth;
            cachedData.height = this.minHeight;
            // GwtkWindowItem.updateCachedData( this.taskId, cachedData );
        }

        this.initialPosition.x = cachedData.x;
        this.initialPosition.y = cachedData.y;
        this.initialPosition.width = cachedData.width;
        this.initialPosition.height = cachedData.height;
    }

    get isReducedSizeInterface() {
        return this.mapVue.getMap().workspaceManager.getValue(PROJECT_SETTINGS_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG);
    }

    private onMouseDown(): void {
        this.mapVue.getTaskManager().makeTaskActive(this.taskId);
        if ( this.$parent && this.$parent.$parent ) {
            this.$parent.$parent.$emit( 'component:focus', this.taskId );
        }
    }

    private onResize( e: { x: number; y: number; width: number; height: number; } ) {
        this.mapVue.getTaskManager().makeTaskActive(this.taskId);
        const cachedData = GwtkWindowItem.readCachedData( this.taskId );

        cachedData.x = e.x;
        cachedData.y = e.y;
        cachedData.width = e.width;
        cachedData.height = e.height;
        // GwtkWindowItem.updateCachedData( this.taskId, cachedData );
    }

    private static windowPositionCache: SimpleJson<WindowCachedData> = {};

    private static createCachedData( id: string ): WindowCachedData {
        const cachedData = { x: 0, y: 0, width: 0, height: 0 };
        this.windowPositionCache[ id ] = cachedData;

        return cachedData;
    }

    private static readCachedData( id: string ) {
        return this.windowPositionCache[ id ];
    }

    onClose() {
        this.mapVue.getTaskManager().detachTask(this.taskId, true);
    }

    clear() {
        this.mapVue.showInputText({
            description: `${i18n.t('phrases.Clean confirmation component state')}`
        }).then(() => {
            this.mapVue.getTaskManager().clearTaskWorkspaceData(this.taskId);
        }).catch(e => { });
    }

    // private static updateCachedData( id: string, data: WindowCachedData ): void {
    //     const cachedData = this.windowPositionCache[ id ];
    //     if ( cachedData ) {
    //         cachedData.initialOffset.x = data.initialOffset.x;
    //         cachedData.initialOffset.y = data.initialOffset.y;
    //         cachedData.initialSize.width = data.initialSize.width;
    //         cachedData.initialSize.height = data.initialSize.height;
    //     }
    // }

}
