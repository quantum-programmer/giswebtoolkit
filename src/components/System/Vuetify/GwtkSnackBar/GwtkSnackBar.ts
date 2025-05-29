import { Component, Vue, Prop } from 'vue-property-decorator';

export type Message = {
    text: string;
    snackbar: boolean;
    data?: any;
}

@Component
export default class GwtkSnackBar extends Vue {

    @Prop( { default: () => ([]) } )
    private readonly messages!: Message[];

    @Prop( { default: 2000 } )
    private readonly timeout!: number;

    private calcMargin( index: number ): number {
        let result = 30;
        for ( let i = this.messages.length - 1; i > index; i-- ) {
            if ( this.messages[ i ].snackbar ) {
                result += 60;
            }
        }
        return result;
    }
}
