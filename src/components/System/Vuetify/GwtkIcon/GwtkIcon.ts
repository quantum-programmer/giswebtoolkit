import { Component, Vue, Prop } from 'vue-property-decorator';

@Component
export default class GwtkIcon extends Vue {

    @Prop( { required: true } )
    private readonly name!: string;

    @Prop( { default: 24 } )
    private readonly size!: number;

    @Prop( { default: '' } )
    private readonly color!: string;

    @Prop( { default: false } )
    private readonly primary!: boolean | '';

    private get iconSrc(): string {
        let src = require( `../assets/icons/${this.name}.svg?sprite` );
        if (Object.prototype.hasOwnProperty.call(src, 'default')) {
            src = src.default;
        }


        return src;
    }

    private get isMaterialDesignIcon(): boolean {
        return this.name.indexOf( 'mdi-' ) === 0;
    }

}