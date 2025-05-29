import { Component, Vue, Prop } from 'vue-property-decorator';

@Component
export default class GwtkTooltip extends Vue {

    @Prop( { default: 'Undefined' } )
    private readonly text!: string;

    @Prop( {
        default: 'bottom',
        validator( value: string ) {
            return ['top', 'bottom', 'left', 'right'].includes( value );
        }
    } )
    private readonly position!: string;

    private get topValue() {
        return this.position === 'top';
    }

    private get bottomValue() {
        return this.position === 'bottom';
    }

    private get leftValue() {
        return this.position === 'left';
    }

    private get rightValue() {
        return this.position === 'right';
    }

}