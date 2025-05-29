/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Компонент "Список закладок"                   *
 *                                                                  *
 *******************************************************************/



import {Component, Prop} from 'vue-property-decorator';
import {
    BookmarkItem, GET_NEXT_PORTION,
    GwtkProjectBookmarksTaskState
} from '../../GwtkProjectBookmarksTask';
import GwtkProjectBookmarkItem from './../GwtkProjectBookmarkItem/GwtkProjectBookmarkItem.vue';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';


/**
 * Компонент "Список закладок"
 * @class GwtkProjectBookmarksList
 * @extends Vue
 */
@Component( { components: {GwtkProjectBookmarkItem} } )
export default class GwtkProjectBookmarksList extends BaseGwtkVueComponent {

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkProjectBookmarksTaskState>( key: K, value: GwtkProjectBookmarksTaskState[K]) => void;

    @Prop( { default: () => ([]) } )
    private readonly bookmarksList!:BookmarkItem[];

    @Prop( { default: 0 } )
    private readonly bookmarksTotal!:number;

    @Prop( { default: false } )
    private readonly isAuth!: boolean;

    get isTotalExactly () {
        return this.bookmarksTotal - this.bookmarksList.length === 0;
    }

    get containerHeight() {
        return !this.isTotalExactly ? 'calc(100% - 45px)' : '100%';
    }

    /**
     * Получить следующую порцию закладок
     * @method getNextPortion
     */
    getNextPortion() {
        this.setState( GET_NEXT_PORTION, undefined );
    }
}