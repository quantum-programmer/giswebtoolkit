import { Component, Vue, Prop, Emit } from 'vue-property-decorator';

@Component
export default class GwtkCheckbox extends Vue {

    @Prop( { default: false } )
    private readonly value!: boolean;

    @Emit( 'input' )
    updateModelValue( value: string ) {
        return value;
    }

}