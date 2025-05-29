/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                     Виджет задачи Метки на карте                 *
 *                                                                  *
 *******************************************************************/
import { Component, Prop } from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import { TaskDescription } from '~/taskmanager/TaskManager';
import {
    GwtkMapMarksTaskState,
    MarkerTemplate,
    MarkSetIdList,
    MARK_SET_NEW,
    CREATE_MARK_TOGGLE,
    MARK_SET_NAME,
    MARK_SET_VISIBILITY,
    MARK_SET_REMOVE,
    MARK_LIST_TOGGLE
} from '@/components/GwtkMapMarks/task/GwtkMapMarksTask';
import GwtkMapMarkWidget from '@/components/GwtkMapMarks/components/GwtkMapMarkWidget/GwtkMapMarkWidget.vue';
import GwtkMapMarkListWidget from '@/components/GwtkMapMarks/components/GwtkMapMarkListWidget/GwtkMapMarkListWidget.vue';
import MapObject from '~/mapobject/MapObject';


@Component( { components: { GwtkMapMarkWidget, GwtkMapMarkListWidget } } )
export default class GwtkMapMarksWidget extends BaseGwtkVueComponent {

    @Prop( { default: '' } )
    private readonly taskId!: string;

    @Prop( { default: () => ({}) } )
    private readonly description!: TaskDescription;

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkMapMarksTaskState>( key: K, value: GwtkMapMarksTaskState[K] ) => void;

    @Prop({ default: () => ([]) })
    private readonly markSetIdList!: MarkSetIdList;

    @Prop( { default: '' } )
    private readonly selectedSetId!: string;

    @Prop( { default: '' } )
    private readonly markCoordinates!: string;

    @Prop( { default: '' } )
    private readonly markName!: string;

    @Prop( { default: '' } )
    private readonly markSetName!: string;

    @Prop( { default: true } )
    private readonly markSetVisibility!: boolean;

    @Prop( { default: '' } )
    private readonly markerColor!: string;

    @Prop( { default: {} } )
    private readonly markerList!: MarkerTemplate[];

    @Prop( { default: '' } )
    private readonly selectedMarkerId!: string;

    @Prop( { default: '' } )
    private readonly commentary!: string;

    @Prop({ default: () => ([]) })
    private readonly mapObjects!: MapObject[];

    @Prop({ default: () => ([]) })
    private readonly selectedMapObjects!: string[];

    @Prop( { default: false } )
    private readonly markListToggle!: boolean;

    private createMarkSetActive: boolean = false;

    private createMarkActive: boolean = false;

    get showMarkList() {
        return this.markListToggle;
    }

    get markListActive() {
        return ( this.showMarkList && this.mapObjects.length > 0 );
    }

    get selectedMarkSetVisible() {
        return this.markSetVisibility;
    }

    get currentMarkSetName() {
        return this.markSetName;
    }

    set currentMarkSetName( value: string ) {
        this.setState( MARK_SET_NAME, value );
    }

    private changeMarkSetVisibility( value: boolean) {
        this.setState( MARK_SET_VISIBILITY, value );
    }

    private removeMarkSet() {
        this.setState( MARK_SET_REMOVE, this.selectedSetId );
        this.setState( MARK_LIST_TOGGLE, false );
    }

    private createMarkSetToggle() {
        if ( !this.createMarkSetActive ) {
            this.setState( MARK_SET_NAME, '' );
        }
        this.createMarkSetActive = !this.createMarkSetActive;
        this.setState( MARK_LIST_TOGGLE, false );
    }
    private createMarkSet() {
        const listItem = this.markSetIdList.find( item => item.name === this.markSetName );
        if ( listItem ) {
            this.mapVue.addSnackBarMessage( this.markSetName + ' : ' + this.$t( 'mapmarks.Mark set with the name already exists' ) );
            return;
        }

        if ( this.createMarkSetActive ) {
            if ( !this.markSetName || this.markSetName === '') {
                return;
            }
            this.setState( MARK_SET_NEW, this.markSetName );
            this.createMarkActive = true;
            this.setState( CREATE_MARK_TOGGLE, true );
        }

        this.createMarkSetToggle();

        this.createMarkActive = !this.createMarkSetActive;

    }

    private changeMarkSet( id: string ) {
        const listItem = this.markSetIdList.find( item => item.id === id );
        if ( listItem ) {
            this.setState( MARK_SET_NAME, listItem.name );
            if ( this.showMarkList ) {
                this.showMarkListToggle();
            }
        }
    }

    private createMarkToggle() {
        this.createMarkActive = !this.createMarkActive;
        this.setState( CREATE_MARK_TOGGLE, this.createMarkActive );
        if ( this.createMarkActive ) {
            this.setState( MARK_LIST_TOGGLE, false );
        }
    }

    private showMarkListToggle() {
        this.setState( MARK_LIST_TOGGLE, !this.showMarkList );
        this.createMarkActive = false;
        this.setState( CREATE_MARK_TOGGLE, false );
    }

    namesRule = [
        ( v: string ) => { if ( !v ) return false; return v.length > 0; }
    ];

}
