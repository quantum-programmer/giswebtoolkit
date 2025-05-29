/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *        Системный компонент оболочки для боковой панели           *
 *                                                                  *
 *******************************************************************/

import { Component, Prop } from 'vue-property-decorator';
import GwtkCommonItem from '@/components/System/AppContainers/GwtkCommonItem';
import i18n from '@/plugins/i18n';
import { PROJECT_SETTINGS_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG } from '~/utils/WorkspaceManager';

/**
 * Системный компонент оболочки для боковой панели
 * @class GwtkTaskContainerItem
 * @extends GwtkCommonItem
 */
@Component
export default class GwtkTaskContainerItem extends GwtkCommonItem {

    @Prop( { default: 300 } ) minHeight!: number;

    @Prop( Boolean ) readonly?: true;

    @Prop( { default: null } )
    private readonly titleBackgroundColor!: string | null;

    @Prop( { default: null } )
    private readonly titleTextColor!: string | null;

    get isReducedSizeInterface() {
        return this.mapVue.getMap().workspaceManager.getValue(PROJECT_SETTINGS_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG);
    }

    /**
     * Обработчик события изменения размера
     * @method onResize
     * @param dimentions {height:number} - Новые размеры
     */
    onResize( { height }: { height: number } ) {
        this.$emit( 'resize', height );
    }

    /**
     * Обработчик клика
     * @method onClick
     */
    onClick() {
        this.mapVue.getTaskManager().detachTask( this.taskId, true );
    }

    clear() {
        this.mapVue.showInputText({
            description: `${i18n.t('phrases.Clean confirmation component state')}`
        }).then(() => {
            this.mapVue.getTaskManager().clearTaskWorkspaceData(this.taskId);
        }).catch (e => {});
    }
}
