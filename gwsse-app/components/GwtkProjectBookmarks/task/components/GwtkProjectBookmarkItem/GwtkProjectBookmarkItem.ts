/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                        Компонент "Закладка"                      *
 *                                                                  *
 *******************************************************************/



import {Component, Prop, Vue} from 'vue-property-decorator';
import {
    BookmarkItem, CREATE_SHARE_URL, DELETE_BOOKMARK,
    GwtkProjectBookmarksTaskState, MOVE_TO_BOOKMARK, SET_ACTIVE_BOOKMARK, SET_PUBLIC_ACCESS
} from '../../GwtkProjectBookmarksTask';


/**
 * Компонент "Закладка"
 * @class GwtkProjectBookmarkItem
 * @extends Vue
 */
@Component
export default class GwtkProjectBookmarkItem extends Vue {

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkProjectBookmarksTaskState>( key: K, value: GwtkProjectBookmarksTaskState[K]) => void;

    @Prop( { default: () => ([]) } )
    private readonly bookmark!:BookmarkItem;

    @Prop( { default: false } )
    private readonly isAuth!: boolean;

    get goToTooltip() {
        return this.$t('phrases.Go to');
    }

    get shareTooltip() {
        return this.$t('phrases.Link');
    }

    get publicTooltip() {
        return this.bookmark.isPublic ? this.$t('bookmarks.Available to everyone') : this.$t('bookmarks.Available only to you');
    }

    get deleteTooltip() {
        return this.$t('phrases.Delete');
    }

    /**
     * Устоновить активный класс
     * @method setActiveClass
     */
    setActiveClass() {
        this.setState(SET_ACTIVE_BOOKMARK, this.bookmark );
    }

    /**
     * Перейти к закладке
     * @method moveToBookmark
     */
    moveToBookmark() {
        this.setState(MOVE_TO_BOOKMARK, this.bookmark);
    }

    /**
     * Поделится закладкой
     * @method shareBookmark
     */
    shareBookmark() {
        this.setState(CREATE_SHARE_URL, this.bookmark.guid);
    }

    /**
     * Устоновить признак публичного доступа
     * @method publicBookmark
     */
    publicBookmark() {
        this.setState(SET_PUBLIC_ACCESS, this.bookmark);
    }

    /**
     * Удалить закладку
     * @method deleteBookmark
     */
    deleteBookmark() {
        this.setState(DELETE_BOOKMARK, this.bookmark);
    }
}