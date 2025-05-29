import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { format as formatDateFNS, parse as parseDateFNS } from 'date-fns';

const DEFAULT_DATE: string = '';
const DEFAULT_TIME: string = '00:00:00';
const DEFAULT_DATE_FORMAT: string = 'yyyy-MM-dd';
const DEFAULT_TIME_FORMAT: string = 'HH:mm:ss';
const DEFAULT_DIALOG_WIDTH: number = 290;
const DEFAULT_OK_TEXT: string = 'OK';

@Component
export default class GwtkDateTimePicker extends Vue {
    @Prop( { default: null } )
    private readonly datetime!: Date | string;

    @Prop( { default: false } )
    private readonly disabled!: boolean;

    @Prop( { default: '' } )
    private readonly label!: string;

    @Prop( { default: DEFAULT_DIALOG_WIDTH } )
    private readonly dialogWidth!: number;

    @Prop( { default: DEFAULT_DATE_FORMAT} )
    private readonly dateFormat!: string;

    @Prop( { default: DEFAULT_TIME_FORMAT } )
    private readonly timeFormat!: string;

    @Prop( { default: DEFAULT_OK_TEXT } )
    private readonly okText!: string;

    @Prop( { default: () => ({}) } )
    private readonly textFieldProps!: object;

    @Prop( { default: () => ({}) } )
    private readonly datePickerProps!: object;

    @Prop( { default: () => ({}) } )
    private readonly timePickerProps!: object;

    private display: boolean = false;
    private activeTab: string = 'calendar';
    private date: string = DEFAULT_DATE;
    private time: string = DEFAULT_TIME;

    private get dateTimeFormat() {
        return this.dateFormat + ' ' + this.timeFormat;
    }

    private get defaultDateTimeFormat() {
        return DEFAULT_DATE_FORMAT + ' ' + DEFAULT_TIME_FORMAT;
    }

    private get formattedDatetime() {
        if ( typeof this.selectedDatetime !== 'number' ) {
            const selectedDatetime = this.selectedDatetime;
            this.changeDateTime( selectedDatetime );
            return formatDateFNS( selectedDatetime, this.dateTimeFormat );
        } else {
            return '';
        }
    }

    private get selectedDatetime(): number | Date {
        if ( this.time && this.date ) {
            let datetimeString = this.date + ' ' + this.time;
            if ( this.time.length === 5 ) {
                datetimeString += ':00';
            }

            return parseDateFNS( datetimeString, this.defaultDateTimeFormat, new Date() );
        } else {
            return  0;
        }
    }

    private get dateSelected() {
        return !this.date;
    }

    private init() {
        if ( !this.datetime ) {
            return;
        }
        let initDateTime: Date;
        if ( this.datetime instanceof Date ) {
            initDateTime = this.datetime;
        } else {
            initDateTime = parseDateFNS( this.datetime, this.dateTimeFormat, new Date() );
        }

        this.date = formatDateFNS(initDateTime, DEFAULT_DATE_FORMAT);
        this.time = formatDateFNS(initDateTime, DEFAULT_TIME_FORMAT);
    }

    private okHandler() {
        this.resetPicker();
        this.$emit('input', this.selectedDatetime);
    }

    private changeDateTime( value: Date ) {
        this.$emit('input', value);
    }

    private resetPicker() {
        this.display = false;
        this.activeTab = 'calendar';
        if (this.$refs.timer) {
            // @ts-ignore
            if ( this.$refs.timer.selectingHour ) {
                // @ts-ignore
                this.$refs.timer.selectingHour = true;
            }
        }
    }

    private showTimePicker() {
        this.activeTab = 'timer';
    }

    mounted() {
        this.init();
    }

    @Watch('datetime')
    dateTimeChange() {
        this.init();
    }
}