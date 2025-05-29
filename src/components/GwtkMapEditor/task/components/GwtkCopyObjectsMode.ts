/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                     Панель режима копирования объектов           *
 *                                                                  *
 *******************************************************************/

import { Component, Prop, Vue } from 'vue-property-decorator';
import {
    COPY_OBJECTS_ACTION, CopyActionInfo,
    GwtkMapEditorTaskState,
    SELECT_LAYER_FOR_COPY,
    SET_COPY_OBJECT_DELETE_ORIGINAL,
    SET_COPY_OBJECT_OPERATION,
    SET_COPY_OBJECT_PANEL_FINAL,
} from '../../task/GwtkMapEditorTask';
import { CopyObjectOperation } from '../../actions/CopyObjectsAction';
import { MapObjectType } from '~/mapobject/MapObject';


/**
 * Виджет компонента
 * @class GwtkCopyObjectsMode
 * @extends BaseGwtkVueComponent
 */
@Component
export default class GwtkCopyObjectsMode extends Vue {

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkMapEditorTaskState>( key: K, value: GwtkMapEditorTaskState[K] ) => void;

    @Prop( { default: () => ([]) } )
    private readonly layerItems!: { id: string; text: string; }[];

    @Prop( { default: () => ({}) } )
    private readonly copyActionInfo!: CopyActionInfo;

    private selectLayerForCopy( id: string ): void {
        this.setState( SELECT_LAYER_FOR_COPY, id );
    }

    private toggleExecute(): void {
        this.setState( SET_COPY_OBJECT_PANEL_FINAL, undefined );
    }

    private toggleCancel(): void {
        this.setState( COPY_OBJECTS_ACTION, false );
    }

    private toggleCopyObjectOperation( operation: CopyObjectOperation ): void {
        this.setState( SET_COPY_OBJECT_OPERATION, operation );
    }

    private toggleDeleteOriginalObjects( value: boolean ): void {
        this.setState( SET_COPY_OBJECT_DELETE_ORIGINAL, value );
    }

    private get layerNameForCopy(): string | undefined {
        const layerItem = this.layerItems.find( item => item.id === this.copyActionInfo.selectedLayerXId );
        return layerItem ? layerItem.text : undefined;
    }

    private get layerNameOriginal(): string | undefined {
        return this.copyActionInfo.currentObject ? this.copyActionInfo.currentObject.vectorLayer.alias : undefined;
    }

    private get objectType(): string {
        let type;
        switch ( this.copyActionInfo.currentObject!.type ) {
            case MapObjectType.Polygon:
            case MapObjectType.MultiPolygon:
                type = this.$t( 'mapeditor.Areal' ) + '';
                break;
            case MapObjectType.LineString:
            case MapObjectType.MultiLineString:
                type = this.$t( 'mapeditor.Linear' ) + '';
                break;
            case MapObjectType.Point:
            case MapObjectType.MultiPoint:
                type = this.$t( 'mapeditor.Point' ) + '';
                break;
            default:
                type = '-';
        }
        return type;
    }

    private get defaultValue(): string {
        return '(' + this.$t( 'phrases.Undefined' ).toString().toLowerCase() + ')';
    }


}
