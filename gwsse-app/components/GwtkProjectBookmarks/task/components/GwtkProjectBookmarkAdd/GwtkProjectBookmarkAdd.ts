/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Компонент "Для добавления закладок"               *
 *                                                                  *
 *******************************************************************/



import {Component, Prop, Vue} from 'vue-property-decorator';
import {
    ADD_BOOKMARK,
    GwtkProjectBookmarksTaskState
} from '../../GwtkProjectBookmarksTask';


/**
 * Компонент "Для добавления закладок"
 * @class GwtkProjectBookmarksAdd
 * @extends Vue
 */
@Component
export default class GwtkProjectBookmarkAdd extends Vue {

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkProjectBookmarksTaskState>( key: K, value: GwtkProjectBookmarksTaskState[K]) => void;

    @Prop( { default: 0 } )
    private readonly bookmarksTotal!:number;

    private createDialogOpen: boolean = false;

    private bookmarkNameValueStr: string = '';

    get bookmarkNameValue() {
        this.bookmarkNameValueStr = (this.bookmarkNameValueStr !== '') ? this.bookmarkNameValueStr : this.$t('bookmarks.New bookmark') as string + ' ' + (this.bookmarksTotal + 1);
        return this.bookmarkNameValueStr;
    }

    set bookmarkNameValue( value:string ) {
        this.bookmarkNameValueStr = value;
    }


    /**
     *  Заголовок кнопки "Создать закладку"
     */
    get titleButtonCreate() {
        return this.$t('bookmarks.Create a bookmark');
    }

    get bookmarkName() {
        return this.$t('bookmarks.Bookmark name');
    }

    /**
     * Создать закладку
     * @private
     * @method createBookmark
     */
    private createBookmark() {
        this.setState(ADD_BOOKMARK, this.bookmarkNameValue);
        this.bookmarkNameValueStr = '';
        this.createDialogOpen = false;
    }

    /**
     * Закрыть окно создания закладки
     * @private
     * @method closeCreateBookmark
     */
    private closeCreateBookmark() {
        this.bookmarkNameValueStr = '';
        this.createDialogOpen = false;
    }
}