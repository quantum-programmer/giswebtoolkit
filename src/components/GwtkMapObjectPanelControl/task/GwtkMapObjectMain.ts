/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                     Компонент "Объекты карты"                    *
 *                                                                  *
 *******************************************************************/
import { Component, Prop } from 'vue-property-decorator';
import { TaskDescription, MapObjectPanelState } from '~/taskmanager/TaskManager';
import {
    GwtkMapObjectTaskState,
    MapObjectsViewMode, RequestItem,
    SemanticViewFlags,
    TableParams, ExportButtonList, SortType, GallerySemanticItem
} from '@/components/GwtkMapObjectPanelControl/task/GwtkMapObjectTask';
import FilterItemManager from '@/components/GwtkMapObjectPanelControl/task/utils/FilterItemManager/FilterItemManager';
import { AngleUnit, CursorCoordinateUnit } from '~/utils/WorkspaceManager';
import MapObject from '~/mapobject/MapObject';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import GwtkMapObjectWidget
    from '@/components/GwtkMapObjectPanelControl/task/components/GwtkMapObjectWidget/GwtkMapObjectWidget.vue';
import GwtkMapObjectContainerItem from '@/components/GwtkMapObjectPanelControl/task/GwtkMapObjectContainerItem.vue';


/**
 * Компонент "Объекты карты"
 * @class GwtkMapObjectMain
 * @extends BaseGwtkVueComponent
 */
@Component( { components: { GwtkMapObjectWidget, GwtkMapObjectContainerItem } } )
export default class GwtkMapObjectMain extends BaseGwtkVueComponent {
    @Prop( { default: '' } )
    private readonly taskId!: string;

    @Prop( { default: () => ({}) } )
    private readonly description!: TaskDescription;

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkMapObjectTaskState>( key: K, value: GwtkMapObjectTaskState[K] ) => void;

    @Prop( { default: true } ) objectsProgressBar!: boolean;

    @Prop( { default: true } ) filtersProgressBar!: boolean;

    @Prop( { default: () => ([]) } ) mapObjects!: MapObject[];

    @Prop( { default: () => ([]) } ) mapObjectsSelected!: MapObject[];

    @Prop({ default: () => ([]) }) reallySelectedObjects!: MapObject[];

    @Prop( { default: 0 } ) foundObjectsNumber!: number;

    @Prop( { default: () => ({}) } ) filterManager!: FilterItemManager;

    @Prop( { default: () => ([]) } ) selectedObjects!: string[];

    @Prop( { default: 0 } ) mapObjectsState!: MapObjectPanelState;

    @Prop( { default: () => ({}) } ) currentMapObject!: MapObject | null;

    @Prop( { default: () => '' } ) drawnObjectId!: string;

    @Prop( { default: () => [] } ) requestQueue!: { id: string; requestItems: RequestItem[]; }[];

    @Prop( { default: false } ) stateSearchObject!: boolean;

    @Prop( { default: () => ({}) } )
    private readonly showGallery!: boolean;

    @Prop( { default: false } )
    private readonly showSemanticFileUploadOverlay!: boolean;

    @Prop( { default: false } )
    private readonly coordinateDisplayFormatValue!: AngleUnit;

    @Prop( { default: false } )
    private readonly showSelectedObjectsPage!: boolean;

    @Prop( { default: 'tab_edit_semantic' } )
    private readonly editorTabOptions!: string;

    @Prop( { default: '' } )
    private readonly previewImageSrc!: string;

    @Prop( { default: false } )
    private readonly isGetRouteEnabled!: boolean;

    @Prop( { default: () => ({}) } )
    private readonly semanticViewFlags!: SemanticViewFlags;

    @Prop( { default: '' } )
    private readonly coordinateDisplayFormat!: CursorCoordinateUnit;

    @Prop( { default: () => ({}) } )
    private readonly tableParams!: TableParams;

    @Prop( { default: '' } )
    private readonly showMapObjectsListType!: MapObjectsViewMode;

    @Prop({ default: () => [] })
    private readonly buttonsExportActions!: ExportButtonList;
    @Prop({ default: [] })
    private readonly semantics!: { name: string, value: string }[];

    @Prop( { default: false } )
    private readonly showProgressBar!: boolean;
    @Prop({ default: '' })
    private readonly selectSortType!: SortType['value'];

    @Prop({ default: '' })
    private readonly selectedSortSemantic!: string;

    @Prop({ default: [] })
    readonly sortTypes!: SortType[];

    @Prop( { default: () => ([]) } )
    private readonly externalFunctions!: { id: string; text: string; contents: string | null; }[];
    @Prop({ default: () => ([]) })
    readonly tableMapObjects!: (MapObject | null)[];
    @Prop( { default: false } )
    private readonly isReducedSizeInterface!: boolean;
    @Prop({ default: () => ([]) })
    readonly objectAllDocuments!: { key: string, name: string, itemList: GallerySemanticItem[] }[];
    @Prop({ default: () => 0 })
    readonly currentObjectIndex!: number;
    @Prop({default: false})
    readonly onlyFilled!: boolean;
}
