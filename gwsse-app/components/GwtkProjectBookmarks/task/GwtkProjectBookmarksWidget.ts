/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                   Виджет задачи Закладки проекта                 *
 *                                                                  *
 *******************************************************************/
import { Component, Prop } from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import { TaskDescription } from '~/taskmanager/TaskManager';
import {
    BookmarkItem, BookmarksSortType,
    GwtkProjectBookmarksTaskState
} from './GwtkProjectBookmarksTask';
import GwtkProjectBookmarkAdd from './components/GwtkProjectBookmarkAdd/GwtkProjectBookmarkAdd.vue';
import GwtkProjectBookmarksSort from './components/GwtkProjectBookmarksSort/GwtkProjectBookmarksSort.vue';
import GwtkProjectBookmarkSearch from './components/GwtkProjectBookmarkSearch/GwtkProjectBookmarkSearch.vue';
import GwtkProjectBookmarksList from './components/GwtkProjectBookmarksList/GwtkProjectBookmarksList.vue';


@Component( {components:{GwtkProjectBookmarkAdd, GwtkProjectBookmarksSort, GwtkProjectBookmarkSearch, GwtkProjectBookmarksList} } )
export default class GwtkProjectBookmarksWidget extends BaseGwtkVueComponent {

    @Prop( { default: '' } )
    private readonly taskId!: string;

    @Prop( { default: () => ({}) } )
    private readonly description!: TaskDescription;

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

    @Prop( { default: '' } )
    private readonly searchValue!: string;

    @Prop( { default: false } )
    private readonly isAuth!: boolean;

    get bookmarksListViewModeHeight() {
        return this.isAuth ? 'calc(100% - 175px)' : 'calc(100% - 140px)';
    }
}
