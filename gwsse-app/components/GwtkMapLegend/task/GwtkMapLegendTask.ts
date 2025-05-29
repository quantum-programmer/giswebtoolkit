/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                   Компонент "Легенд карты"                       *
 *                                                                  *
 *******************************************************************/

import GwtkMapLegendTask from '@/components/GwtkMapLegend/task/GwtkMapLegendTask';
import {MapMarkerResponse, MarkerIcon} from '~/types/Types';
import {HttpParams} from '~/services/RequestServices/common/RequestService';
import RequestServices, {ServiceType} from '~/services/RequestServices';
import GwtkError from '~/utils/GwtkError';
import i18n from '@/plugins/i18n';
import {LogEventType} from '~/types/CommonTypes';
import GISWebServerSEService from '../../../service/GISWebServerSEService';

/**
 * Команда создания компонента
 * @class GwtkMapContentTaskGwsse
 * @extends GwtkMapLegendTask
 */
export default class GwtkMapContentTaskGwsse extends GwtkMapLegendTask {

    private readonly iconServiceUrl = new GISWebServerSEService().getDefaults().url + 'admin/query.php';

    async setup(): Promise<void> {
        super.setup();

        // TODO хранение иконок маркера в IndexedDB
        // if ( this.workspaceData && this.workspaceData.markerImageList && this.workspaceData.markerImageList.length ) {
        //
        //     this.workspaceData.markerImageList.forEach( ( item ) => {
        //         this.widgetProps.markerImageList.push( item );
        //     } );
        //
        // }
        //
        // this.workspaceData = { markerImageList: this.widgetProps.markerImageList };
        if (this.map.options.mapmarkers) {

            if (this.map.options.mapmarkers.getcategory) {

                this.mapMarkersCommands.getCategory = this.map.options.mapmarkers.getcategory;

                this.widgetProps.mapMarkersCommands.isGetCategory = true;

                const response = await this.getImageCategoriesFromServer();

                if (response && response.status === 'success' && response.data && response.data.categories) {

                    response.data.categories.forEach((item) =>
                        this.widgetProps.markerCategoryList.push({name: item.name, id: +item.id})
                    );

                }

            }

            if (this.map.options.mapmarkers.getimages) {

                this.mapMarkersCommands.getImages = this.map.options.mapmarkers.getimages;

                await this.fillMarkerImageList();
            }

            if (this.map.options.mapmarkers.deleteimage) {
                this.mapMarkersCommands.deleteImage = this.map.options.mapmarkers.deleteimage;
                this.widgetProps.mapMarkersCommands.isDeleteImage = true;
            }

            if (this.map.options.mapmarkers.saveimage) {
                this.mapMarkersCommands.saveImage = this.map.options.mapmarkers.saveimage;
                this.widgetProps.mapMarkersCommands.isSaveImage = true;
            }

            if (!this.widgetProps.markerImageList.length && this.map.options.mapmarkers.images) {

                for (let i = 0; i < this.map.options.mapmarkers.images.length; i++) {
                    const src = this.map.options.mapmarkers.images[i];

                    const markerIcon: MarkerIcon = {
                        id: i + 1,
                        name: i + 1 + '',
                        categoryId: 1,
                        image: {
                            src,
                            height: 64,
                            width: 64,
                            fileSize: 0
                        }
                    };
                    this.widgetProps.markerImageList.push(markerIcon);

                }
            }


        }
    }

    /**
     * Запросить список категорий изображений для маркера с сервера
     * @method getImageCategoriesFromServer
     * @private
     * @async
     */
    private async getImageCategoriesFromServer(): Promise<MapMarkerResponse | undefined> {
        const url = this.iconServiceUrl;
        const httpParams = {url};
        const options = {
            cmd: this.mapMarkersCommands.getCategory
        };
        const service = RequestServices.retrieveOrCreate(httpParams, ServiceType.COMMON);
        try {
            const response = await service.commonGet<MapMarkerResponse>(options, httpParams);
            return response.data;
        } catch (error) {
            const gwtkError = new GwtkError(error);
            this.map.writeProtocolMessage({
                text: i18n.tc('legend.Map legend') + '. ' + i18n.tc('phrases.Error') + '. ',
                description: gwtkError.message,
                type: LogEventType.Error
            });
        }
    }


    /**
     * Запросить изображения для маркера с сервера
     * @method getImagesFromServer
     * @private
     * @async
     */
    private async getImagesFromServer(): Promise<MapMarkerResponse | undefined> {
        const url = this.iconServiceUrl;

        const httpParams: HttpParams = {
            url,
            responseType: 'json'
        };
        const options = {
            cmd: this.mapMarkersCommands.getImages
        };
        const service = RequestServices.retrieveOrCreate(httpParams, ServiceType.COMMON);
        try {
            const response = await service.commonGet<MapMarkerResponse>(options, httpParams);
            return response.data;
        } catch (error) {
            const gwtkError = new GwtkError(error);
            this.map.writeProtocolMessage({
                text: i18n.tc('legend.Map legend') + '. ' + i18n.tc('phrases.Error') + '. ' + i18n.tc('legend.Image uploading'),
                description: gwtkError.message,
                type: LogEventType.Error
            });
        }
    }


    /**
     * Заполнить массив изображений для маркера
     * @method fillMarkerImageList
     * @private
     * @async
     */
    private async fillMarkerImageList() {
        const response = await this.getImagesFromServer();

        if (response && response.status === 'success' && response.data && response.data.images) {

            this.widgetProps.markerImageList.splice(0);

            response.data.images.forEach((item) => {
                const markerIcon: MarkerIcon = {
                    id: item.id,
                    name: item.name,
                    categoryId: +item.catalogId,
                    image: {
                        src: item.src,
                        height: +item.height,
                        width: +item.width,
                        fileSize: 0
                    }
                };
                this.widgetProps.markerImageList.push(markerIcon);
            });

        }

    }


    /**
     * Отправить изображение для маркера на сервер
     * @method sendImageToServer
     * @param markerIcon - изображение
     * @private
     * @async
     */
    private async sendImageToServer(markerIcon: MarkerIcon): Promise<MapMarkerResponse | undefined> {
        const url = this.iconServiceUrl;
        const httpParams = {
            url,
            responseType: 'json',
            data: {
                name: markerIcon.name,
                width: markerIcon.image.width,
                height: markerIcon.image.height,
                fileSize: markerIcon.image.fileSize,
                src: markerIcon.image.src
            }
        } as HttpParams;
        const options = {
            cmd: this.mapMarkersCommands.saveImage
        };
        const service = RequestServices.retrieveOrCreate(httpParams, ServiceType.COMMON);
        try {
            const response = await service.commonPost<MapMarkerResponse | undefined>(options, httpParams);
            return response.data;
        } catch (error) {
            const gwtkError = new GwtkError(error);
            this.map.writeProtocolMessage({
                text: i18n.tc('legend.Map legend') + '. ' + i18n.tc('phrases.Error') + '. ',
                description: gwtkError.message,
                type: LogEventType.Error
            });
        }

    }

    /**
     * Удалить изображения для маркера с сервера
     * @method removeImageFromServer
     * @param idList - список id изображений для удаления
     * @private
     * @async
     */
    private async removeImageFromServer(idList: string[]): Promise<MapMarkerResponse | undefined> {
        const url = this.iconServiceUrl;

        let ids = '';
        idList.forEach((item) => ids = ids + item + ',');
        ids = ids.substr(0, ids.length - 1);

        const httpParams = {
            url,
            responseType: 'json',
            data: {
                ids
            }
        } as HttpParams;
        const options = {
            cmd: this.mapMarkersCommands.deleteImage
        };
        const service = RequestServices.retrieveOrCreate(httpParams, ServiceType.COMMON);
        try {
            const response = await service.commonPost<MapMarkerResponse | undefined>(options, httpParams);
            return response.data;
        } catch (error) {
            const gwtkError = new GwtkError(error);
            this.map.writeProtocolMessage({
                text: i18n.tc('legend.Map legend') + '. ' + i18n.tc('phrases.Error') + '. ' + i18n.tc('legend.Remove'),
                description: gwtkError.message,
                type: LogEventType.Error
            });
        }

    }


    protected uploadMarker(value: MarkerIcon) {
        this.sendImageToServer(value).then((response) => {
            let errorMessage = '';
            if (response) {
                if (response.status === 'success') {
                    this.fillMarkerImageList();
                } else if (response.error) {
                    errorMessage = response.error;
                }
            } else {
                errorMessage = 'no answer!';
            }
            if (errorMessage) {
                this.map.writeProtocolMessage({
                    text: i18n.tc('legend.Map legend') + '. ' + errorMessage,
                    type: LogEventType.Error
                });
            }
        });
    }

    protected removeMarker(value: string) {
        if (!this.widgetProps.activeRequestCancelHandler) {
            this.widgetProps.activeRequestCancelHandler = () => {
            };
        }

        const itemIndex = this.widgetProps.markerImageList.findIndex(item => (item.id + '') == value);

        if (itemIndex > -1) {

            this.removeImageFromServer([value]).then((response) => {

                if (response && response.status === 'success') {
                    this.widgetProps.markerImageList.splice(itemIndex, 1);
                    // this.writeWorkspaceData(true);//записи в workspace не произойдёт, т.к. нет изменения this.workspaceData.markerImageList
                }

            }).finally(() => {
                this.widgetProps.activeRequestCancelHandler = undefined;
            });
        }
    }
}
