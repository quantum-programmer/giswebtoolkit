import { Component, Vue, Prop, Emit } from 'vue-property-decorator';

@Component
export default class GwtkTabs extends Vue {

    @Prop( { default: false } )
    private readonly sliderMode!: boolean;

    @Prop( { default: '' } )
    private readonly value!: string | number;

    @Emit( 'input' )
    updateModelValue( value: string | number ) {
        return value;
    }

}