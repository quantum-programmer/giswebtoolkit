/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                       Компонент "Параметры"                      *
 *         параметр "Тема пользовательского интерфейса"             *
 *                                                                  *
 *******************************************************************/

import { Component, Prop, Vue } from 'vue-property-decorator';
import {
    GwtkMapOptionsTaskState,
    UIParams,
    UPDATE_USER_INTERFACE_DARK_THEME_FLAG,
    UPDATE_USER_INTERFACE_FONT_SIZE,
    UPDATE_USER_INTERFACE_PRIMARY_COLOR,
    UPDATE_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG,
    UPDATE_USER_INTERFACE_SECONDARY_COLOR
} from '@/components/GwtkMapOptions/task/GwtkMapOptionsTask';
import MapOptionsUtils from '@/components/GwtkMapOptions/task/components/GwtkMapOptionsParameters/utils/MapOptionsUtils';
import { FontSize } from '~/utils/WorkspaceManager';

/**
 * Компонент "Настройка параметров", подраздел "Тема пользовательского интерфейса"
 * @class GwtkMapOptionsParametersTheme
 * @extends Vue
 */
@Component
export default class GwtkMapOptionsParametersTheme extends Vue {

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkMapOptionsTaskState>( key: K, value: GwtkMapOptionsTaskState[K] ) => void;

    @Prop( { default: () => ({}) } )
    private readonly ui!: UIParams;

    private themeTitle = '';
    private interfaceReduceSizeTitle = '';

    created() {
        this.themeTitle = this.$t( 'mapoptions.Dark theme' ) as string;
        this.interfaceReduceSizeTitle = this.$t( 'mapoptions.Compact view' ) as string;
    }

    private toggleTheme() {
        this.setState( UPDATE_USER_INTERFACE_DARK_THEME_FLAG, !this.ui.darkThemeFlag );
    }
    private toggleInterfaceSize() {
        this.setState( UPDATE_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG, !this.ui.reduceSizeInterfaceFlag );
    }

    private changePrimaryColor( value: { hexa: string } ) {
        this.setState( UPDATE_USER_INTERFACE_PRIMARY_COLOR, value.hexa );
    }

    /**
     * Стили для поля "Основной цвет"
     * @private
     * @property primaryStyle
     */
    private get primaryStyle() {
        return MapOptionsUtils.createStyleForColorBox( this.ui.primaryColor );
    }

    /**
     * Стили для поля "Дополнительный цвет"
     * @private
     * @property secondaryStyle
     */
    private get secondaryStyle() {
        return MapOptionsUtils.createStyleForColorBox( this.ui.secondaryColor );
    }

    private changeSecondaryColor( value: { hexa: string } ) {
        this.setState( UPDATE_USER_INTERFACE_SECONDARY_COLOR, value.hexa );
    }

    private changeFontSize( data: FontSize ) {
        this.setState( UPDATE_USER_INTERFACE_FONT_SIZE, data );
    }
}
