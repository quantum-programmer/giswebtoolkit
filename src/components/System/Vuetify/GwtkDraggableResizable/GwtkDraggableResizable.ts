import { Component, Vue, Prop } from 'vue-property-decorator';

@Component
export default class GwtkDraggableResizable extends Vue {
    @Prop( { default: 300 } )
    private readonly minHeight!: number;

    @Prop( { default: 300 } )
    private readonly minWidth!: number;

    @Prop( { default: () => ({}) } )
    private readonly initialPosition!: { x: number; y: number; width: number; height: number; };

    private x = 0;
    private y = 0;
    private w = 0;
    private h = 0;

    created() {
        this.x = this.initialPosition.x || 0;
        this.y = this.initialPosition.y || 0;
        this.w = this.initialPosition.width || this.minWidth;
        this.h = this.initialPosition.height || this.minHeight;
    }

    private onResizing( x: number, y: number, width?: number, height?: number ): void {
        if ( height && height > 0 ) {
            this.h = height;
        }

        if ( width && width > 0 ) {
            this.w = width;
        }

        this.$emit( 'resize', { x, y, width: this.w, height: this.h } );
    }

}