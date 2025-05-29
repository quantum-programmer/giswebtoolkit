/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Задача измерений по карте                        *
 *                                                                  *
 *******************************************************************/

import MapWindow from '~/MapWindow';
import Task from '~/taskmanager/Task';
import GwtkPrintMapWidget from './GwtkPrintMapWidget.vue';
import { LogEventType } from '~/types/CommonTypes';
import { GwtkComponentDescriptionPropsData } from '~/types/Types';
import SelectPrintFrame from '@/components/GwtkPrintMap/actions/SelectPrintFrame';
import { AppendPointActionState } from '~/systemActions/AppendPointAction';
import html2canvas from 'html2canvas';
import Rectangle from '~/geometry/Rectangle';
import { Bounds, BoundsGeo, PrintItems } from '@/components/GwtkPrintMap/Types';
import { BrowserService } from '~/services/BrowserService';
import PixelPoint from '~/geometry/PixelPoint';
import { MAP_OBJECT_PANEL_COMPONENT } from '~/taskmanager/TaskManager';
import i18n from '@/plugins/i18n';
import GwtkError from '~/utils/GwtkError';
import { PROJECT_SETTINGS_LAYERS_DYNAMIC_LABEL } from '~/utils/WorkspaceManager';

export const SELECT_MAP_FRAME_ACTION = 'gwtkprintmap.selectmapframe';
export const SAVE_TO_FILE = 'gwtkprintmap.savetofile';
export const SEND_TO_PRINTER = 'qwtkprintmap.sendtoprinter';
export const COMMENT_STRING = 'qwtkprintmap.commentstring';
export const UPDATE_MAP_FRAME = 'qwtkprintmap.updatemapframe';
export const MAP_SCALE_CHANGED = 'qwtkprintmap.mapscalechanged';
export const PRINT_SCALE_CHANGED = 'gwtkprintmap.printscalechanged';
export const PRINT_OBJECTS_INFO = 'gwtkprintmap.printobjectsinfo';

export type GwtkPrintMapTaskState = {
    [ SELECT_MAP_FRAME_ACTION ]: boolean;
    [ SAVE_TO_FILE ]: number;
    [ SEND_TO_PRINTER ]: string;
    [ COMMENT_STRING ]: string;
    [ UPDATE_MAP_FRAME ]: Rectangle;
    [ MAP_SCALE_CHANGED ]: string;
    [ PRINT_SCALE_CHANGED ]: string;
    [ PRINT_OBJECTS_INFO ]: boolean;
} & AppendPointActionState;

type WidgetParams = {

    setState: GwtkPrintMapTask['setState'];
    printComment: string;
    imageParams: {
        srcString: string;
        width: number;
        height: number;
    };
    showDialog: boolean;
    scales: number[];
    mapScaleCurrent?: number;
    isPreviewReady: boolean;
    printMapObjects: boolean;
};

/**
 * Задача измерений по карте
 * @class GwtkPrintMapTask
 * @extends Task<GwtkPrintMapTask
 */
export default class GwtkPrintMapTask extends Task {

    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & WidgetParams}
     */
    private readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;

    /**
     * Холст для отображения карты
     * @private
     * @readonly
     * @property canvas {HTMLCanvasElement}
     */
    private canvas: HTMLCanvasElement | undefined = document.createElement( 'canvas' );

    /**
     * Массив состояний скрываемых для печати элементов
     * @private
     * @readonly
     * @property shownElements {string[]}
     */
    private readonly shownElements: string[] = [];

    private readonly mapForPrint;
    private readonly mapDiv = document.createElement( 'div' );

    private printScaleSelected: number | undefined;

    private selectedFrame: Bounds;
    private selectedFrameGeo?: BoundsGeo;

    private readonly maxImageSize = 4960;//формат A3
    private readonly maxTimeout = 10000;
    private readonly minTimeout = 3000;

    private printSelectedObjects = true;

    /**
     * Массив идентификаторов компонентов для печати
     * @private
     * @readonly
     * @property printExtraContent {string[]}
     */
    private readonly printExtraContent: string[] = [MAP_OBJECT_PANEL_COMPONENT];

    /**
     * @constructor GwtkPrintMapTask
     * @param mapWindow {MapWindow} Экземпляр окна карты
     * @param id {string} Идентификатор задачи
     */
    constructor( mapWindow: MapWindow, id: string ) {
        super( mapWindow, id );


        this.actionRegistry.push( {
            getConstructor() {
                return SelectPrintFrame;
            },
            id: SELECT_MAP_FRAME_ACTION,
            active: false,
            enabled: true,
            options: {
                className: 'select-frame-icon',
                title: 'phrases.Select area'
            }
        } );

        this.printSelectedObjects = this.isObjectPanelActive;

        // Создание Vue компонента
        this.widgetProps = {
            description: this.mapWindow.getTaskManager().getTaskDescription( this.id ),
            taskId: this.id,
            setState: this.setState.bind( this ),
            printComment: '',
            imageParams: {
                srcString: '',
                width: 0,
                height: 0
            },
            scales: [],
            showDialog: false,
            mapScaleCurrent: undefined,
            isPreviewReady: false,
            printMapObjects: this.isObjectPanelActive
        };

        let width = 0, height = 0;
        const canvas = this.map._getCanvas();
        if ( canvas ) {
            const canvasWidth = canvas.getAttribute( 'width' );
            const canvasHeight = canvas.getAttribute( 'height' );

            if ( canvasWidth ) {
                width = +canvasWidth;
            }
            if ( canvasHeight ) {
                height = +canvasHeight;
            }

        }
        this.selectedFrame = {
            left: 0,
            top: 0,
            width,
            height
        };
        const point1 = this.map.pixelToGeo( new PixelPoint( this.selectedFrame.left, this.selectedFrame.top ) );
        const point2 = this.map.pixelToGeo( new PixelPoint( this.selectedFrame.left + this.selectedFrame.width, this.selectedFrame.top + this.selectedFrame.height ) );

        if ( point1 && point2 ) {
            this.selectedFrameGeo = { point1, point2 };

            this.getPrintScaleList( this.selectedFrame.width, this.selectedFrame.height );
            this.printScaleSelected = this.map.getZoomScale( +this.map.options.tilematrix );


            this.mapForPrint = this.createMapForPrint();
            window.setTimeout( () => this.getPrintImage( this.selectedFrameGeo! ), this.minTimeout );

            this.onAfterPrint = this.onAfterPrint.bind( this );
            this.onOverlayRefresh = this.onOverlayRefresh.bind( this );
        }
    }

    setup() {
        window.addEventListener( 'afterprint', this.onAfterPrint );

        // Изменение масштаба
        // @ts-ignore
        $( this.map.eventPane ).on( 'overlayRefresh', this.onOverlayRefresh );

    }

    private onOverlayRefresh( result: { cmd: string; } ) {
        if ( result.cmd === 'zoom' ) {
            this.setState( MAP_SCALE_CHANGED, '' );
        }
    }

    protected destroy() {
        super.destroy();
        window.removeEventListener( 'afterprint', this.onAfterPrint );

        // @ts-ignore
        $( this.map.eventPane ).off( 'overlayRefresh', this.onOverlayRefresh );

        this.mapForPrint?.destroy();
        document.body.removeChild( this.mapDiv );
        this.canvas = undefined;
    }

    createTaskPanel() {
        // регистрация Vue компонента
        const name = 'GwtkPrintMapWidget';
        const source = GwtkPrintMapWidget;
        this.mapWindow.registerComponent( name, source );

        this.mapWindow.createWidget( name, this.widgetProps );

        // Помещаем в список удаления после деактивации
        this.addToPostDeactivationList( this.widgetProps );
    }

    setState<K extends keyof GwtkPrintMapTaskState>( key: K, value: GwtkPrintMapTaskState[ K ] ) {
        switch ( key ) {
            case SELECT_MAP_FRAME_ACTION:
                this.setAction( SELECT_MAP_FRAME_ACTION, true );
                this.mapWindow.addSnackBarMessage(i18n.tc('phrases.Select an area of the map'));
                break;
            case UPDATE_MAP_FRAME:
                this.setFrame( value as Rectangle );
                this.getPrintScaleList( this.selectedFrame.width, this.selectedFrame.height );
                this.setViewCurrent();
                break;
            case SAVE_TO_FILE:
                this.printToFiles( value as number );
                break;
            case SEND_TO_PRINTER:
                this.printContent();
                break;
            case COMMENT_STRING:
                this.widgetProps.printComment = value as string;
                break;
            case MAP_SCALE_CHANGED:
                this.updateScaleCurrent();
                break;
            case PRINT_SCALE_CHANGED:
                this.printScaleSelected = value as number;
                this.setViewCurrent();
                break;
            case PRINT_OBJECTS_INFO:
                this.printSelectedObjects = value as boolean;
                break;
            default:
                if ( this._action ) {
                    this._action.setState( key, value );
                }
        }
    }

    private setAction( id: string, active: boolean ) {
        if ( active ) {
            this.doAction( id );
        } else {
            this.quitAction( id );
        }
    }

    private setFrame( frame: Rectangle ) {
        this.selectedFrame.left = frame.left;
        this.selectedFrame.top = frame.top;
        this.selectedFrame.width = frame.width;
        this.selectedFrame.height = frame.height;


        const point1 = this.map.pixelToGeo( new PixelPoint( this.selectedFrame.left, this.selectedFrame.top ) );
        const point2 = this.map.pixelToGeo( new PixelPoint( this.selectedFrame.left + this.selectedFrame.width, this.selectedFrame.top + this.selectedFrame.height ) );

        if ( point1 && point2 ) {
            this.selectedFrameGeo = { point1, point2 };

            window.setTimeout(() => {
                this.setAction(SELECT_MAP_FRAME_ACTION, false);
            }, 30);

            this.widgetProps.showDialog = true;
        }
    }

    private updateScaleCurrent() {
        this.widgetProps.mapScaleCurrent = Math.round( this.map.getZoomScale( Number( this.map.options.tilematrix ) ) );
    }

    private getPrintScaleList( width: number, height: number ) {

        const lengthMax = width > height ? width : height;

        let zoomMax = this.map.options.tilematrix;

        let doubledLengthMax = lengthMax;
        for ( let zoom = this.map.options.tilematrix; zoom < 24; zoom++ ) {
            doubledLengthMax *= 2;
            if ( doubledLengthMax > this.maxImageSize ) {
                break;
            }
            zoomMax++;
        }

        this.widgetProps.scales.length = 0;


        for ( let zoom = 2; zoom <= zoomMax; zoom++ ) {
            const scale = this.map.getZoomScale( zoom );
            if ( scale ) {
                this.widgetProps.scales.push( Math.round( scale ) );
            }
        }

        this.widgetProps.mapScaleCurrent = Math.round( this.map.getZoomScale( this.map.options.tilematrix ) );
    }

    private setViewCurrent() {
        if ( this.selectedFrameGeo ) {
            const geo1 = this.selectedFrameGeo.point1;
            const geo2 = this.selectedFrameGeo.point2;

            let bounds: Bounds = { left: 0, top: 0, width: 0, height: 0 };

            let zoom = this.mapForPrint!.getScaleZoom( this.printScaleSelected );

            let needToZoomOut = true;
            while ( needToZoomOut ) {

                if ( this.mapForPrint!.options.tilematrix !== zoom ) {
                    this.mapForPrint!.options.tilematrix = zoom;

                    if ( this.mapForPrint!.tiles ) {
                        this.mapForPrint!.tiles._origin = this.mapForPrint!.getPixelMapTopLeft().round();
                    }
                    this.mapForPrint!.tilePane.style.left = '0px';
                    this.mapForPrint!.tilePane.style.top = '0px';
                }

                const pixel1 = this.mapForPrint!.geoToPixel( geo1 );
                const pixel2 = this.mapForPrint!.geoToPixel( geo2 );

                bounds = {
                    left: pixel1.x,
                    top: pixel1.y,
                    width: pixel2.x - pixel1.x,
                    height: pixel2.y - pixel1.y,
                };

                if ( bounds.width > this.maxImageSize || bounds.height > this.maxImageSize ) {
                    zoom--;
                } else {
                    needToZoomOut = false;
                }
            }

            this.mapDiv.style.width = bounds.width + 'px';
            this.mapDiv.style.height = bounds.height + 'px';

            if ( this.mapForPrint && this.canvas ) {
                this.mapForPrint.setCanvasByBounds( bounds, this.canvas );
                const centerGeo = geo1.copy();
                centerGeo.setLongitude( (geo2.getLongitude() + geo1.getLongitude()) / 2 );
                centerGeo.setLatitude( (geo2.getLatitude() + geo1.getLatitude()) / 2 );

                this.mapForPrint.setView( centerGeo.toMapPoint(), zoom );
            }
            //timeout, чтобы карта успела отрисоваться без выбранной рамки
            let timeout = this.minTimeout;
            if ( zoom >= 14 ) {
                timeout = this.maxTimeout;
            }
            this.widgetProps.isPreviewReady = false;
            window.setTimeout( () => this.getPrintImage( this.selectedFrameGeo! ), timeout );
        }
    }

    private createMapForPrint() {
        if ( this.canvas ) {

            let newOptions = JSON.parse( JSON.stringify( this.map.options ) );
            delete newOptions.matrix;
            delete newOptions.controls;


            newOptions.noStorage = true;
            newOptions.tilematrix = this.map.options.tilematrix;

            this.mapDiv.id = 'dvMapPrint_' + Date.now();
            this.mapDiv.style.display = 'none';

            const size = this.map.getSize();

            this.mapDiv.style.width = size.x + 'px';
            this.mapDiv.style.height = size.y + 'px';

            this.map.setCanvasByBounds( { left: 0, top: 0, width: size.x, height: size.y }, this.canvas );

            const div = document.createElement( 'div' );
            div.classList.add( 'gwtk-controls-panel' );
            this.mapDiv.appendChild( div );

            document.body.append( this.mapDiv );

            const dynamicLabelData = this.map.workspaceManager.getValue(PROJECT_SETTINGS_LAYERS_DYNAMIC_LABEL);
            // создаем карту для preview
            const map = new GWTK.Map(this.mapDiv.id, newOptions );
            map.workspaceManager.setValue(PROJECT_SETTINGS_LAYERS_DYNAMIC_LABEL, dynamicLabelData);
            map.setView( this.map.getCenter(), this.map.getScaleZoom( this.printScaleSelected ) );

            for ( let layerNumber = 0; layerNumber < this.map.layers.length; layerNumber++ ) {
                if ( map.layers[ layerNumber ].visible !== this.map.layers[ layerNumber ].visible ) {
                    map.setLayerVisibility( map.layers[ layerNumber ], this.map.layers[ layerNumber ].visible );
                }

            }

            return map;
        }
    }

    private async getPrintImage( boundsGeo: BoundsGeo ) {

        if ( this.mapForPrint && this.canvas && this.canvas.width && this.canvas.height ) {

            const pixel1 = this.mapForPrint.geoToPixel( boundsGeo.point1 );
            const pixel2 = this.mapForPrint.geoToPixel( boundsGeo.point2 );

            const bounds = {
                left: pixel1.x,
                top: pixel1.y,
                width: pixel2.x - pixel1.x,
                height: pixel2.y - pixel1.y
            };

            this.mapForPrint.drawMapImageTo( bounds, this.canvas );

            const elements = document.querySelectorAll<HTMLElement>( '.svgdrawing-panel, .draw-panel, .v-navigation-drawer__content, .tooltip-panel' );
            const elementsToCanvas: HTMLElement[] = [];
            let tooltipElement: HTMLElement | undefined;
            elements.forEach( element => {
                if ( parseFloat( element.style.width ) > 1 ) {
                    elementsToCanvas.push( element );
                } else if ( element.classList.contains( 'tooltip-panel' ) && element.childElementCount > 0 ) {
                    tooltipElement = element;
                }
            } );

            if ( tooltipElement ) {
                // рисуем тултипы поверх остального
                elementsToCanvas.push( tooltipElement );
            }

            const pixelOffset1 = this.map.geoToPixel( boundsGeo.point1 );

            const zoom = this.map.options.tilematrix;
            const zoomPreview = this.mapForPrint.options.tilematrix;
            const matrix = this.map.tileMatrix;
            const scaleSource = matrix.getScaleByZoom( zoom );
            const scaleDest = matrix.getScaleByZoom( zoomPreview );
            const scaleFactor = scaleDest / scaleSource;

            try {
                for ( let elementNumber = 0; elementNumber < elementsToCanvas.length; elementNumber++ ) {
                    const currentElement = elementsToCanvas[ elementNumber ];

                    const canvas = await html2canvas( currentElement, {
                        width: bounds.width * scaleFactor,
                        height: bounds.height * scaleFactor,
                        backgroundColor: null,
                        x: pixelOffset1.x,
                        y: pixelOffset1.y,
                        scale: 1 / scaleFactor,
                        logging: false
                    } );

                    await this.canvas.getContext( '2d' )!.drawImage(
                        canvas as CanvasImageSource,
                        bounds.left / scaleFactor,
                        bounds.top / scaleFactor,
                        canvas.width,
                        canvas.height,
                        bounds.left / scaleFactor,
                        bounds.top / scaleFactor,
                        this.canvas.width,
                        this.canvas.height );

                }
                this.widgetProps.imageParams.srcString = this.canvas.toDataURL();
                this.widgetProps.imageParams.width = this.canvas.width;
                this.widgetProps.imageParams.height = this.canvas.height;
            } catch ( error ) {
                const gwtkError = new GwtkError(error);
                this.map.writeProtocolMessage( {
                    text: i18n.tc( 'phrases.Print of map' ) + '. ' + i18n.tc( 'phrases.Error' ),
                    description: gwtkError.message,
                    type: LogEventType.Error
                } );
            }
        }

        this.widgetProps.isPreviewReady = true;
    }

    private async printContent() {

        this.shownElements.length = 0;

        for ( let i = 0; i < document.body.childNodes.length; i++ ) {
            let elem = document.body.childNodes[ i ];
            if ( elem instanceof HTMLElement ) {
                if ( ['HTMLElement', 'HTMLScriptElement'].indexOf( elem.constructor.name ) == -1 ) {
                    // сохранить видимость элементов
                    this.shownElements.push( elem.style.display );
                    elem.style.display = 'none';
                }
            }
        }

        const fragment = document.createDocumentFragment();

        const mapCont = document.createElement( 'div' );
        mapCont.className = 'printmap_container';

        if ( this.canvas ) {
            this.canvas.className = 'printmap_photo imgcanvas printmap_photo-print';
            let canCont = document.createElement( 'div' );
            canCont.appendChild( this.canvas );
            mapCont.appendChild( canCont );
        }

        const comment = this.widgetProps.printComment;
        mapCont.append( comment );
        let printHtml: HTMLDivElement | undefined = undefined;
        if ( this.printSelectedObjects ) {
            printHtml = await this.getObjectListHtml();
            if ( printHtml ) {
                mapCont.appendChild( printHtml );
            }
        }

        fragment.appendChild( mapCont );

        document.body.prepend( fragment );

        window.setTimeout( () => {
            window.print();
            if ( printHtml ) {
                printHtml.remove();
            }
        }, 1000 );

    }

    private async getObjectListHtml() {
        const taskManager = this.mapWindow.getTaskManager();
        let printHtml = await taskManager.componentPrintHtmlContent( MAP_OBJECT_PANEL_COMPONENT );
        if ( !printHtml || printHtml.children.length === 0 ) {
            return printHtml;
        }
        const captionDiv = document.createElement( 'div' );
        captionDiv.classList.add( 'font-weight-bold' );
        captionDiv.classList.add( 'mb-20' );
        captionDiv.style.display = 'flex';
        captionDiv.style.fontSize = '20px';
        captionDiv.style.justifyContent = 'center';
        captionDiv.textContent = i18n.tc( 'phrases.Map objects' );
        printHtml.prepend( captionDiv );

        return printHtml;
    }

    /**
     * Восстановление карты после печати
     * @private
     * @method onAfterPrint
     */
    private onAfterPrint() {
        if ( this.canvas ) {
            this.canvas.className = '';
        }

        document.body.querySelector( 'div.printmap_container' )?.remove();
        let number = 0;
        for ( let i = 0; i < document.body.childNodes.length; i++ ) {
            let elem = document.body.childNodes[ i ];
            if ( elem instanceof HTMLElement ) {
                if ( ['HTMLElement', 'HTMLScriptElement'].indexOf( elem.constructor.name ) == -1 ) {
                    // восстановить видимость элементов
                    let display = this.shownElements[ number ];
                    elem.style.display = display || '';
                    number++;
                }
            }
        }
    }

    /**
     * Печать изображения карты в файл
     * @private
     * @method saveFrameToFile
     */
    private saveFrameToFile( printItem: PrintItems ) {
        if ( !this.canvas ) {
            return;
        }
        let filename = 'printmap.';
        let fileFormat = 'image/';

        if ( printItem === PrintItems.filePng ) {
            filename += 'png';
            fileFormat += 'png';
        }
        if ( printItem === PrintItems.fileJpg ) {
            filename += 'jpg';
            fileFormat += 'jpeg';
        }

        const href = this.canvas.toDataURL( fileFormat );
        try {
            BrowserService.downloadLink(href, filename);
        } catch(error) {
            this.map.writeProtocolMessage({ text: error as string, type: LogEventType.Error, display: false });
        }
    }

    /**
     * Активность панели объектов
     * @public
     * @property isObjectPanelActive
     */
    get isObjectPanelActive() {

        const objectPanelActive = this.mapWindow.getTaskManager().objectPanelActive;
        const taskIncluded = this.printExtraContent.includes(MAP_OBJECT_PANEL_COMPONENT);
        const objectsEnabled = this.map.searchManager.mapObjects.length > 0 ||
            this.map.getSelectedObjects().length > 0;

        return (objectPanelActive && taskIncluded && objectsEnabled);
    }

    onSelectObjects() {
        this.widgetProps.printMapObjects = this.isObjectPanelActive;
    }

    onSearchResultChanged() {
        this.widgetProps.printMapObjects = this.isObjectPanelActive;
    }

    /**
     * Печать списка объектов в файл
     * @private
     * @method saveObjectsListToFile
     */
    private saveObjectsListToFile() {
        if (!this.printSelectedObjects) {
            return;
        }
        const taskManager = this.mapWindow.getTaskManager();
        const filedata = taskManager.componentPrintTextContent( MAP_OBJECT_PANEL_COMPONENT );

        if ( filedata && filedata.length > 0 ) {
            const title = '\r\n%20%20%20%20%20%20%20%20' + encodeURIComponent( i18n.tc( 'phrases.Map objects' ) );
            const filecontent = title + encodeURIComponent( filedata );
            const href = `data:txt/plane;charset=utf-8, ${filecontent}`;
            const filename = 'printmapobjects.txt';
            try {
                BrowserService.downloadLink(href, filename);
            } catch(error) {
                this.map.writeProtocolMessage({ text: error as string, type: LogEventType.Error, display: false });
            }
        }
    }

    /**
     * Печать в файлы
     * @private
     * @method printToFiles
     */
    private printToFiles( printItem: PrintItems ) {
        this.saveFrameToFile( printItem );
        this.saveObjectsListToFile();
    }

}
