/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Виджет компонента "Поиск"                     *
 *                                                                  *
 *******************************************************************/

import { Component, Prop } from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import { AddressServiceType, SearchType } from '~/types/Options';
import {
    ABORT_SEARCH,
    CHANGE_SEARCH_MODE,
    CHANGE_VISIBLE_ON_SCALE,
    GwtkSearchTaskState, SELECT_POINT_ACTION,
    START_SEARCH,
    UPDATE_ADDRESS_SERVICE, UPDATE_SEARCH_PROGRESS_BAR, UPDATE_SEARCH_TEXT
} from '@/components/GwtkSearch/task/GwtkSearchTask';
import { TaskDescription } from '~/taskmanager/TaskManager';
import SearchItemsDescription, { AddresSearchService } from '@/components/GwtkSearch/task/SearchItemsDescription';
import { ActionDescription } from '~/taskmanager/Task';


/**
 * Виджет компонента
 * @class GwtkSearchWidget
 * @extends BaseGwtkVueComponent
 */
@Component
export default class GwtkSearchWidget extends BaseGwtkVueComponent {

    @Prop( { default: '' } )
    private readonly taskId!: string;

    @Prop( { default: () => ({}) } )
    private readonly description!: TaskDescription;

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkSearchTaskState>( key: K, value: GwtkSearchTaskState[K] ) => void;

    @Prop( { default: false } )
    private readonly visibleOnCurrentScale!: boolean;

    @Prop( { default: () => ({}) } )
    private readonly searchSourceDescription!: SearchItemsDescription;
    @Prop( { default: true } ) searchProgressBar!: boolean;

    @Prop( { default: '' } ) searchText!: string;
    @Prop( { default: () => ({}) } ) actionDescription!: ActionDescription;

    private showOptions = false;

    /**
     * Обработчик изменений в поле ввода
     * @method onInput
     * @param value {string} Текущее значение в поле ввода
     */
    onInput( value: string ) {
        this.setState( UPDATE_SEARCH_PROGRESS_BAR, false );
        this.setState( UPDATE_SEARCH_TEXT, value );
    }

    get activeAddressService() {
        return this.searchSourceDescription.activeAddressModeDescription;
    }

    set activeAddressService( item: AddresSearchService ) {
        if ( typeof item !== 'object' ) {
            item = { id: AddressServiceType.Unknown, text: '' };
        }
        this.setState( UPDATE_ADDRESS_SERVICE, item.id );
    }

    /**
     * Обработчик изменения режима поиска
     * @method onChangeSearchMode
     * @param value {SearchType} Режим поиска
     */
    onChangeSearchMode( value: SearchType ) {
        this.setState( CHANGE_SEARCH_MODE, value );
    }

    /**
     * Обработчик изменения флага фильтра текущего масштаба
     * @method changeVisibleOnCurrentScale
     */
    changeVisibleOnCurrentScale() {
        this.setState( CHANGE_VISIBLE_ON_SCALE, this.visibleOnCurrentScale );
    }

    /**
     * Выполнить поиск
     * @method search
     */
    search() {
        this.setState( START_SEARCH, undefined );
    }

    get titleStopSearch() {
        return this.$t( 'phrases.Cancel' );
    }

    get titleAdvancedSearch() {
        return this.$t( 'phrases.Advanced search' );
    }

    /**
     * Закрыли оверлей
     */
    closeOverlay() {
        this.setState( UPDATE_SEARCH_PROGRESS_BAR, false );
        this.setState( ABORT_SEARCH, undefined );
    }

    setPickPointAction() {
        this.setState( SELECT_POINT_ACTION, !this.actionDescription.active );
    }
}
