/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *               Компонент "Для сартирование закладок"              *
 *                                                                  *
 *******************************************************************/



import {Component, Prop, Vue} from 'vue-property-decorator';
import {
    BookmarkItem, BookmarksSortType,
    GwtkProjectBookmarksTaskState, SET_SORT_FILTER
} from '../../GwtkProjectBookmarksTask';


/**
 * Компонент "Для сартирование закладок"
 * @class GwtkProjectBookmarksSort
 * @extends Vue
 */
@Component
export default class GwtkProjectBookmarksSort extends Vue {

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkProjectBookmarksTaskState>( key: K, value: GwtkProjectBookmarksTaskState[K]) => void;

    @Prop( { default: () => ([]) } )
    private readonly bookmarksList!:BookmarkItem[];

    @Prop( { default: 0 } )
    private readonly bookmarksTotal!:number;

    @Prop( {default: ()=>({}) } )
    private readonly selectedSortType!: BookmarksSortType;

    @Prop( {default: ()=>([]) } )
    private readonly sortTypes!: BookmarksSortType[];

    get bookmarksListInfo() {
        return this.$t('bookmarks.Bookmarks list') as string + '  (' + this.bookmarksList.length + '/' + this.bookmarksTotal + ')';
    }

    get bookmarkSelectedSortType() {
        return this.selectedSortType.type === 'DESC';
    }

    get bookmarkSelectedSortTypeText() {
        return this.selectedSortType.text;
    }

    /**
     * Устоновить филтр для сортироавки
     * @method setSortFilter
     * @param value {BookmarksSortType}
     */
    setSortFilter(value: BookmarksSortType) {
        this.setState(SET_SORT_FILTER, value);
    }
}