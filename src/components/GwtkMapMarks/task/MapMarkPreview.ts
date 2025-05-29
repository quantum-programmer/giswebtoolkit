/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Миниатюра карты с Меткой                      *
 *                                                                  *
 *******************************************************************/

import { MapMarkPreviewOptions } from '../task/GwtkMapMarksTask';
import { GwtkMap } from '~/types/Types';
import PixelPoint from '~/geometry/PixelPoint';
import { MapPoint } from '~/geometry/MapPoint';
import { Bounds } from '~/geometry/Bounds';
import { GetMapImageParams } from '~/services/RequestServices/RestService/Types';
import { BrowserService } from '~/services/BrowserService';
import { LogEventType } from '~/types/CommonTypes';
import i18n from '@/plugins/i18n';


const PREVIEW_HEIGHT = 120;
const PREVIEW_WIDTH = 120;

export default class MapMarkPreview {

    private readonly canvas: HTMLCanvasElement = document.createElement('canvas');

    private readonly url: string;

    private readonly zoom: number;

    private readonly map: GwtkMap;

    private readonly height = PREVIEW_HEIGHT;

    private readonly width = PREVIEW_WIDTH;

    private readonly centerPixel: PixelPoint = new PixelPoint( this.width * 0.5, this.height * 0.5 );

    private readonly src: string;

    private getImageParams: GetMapImageParams = {
        FORMAT: '',
        BBOX: '',
        WIDTH: '',
        LAYER: '',
        HEIGHT: '',
        CRS: ''
    };

    constructor( map: GwtkMap, options: MapMarkPreviewOptions ) {
        this.map = map;
        this.zoom = options.zoom;
        this.url = options.url;
        this.src = '?RESTMETHOD=GETIMAGE&SERVICE=WMS&FORMAT=image/jpeg';
        this.getImageParams.CRS = encodeURIComponent( this.map.getCrsString() );
        this.getImageParams.LAYER = options.layerid;
        this.getImageParams.WIDTH = '' + this.width;
        this.getImageParams.HEIGHT = '' + this.height;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    private getSrc() {
        return this.url + this.src + '&LAYERS=' + this.getImageParams.LAYER +
        '&HEIGHT=' + this.getImageParams.HEIGHT + '&WIDTH=' + this.getImageParams.WIDTH +
        '&CRS=' + this.getImageParams.CRS + '&BBOX=' + this.getImageParams.BBOX;
    }

    private fillParameters( mappoint: MapPoint ) {

        const matrix = this.map.Translate.getTileMatix();
        const pixel = mappoint.toPixelPoint( this.zoom );

        const p1 = pixel.subtract( this.centerPixel );
        p1.y = pixel.y + this.height * 0.5;

        const p2 = pixel.add( this.centerPixel );
        p2.y = pixel.y - this.height * 0.5;

        const ne = matrix.getPointByPixel( p1, this.zoom );
        const sw = matrix.getPointByPixel( p2, this.zoom );

        this.getImageParams.BBOX = this.prepareBboxParameter( new Bounds( ne, sw ) );

    }

    private prepareBboxParameter( bbox: Bounds ) {
        if ( this.map.Translate.isGeoSys() ) {
            const geobounds = this.map.tileMatrix.getGeoDegreeFrameFromPlaneFrame( bbox );
            if ( geobounds ) {
                const geobbox = geobounds.toBBox();
                return geobbox.join();
            }
            return '';
        }
        const bboxPlane = [];
        bboxPlane.push( ...bbox.min.toOrigin().slice( 0, 2 ) );
        bboxPlane.push( ...bbox.max.toOrigin().slice( 0, 2 ) );
        return bboxPlane.join( ',' );
    }

    async getImage( mapPoint: MapPoint ): Promise<string> {

        this.getImageParams.BBOX = '';

        this.fillParameters( mapPoint );

        if ( this.getImageParams.BBOX === '' ) {
            return '';
        }

        return await this.getPicture();
    }

    private async getPicture() {
        let result = '';

        try {
            let response = await fetch( this.getSrc(), this.requestOptions );
            if ( !response.ok ) {
                return result;
            }
            let blob = await response.blob();
            const img = await this.blobToImage( blob );
            if ( img ) {
                const ctx = this.canvas.getContext( '2d' );
                if ( ctx && img.src !== '' ) {
                    ctx.clearRect( 0, 0, this.canvas.width, this.canvas.height );
                    ctx.drawImage( img, 0, 0 );
                    ctx.beginPath();
                    ctx.arc ( this.canvas.width * 0.5, this.canvas.height * 0.5, 5, 0, 2*Math.PI );
                    ctx.fillStyle='#F006D8';
                    ctx.fill();
                    ctx.beginPath();
                    ctx.strokeStyle='white';
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.lineWidth = 2;
                    ctx.arc ( this.canvas.width * 0.5, this.canvas.height * 0.5, 6, 0, 2*Math.PI );
                    ctx.stroke();
                    ctx.closePath();

                    result = this.canvas.toDataURL( 'image/jpeg');
                }
            }
        } catch( e ) {
            const message = i18n.tc( 'phrases.Map Marks' ) + '. ' + i18n.tc( 'phrases.Failed to get data' );
            this.map.writeProtocolMessage(
                {
                    text: message + ' ' + this.url,
                    type: LogEventType.Error
                }
            );
            console.log( message );
        }
        return result;
    }

    private get requestOptions() {
        const options: RequestInit = {
            method: 'get',
            mode: 'cors'
        };
        if ( this.map.authTypeServer( this.url ) || this.map.authTypeExternal( this.url ) ) {
            options.credentials = 'include';
        }
        return options;
    }

    private blobToImage( blob: Blob ) {
        return new Promise<HTMLImageElement>( ( resolve, reject ) => {
            const image = new Image();
            image.src = BrowserService.makeObjectURL( blob );
            image.onload = () => {
                resolve( image );
            };
            image.onerror = ( event: Event | string ) => {
                reject( event );
            };
        } );
    }



}
