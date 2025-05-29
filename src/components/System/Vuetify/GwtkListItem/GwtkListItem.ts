import { Component, Vue, Prop } from 'vue-property-decorator';

@Component
export default class GwtkListItem extends Vue {

    @Prop( { default: '' } )
    private readonly title!: string;

    @Prop( { default: '' } )
    private readonly icon!: string;

    @Prop( { default: '' } )
    private imgurl!: string;

    @Prop( { default: 24 } )
    private readonly iconSize!: number;

    @Prop( { default: '' } )
    private readonly subtitle!: string;

    @Prop( { default: '' } )
    private readonly subtitleBold!: string;

    @Prop( { default: '' } )
    private readonly titleClass!: string;

    @Prop( { default: false } )
    private readonly bordered!: boolean | '';

    @Prop( {
        default: 'clean',
        validator( value: string ) {
            return ['primary', 'secondary', 'clean'].includes( value );
        }
    } )
    private readonly theme!: string;

    private get themeClass() {
        return `list-item-theme-${this.theme}`;
    }

    private get mainSlot() {
        return this.$slots[ 'default' ];
    }

    private get leftSlot() {
        return this.$slots[ 'left-slot' ];
    }

    private get rightSlot() {
        return this.$slots[ 'right-slot' ];
    }
}