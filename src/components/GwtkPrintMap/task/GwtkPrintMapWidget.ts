/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Виджет компонента Печать карты                   *
 *                                                                  *
 *******************************************************************/


import { Component, Prop } from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import {
    COMMENT_STRING,
    GwtkPrintMapTaskState, PRINT_SCALE_CHANGED,
    SAVE_TO_FILE, SELECT_MAP_FRAME_ACTION,
    SEND_TO_PRINTER, PRINT_OBJECTS_INFO
} from '@/components/GwtkPrintMap/task/GwtkPrintMapTask';
import { TaskDescription } from '~/taskmanager/TaskManager';
import { PrintItems } from '@/components/GwtkPrintMap/Types';


/**
 * Виджет компонента
 * @class GwtkPrintMapWidget
 * @extends BaseGwtkVueComponent
 */
@Component
export default class GwtkPrintMapWidget extends BaseGwtkVueComponent {

    @Prop( { default: '' } )
    private readonly taskId!: string;

    @Prop( { default: () => ({}) } )
    private readonly description!: TaskDescription;

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkPrintMapTaskState>( key: K, value: GwtkPrintMapTaskState[K] ) => void;

    @Prop( { default: () => ({}) } )
    private readonly imageParams!: {
        srcString: string;
        width: number;
        height: number
    };

    @Prop( { default: '' } )
    private readonly printComment!: string;

    @Prop( { default: () => ([]) } )
    private readonly scales!: number[];

    @Prop( { default: 0 } )
    private readonly mapScaleCurrent!: number;

    @Prop( { default: true } )
    private readonly isPreviewReady!: boolean;

    @Prop( { default: true } )
    private readonly printMapObjects!: boolean;

    private readonly printItems = [
        this.$t( 'phrases.Printer' ),
        this.$t( 'phrases.Save as' ) + ' PNG',
        this.$t( 'phrases.Save as' ) + ' JPG'
    ];

    private printItemSelected = this.printItems[ PrintItems.printer ];

    private printScaleSelected: number | undefined;

    private previewWidth = 100;
    private previewHeight = 100;

    get showTextArea() {
        return this.printItemSelected === this.printItems[ PrintItems.printer ];
    }

    private printSelectedObjectInfo = false;

    get printMapObjectsInfo() {
        return this.printSelectedObjectInfo && this.printMapObjects;
    }

    onPrintMapObjectsInfo() {
        this.printSelectedObjectInfo = !this.printSelectedObjectInfo;
        this.setState( PRINT_OBJECTS_INFO, this.printSelectedObjectInfo );
    }


    created() {
        this.printScaleSelected = this.scales.find( scale => scale === this.mapScaleCurrent );
    }

    mounted() {
        const panel = this.$refs[ 'previewContainer' ] as HTMLDivElement;
        if ( panel && panel.getBoundingClientRect ) {
            const previewContainerRect = panel.getBoundingClientRect();
            this.previewWidth = previewContainerRect.width;
            this.previewHeight = previewContainerRect.height;
        }

    }

    private printScaleChanged( scale: string ) {
        this.setState( PRINT_SCALE_CHANGED, scale );
        this.printScaleSelected = Number( scale );
    }

    private commentChanged( value: string ) {
        this.setState( COMMENT_STRING, value );
    }

    private printMap() {
        if ( this.printItemSelected === this.printItems[ PrintItems.printer ] ) {
            this.setState( SEND_TO_PRINTER, '' );
        }
        if ( this.printItemSelected === this.printItems[ PrintItems.filePng ] ) {
            this.setState( SAVE_TO_FILE, PrintItems.filePng );
        }
        if ( this.printItemSelected === this.printItems[ PrintItems.fileJpg ] ) {
            this.setState( SAVE_TO_FILE, PrintItems.fileJpg );
        }
    }

    private selectFrame() {
        this.setState( SELECT_MAP_FRAME_ACTION, true );
    }

    private get chessDivStyle(): { width: string; height: string; } {
        const maxWidth = this.previewWidth;
        const maxHeight = this.previewHeight;

        if ( this.imageParams.width <= maxWidth && this.imageParams.height <= maxHeight ) {
            return {
                width: this.imageParams.width + 'px',
                height: this.imageParams.height + 'px'
            };
        }

        const k = this.imageParams.width / this.imageParams.height;

        const scaleW = maxWidth / this.imageParams.width;
        const scaleH = maxHeight / this.imageParams.height;

        let height = maxHeight;
        let width = maxWidth;

        if ( scaleH < scaleW ) {
            width = height * k;
        } else {
            height = width / k;
        }

        return {
            width: width + 'px',
            height: height + 'px'
        };
    }
}
