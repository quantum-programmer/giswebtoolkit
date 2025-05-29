import { Component, Vue } from 'vue-property-decorator';


type SwipePosition = 'top' | 'middle' | 'bottom';

type SwipeParams = {
    touchTime: number;
    touchPath: number;
    isImpulseSwipe: boolean;
    direction: SwipePosition;
    transformPercent: number;
}

@Component
export default class GwtkSwipePanel extends Vue {

    private readonly impulseSwipeMinPath = 80;
    private readonly swipeMaxTime = 200;
    private readonly transformValues = { top: 0, middle: 0, bottom: 0 };

    private currentPositionName: SwipePosition = 'top';
    private currentTransform = 0;
    private endTouchTime = 0;
    private endTouchY = 0;
    private initialTransform = 0;
    private panelHeight = 0;
    private resizeObserver: ResizeObserver | null = null;
    private startTouchTime = 0;
    private startTouchY = 0;
    private transitionDuration = 0.4;
    private transitionOn = false;
    private windowHeight = window.innerHeight;

    private get transform(): string {
        if ( this.currentTransform !== null ) {
            return `translate3d(0, ${this.currentTransform}px, 0)`;
        }
        return '';
    }

    private get transition(): string {
        return this.transitionOn ? `transform ${this.transitionDuration}s` : 'none';
    }

    private readonly gwtkSwipeButtonStyle: { backgroundColor: string | null; color: string | null; } = {
        backgroundColor: 'var(--v-primary-lighten5)',
        color: null
    };

    private getGwtkTaskContainerItemPropsData() {
        const gwtkTaskContainer = this.$slots.default && this.$slots.default[ 0 ] && this.$slots.default[ 0 ].componentInstance;
        if ( gwtkTaskContainer ) {
            const widgets = gwtkTaskContainer.$children;
            if ( widgets.length > 0 ) {
                const widget = widgets[ 0 ];
                if ( widget.$children.length > 0 ) {
                    const gwtkTaskContainerItem = widget.$children[ 0 ];
                    return gwtkTaskContainerItem.$options.propsData as { titleBackgroundColor?: string; titleTextColor?: string; };
                }
            }
        }
        return undefined;
    }

    updated() {
        const propsData = this.getGwtkTaskContainerItemPropsData();
        if ( propsData ) {
            if ( propsData.titleBackgroundColor ) {
                this.gwtkSwipeButtonStyle.backgroundColor = propsData.titleBackgroundColor;
            } else {
                if ( this.gwtkSwipeButtonStyle.backgroundColor !== 'var(--v-primary-lighten5)' ) {
                    this.gwtkSwipeButtonStyle.backgroundColor = 'var(--v-primary-lighten5)';
                }
            }
            if ( propsData.titleTextColor ) {
                this.gwtkSwipeButtonStyle.color = propsData.titleTextColor;
            } else {
                if ( this.gwtkSwipeButtonStyle.color ) {
                    this.gwtkSwipeButtonStyle.color = null;
                }
            }
        }
    }

    mounted() {

        const panel = this.$refs.swipePanel as Vue;
        if ( panel ) {
            this.panelHeight = (panel.$el as HTMLDivElement).getBoundingClientRect().height;
        }
        const swipePanelContent = (this.$refs.swipePanelContent as HTMLDivElement);
        swipePanelContent.style.maxHeight = window.innerHeight - 96 - 36 + 'px';
        swipePanelContent.style.overflowY = 'auto';
        this.transitionOn = true;
        this.updateTransformValues();
        this.initialTransform = this.transformValues.middle;
        this.currentTransform = this.transformValues.middle;
        this.currentPositionName = 'middle';

        this.resizeObserver = new ResizeObserver( () => {
            this.updateTransformValues();
            if ( this.currentPositionName === 'middle' || this.currentPositionName === 'bottom' ) {
                this.transitionOn = true;
                this.initialTransform = this.transformValues.middle;
                this.currentTransform = this.transformValues.middle;
            }
        } );

        this.resizeObserver.observe( swipePanelContent );

        this.updateResize();

        setTimeout(() => {
            this.$forceUpdate();
        }, 3000);
    }

    beforeDestroy() {
        this.resizeObserver?.disconnect();
    }

    private updateResize(): void {
        const newWindowHeight = window.innerHeight;
        (this.$refs.swipePanelContent as HTMLDivElement).style.maxHeight = newWindowHeight - 96 - 36 + 'px';

        if ( this.currentPositionName === 'middle' || this.currentPositionName === 'bottom' ) {

            const newCurrentTransform = this.currentTransform + (newWindowHeight - this.windowHeight);
            if ( newCurrentTransform > 0 ) {
                this.currentTransform = newCurrentTransform;
            } else {
                this.currentTransform = 0;
            }
            this.updateTransformValues();

            this.setPosition( this.transformValues.top, 'top' );

            this.windowHeight = newWindowHeight;
        }
    }

    private updateTransformValues(): void {
        const clientHeight = (this.$refs.swipePanelContent as HTMLDivElement).getBoundingClientRect().height;
        this.transformValues.top = 0;
        this.transformValues.middle = Math.max( Math.ceil( window.innerHeight - (96 + clientHeight) ), 0 );
        this.transformValues.bottom = Math.ceil( window.innerHeight ) - 96;
    }

    private initMove( event: TouchEvent ): void {
        const { changedTouches } = event;

        this.startTouchY = changedTouches[ 0 ].clientY;
        this.startTouchTime = new Date().getTime();
        this.transitionOn = false;
    }

    private movePanel( event: TouchEvent ): void {
        const { changedTouches } = event;
        const path = this.startTouchY - changedTouches[ 0 ].clientY;
        const currentTransformValue = this.initialTransform - path;

        if ( currentTransformValue < -10 ) {
            return;
        }

        this.currentTransform = currentTransformValue;
    }

    private stopMove( event: TouchEvent ): void {
        const { changedTouches } = event;

        this.endTouchY = changedTouches[ 0 ].clientY;
        this.endTouchTime = new Date().getTime();
        this.transitionOn = true;

        const swipeParams = this.getSwipeParams();

        if ( swipeParams.isImpulseSwipe ) { // swipe сразу до нужной позиции
            this.transitionDuration = this.getDynamicSwipeTransition( swipeParams );

            switch ( swipeParams.direction ) {
                case 'bottom':
                    if ( this.currentPositionName === 'top' ) {
                        this.setPosition( this.transformValues.middle, 'middle' );
                    } else {
                        this.setPosition( this.transformValues.bottom, 'bottom' );
                    }

                    break;

                case 'top':
                    this.setPosition( this.transformValues.top, 'top' );
            }

        } else { // определение позиции через процент прохождения
            switch ( swipeParams.direction ) {
                case 'bottom':
                    if ( swipeParams.transformPercent >= 10 && swipeParams.transformPercent <= 60 ) {
                        this.setPosition( this.transformValues.middle, 'middle' );
                    } else if ( swipeParams.transformPercent >= 60 ) {
                        this.setPosition( this.transformValues.bottom, 'bottom' );
                    } else {
                        this.setPosition( this.transformValues.top, 'top' );
                    }

                    break;

                case 'top':
                    if ( swipeParams.transformPercent <= 40 ) {
                        this.setPosition( this.transformValues.top, 'top' );
                    } else {
                        this.setPosition( this.transformValues.middle, 'middle' );
                    }
            }
        }
    }

    private expandCollapse(): void {
        switch ( this.currentPositionName ) {
            case 'bottom':
                this.setPosition( this.transformValues.middle, 'middle' );
                break;
            case 'middle':
                this.setPosition( this.transformValues.top, 'top' );
                break;
            case 'top':
                this.setPosition( this.transformValues.bottom, 'bottom' );
                break;
        }
    }

    private getSwipeParams(): SwipeParams {
        const touchTime = this.endTouchTime - this.startTouchTime;
        const touchPath = this.startTouchY - this.endTouchY;
        const isImpulseSwipe = touchTime <= this.swipeMaxTime && Math.abs( touchPath ) >= this.impulseSwipeMinPath;
        const transformPercent = Math.ceil( (this.currentTransform / this.panelHeight) * 100 );

        return {
            touchTime,
            touchPath,
            isImpulseSwipe,
            direction: touchPath == 0 ? 'middle' : touchPath > 0 ? 'top' : 'bottom',
            transformPercent
        };
    }

    private getDynamicSwipeTransition( swipeParams: SwipeParams ): number {
        const timeToPixelSwipe = Math.abs( swipeParams.touchPath ) / swipeParams.touchTime;
        const pathToNextTransformPosition = this.panelHeight / 2 - Math.abs( swipeParams.touchPath );
        const transition = Number( (pathToNextTransformPosition / timeToPixelSwipe / 1000).toFixed( 2 ) );

        return transition < 0.4 ? Math.max( transition, 0.15 ) : 0.4;
    }

    private setPosition( positionValue: number, positionName: SwipePosition ): void {
        this.currentTransform = positionValue;
        this.initialTransform = positionValue;
        this.currentPositionName = positionName;
    }

    private checkTransform(): void {
        this.transitionDuration = 0.4;

        if ( this.currentTransform === this.transformValues.bottom ) {
            this.$emit( 'closePanel' );
        }
    }
}