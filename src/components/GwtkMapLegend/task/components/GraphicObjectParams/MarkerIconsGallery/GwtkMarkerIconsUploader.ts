/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *          Виджет компонента "Загрузка изображения маркера"        *
 *                                                                  *
 *******************************************************************/

import { Component, Prop, Vue } from 'vue-property-decorator';
import { BrowserService } from '~/services/BrowserService';
import { MarkerIcon } from '~/types/Types';
import { ImageBase64 } from '~/services/BrowserService/BrowserService';

@Component
export default class GwtkMarkerIconsUploader extends Vue {

    @Prop( { default: 0 } )
    private readonly imageCategoryIndex!: number;

    @Prop( { default: () => [] } )
    private readonly imageCategories!: { name: string, id: number }[];

    private fileName = '';

    private imageBase64: ImageBase64 = { src: '', width: 0, height: 0, fileSize: 0 };

    private imageName = '';
    private isLoading = false;

    private toggleSelect() {
        this.openImageFile( ['image/*'] );
    }

    private async openImageFile( accept?: string[] ) {
        const fileResult = await BrowserService.openFileDialog( accept );

        if ( fileResult && fileResult[ 0 ] ) {
            const file = fileResult[ 0 ];
            return this.readImageFile( file );
        }

        return Promise.reject( 'Cannot open file' );
    }

    private async readImageFile( file: File ) {
        this.imageBase64.src = '';
        this.imageName = '';
        this.isLoading = false;

        if ( file ) {

            this.fileName = file.name;
            this.imageName = file.name.substr( 0, file.name.lastIndexOf( '.' ) );

            this.imageBase64 = await BrowserService.blobToImageBase64( file );
        }
    }

    private toggleUpload() {
        this.isLoading = !this.isLoading;

        if ( this.isLoading ) {

            const markerIcon: MarkerIcon = {
                id: 0,
                image: JSON.parse( JSON.stringify( this.imageBase64 ) ),
                name: this.imageName,
                categoryId: this.imageCategoryIndex
            };

            this.$emit( 'uploadImage', markerIcon );

            this.toggleCancel();
        }
    }

    private toggleCancel() {
        this.isLoading = false;
        this.imageBase64.src = '';
        this.imageName = '';
        this.$emit( 'cancel' );
    }

    private changeCategory( index: number ) {
        this.$emit( 'setCategory', index );
    }

    private closeFile() {
        this.isLoading = false;
        this.imageBase64.src = '';
        this.imageName = '';
    }
}
