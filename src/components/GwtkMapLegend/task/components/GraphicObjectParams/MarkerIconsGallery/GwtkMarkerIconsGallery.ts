/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *          Виджет компонента "Галерея изображений маркера"         *
 *                                                                  *
 *******************************************************************/

import { Component, Prop, Vue } from 'vue-property-decorator';
import { MapMarkersCommandsFlags, MarkerImageCategory, MarkerIcon } from '~/types/Types';
import GwtkMarkerIconsUploader from './GwtkMarkerIconsUploader.vue';


const DEFAULT_COLOR = '#E756FF';
const DEFAULT_SIZE = 32;

@Component( { components: { GwtkMarkerIconsUploader } } )
export default class GwtkMarkerIconsGallery extends Vue {

    @Prop( { default: () => ([]) } )
    private readonly markerImageList!: MarkerIcon[];

    @Prop( { default: () => ([]) } )
    private readonly markerCategoryList!: MarkerImageCategory[];

    @Prop( { default: () => ({}) } )
    private readonly mapMarkersCommands!: MapMarkersCommandsFlags;

    private fillColorTemp = DEFAULT_COLOR;

    private imageCategoryIndex = 1;

    private addImageMode = false;

    private selectedIndex = 0;

    private lazySrc = '';

    private isRemoving = false;

    private colorPickerDialogFlag = false;

    private get imageCategories() {
        const categories: MarkerImageCategory[] = [];

        if ( this.markerCategoryList.length ) {
            this.markerCategoryList.forEach( ( item ) => categories.push( item ) );
        } else {
            categories.push( { name: this.$t( 'legend.Common' ) + '', id: 1 } );
        }

        return categories;
    }

    private get imagesCountInCurrentCategory() {
        let count = 0;
        this.markerImageList.forEach( ( item ) => {
            if ( item.categoryId === this.imageCategoryIndex ) {
                count++;
            }
        } );

        return count;
    }

    private get categoryImages(): MarkerIcon[] {
        return this.markerImageList.filter( item => item.categoryId === this.imageCategoryIndex );
    }

    private toggleUploadImage() {
        this.addImageMode = true;
    }

    private getImage( index: number ): MarkerIcon | undefined {
        return this.categoryImages[ index ];
    }

    private onCategorySelect( index: number ) {
        this.imageCategoryIndex = index;
        this.selectedIndex = 0;
    }

    private openColorPicker() {
        this.colorPickerDialogFlag = true;
    }

    private onColorPickerSelect() {

        const markerDescription = {
            image: '',
            refX: DEFAULT_SIZE / 2,
            refY: DEFAULT_SIZE / 2,
            width: DEFAULT_SIZE,
            height: DEFAULT_SIZE
        };

        const canvas = document.createElement( 'canvas' );
        canvas.width = markerDescription.width;
        canvas.height = markerDescription.height;
        const context = canvas.getContext( '2d' );
        if ( context ) {
            context.fillStyle = this.fillColorTemp;
            context.arc( markerDescription.refX, markerDescription.refY, DEFAULT_SIZE / 2, 0, 2 * Math.PI );
            context.fill();
        }

        markerDescription.image = canvas.toDataURL();

        this.$emit( 'updateImage', markerDescription );

        this.onColorPickerCancel();
    }

    private onColorPickerCancel() {
        this.colorPickerDialogFlag = false;
    }

    private onImageSelect( index: number ) {
        if ( !this.isRemoving ) {
            this.selectedIndex = index;

            const currentImage = this.getImage( this.selectedIndex - 1 )?.image;
            if ( currentImage ) {
                const markerDescription = {
                    image: currentImage.src,
                    refX: currentImage.width / 2,
                    refY: currentImage.height / 2,
                    width: currentImage.width,
                    height: currentImage.height
                };
                this.$emit( 'updateImage', markerDescription );
            }
        }
    }

    private onImageDelete( index: number ) {
        const id = this.getImage( index - 1 )?.id;

        if ( id ) {
            this.selectedIndex = 0;
            this.$emit( 'removeImage', '' + id );
        }
    }

}
