/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Компонент "Для поиска закладок"                 *
 *                                                                  *
 *******************************************************************/



import {Component, Prop, Vue} from 'vue-property-decorator';
import {
    GwtkProjectBookmarksTaskState,
    SET_SEARCH_VALUE
} from '../../GwtkProjectBookmarksTask';


/**
 * Компонент "Для поиска закладок"
 * @class GwtkProjectBookmarkSearch
 * @extends Vue
 */
@Component
export default class GwtkProjectBookmarkSearch extends Vue {

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkProjectBookmarksTaskState>( key: K, value: GwtkProjectBookmarksTaskState[K]) => void;

    @Prop( { default: '' } )
    private readonly searchValue!: string;

    /**
     * Получить значение для поиска закладок
     * @get
     * @method bookmarksSearchValue
     */
    get bookmarksSearchValue() {
        return this.searchValue;
    }

    /**
     * Устоновить значения для поиска закладок
     * @set
     * @method bookmarksSearchValue
     * @param value {String}
     */
    set bookmarksSearchValue(value: string) {
        value = (value === null) ? '' : value;
        this.setState(SET_SEARCH_VALUE, value);
    }
}