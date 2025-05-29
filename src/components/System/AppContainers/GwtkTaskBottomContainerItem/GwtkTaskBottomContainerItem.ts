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

/**
 * Системный компонент оболочки для боковой панели
 * @class GwtkTaskBottomContainerItem
 * @extends GwtkCommonItem
 */
@Component
export default class GwtkTaskBottomContainerItem extends GwtkCommonItem {

    @Prop( { default: 300 } ) minHeight!: number;

    @Prop( Boolean ) readonly?: true;

    @Prop( { default: null } )
    private readonly titleBackgroundColor!: string | null;

    @Prop( { default: null } )
    private readonly titleTextColor!: string | null;

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
