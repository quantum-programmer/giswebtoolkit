
interface IPanorama {
    Base(): Function;

    getPosition(): number[] //Возвращает положение панорамы в указанной в опциях системе координат.
    // Задается в формате [lon, lat, height], [lat, lon, height] или [x, y, height] в зависимости от системы и порядка координат:
    // height – высота панорамы, заданная относительно некоторого уровня (необязательно уровня моря).

    createPlayer( element: HTMLElement | string, point: number[], options?: {} ): Promise<ymaps.Player>;

    isSupported(): boolean;

    locate( point: number[], options?: {} ): Promise<IPanorama[]>;
}

interface IEventPlayer {
    add( types: string | string[], callback: Function, context?: {}, priority?: number ): void;
}
interface IMapState {
    center: number[];
    zoom: number;
  }


interface IRouteParameters {
    avoidTrafficJams?: boolean;
    mapStateAutoApply?: boolean;
    multiRoute?: boolean;
    routingMode?: 'auto' | 'masstransit';
    searchCoordOrder?: string;
    strictBounds?: boolean;
    viaIndexes?: number[];
}
interface IGeocodeOptions {
    boundedBy?:number[][];
    json?:boolean                                  
    kind?:'house'|'street'|'metro'|'district'|'locality'; 
    provider?:'yandex#map'; 
    results?:number;
    searchCoordOrder?:string;
    skip?:number;
    strictBounds?:boolean;
}

interface IRoutePoint {
    type: 'wayPoint' | 'viaPoint';
    point: number[] | string;
}

interface IGeoObjectCollection extends IEventEmitter {
    add(child:IGeoObject, index?:number):IGeoObjectCollection;
    get(index:number):IGeoObject | ymaps.Path;
    getLength():number;
    options: IOptionManager;
}

interface IGeoObject extends IDomEventEmitter  {
    geometry:IGeometry;
    properties:IDataManager;
    state:IDataManager;
    options: IOptionManager;
    getLength?():number;
}

interface IOptionManager extends IDataManager, IEventEmitter {
    get(path:string, defaultValue?:any):any;
    set(key:string, value:string):any;
}

interface IDataManager extends IEventEmitter {
    get(path:string, defaultValue?:any):any;
    set(key:string, value:string):any;
}

interface IGeometry extends IBaseGeometry {
    getBounds():number[][];
    getCoordinates(): number[];
    getMap():ymaps.Map;
    setMap(map:ymaps.Map):void;
}
interface ILineStringGeometry extends IGeometry {
    getType():'LineString';
}

interface IBaseGeometry extends IEventEmitter {
    getBounds():number[][];
    getType():string;
}


interface IGeoObjectGeometry {
    events: IEventManager;

}
interface IDomEventEmitter extends IEventEmitter {
    events:IEventManager;
}

interface IEventManager {
    add(types:string|string[], callback:Function, context?:any, priority?:number):IEventManager;
    remove(types:string|string[], callback:Function, context?:any, priority?:number):IEventManager;
    fire(type:string, event?:any):IEventManager;
    group():IEventGroup;
    getParent():IEventManager;
    setParent(parent:IEventManager):void;
}

interface IEventGroup {
    add(types:string|string[], callback:Function, context?:any, priority?:number):IEventGroup;
    remove(types:string|string[], callback:Function, context?:any, priority?:number):IEventGroup;
    removeAll():IEventGroup;
    
}

interface IEventEmitter {
    events:IEventManager;
}

interface IGeoObjectCollectionFeature {
    children:IGeoObject[];
    geometry:IGeometry|any;
    properties:IDataManager|Object;
}
interface IGeoObjectOptions {
    preset: string,
    strokeWidth: number,
    geodesic: boolean
}

interface IProjection {
    getCoordSystem():ICoordSystem;
    isCycled():boolean[];
    fromGlobalPixels(globalPixelPoint:number[], zoom:number):number[];
    toGlobalPixels(coordPoint:number[], zoom:number):number[]
}
interface ICoordSystem {
    getDistance(point1:number, point2:number): number
}


declare namespace ymaps {
    export namespace geometry {
			export class LineString implements ILineStringGeometry {
				events: IEventManager;
				getCoordinates(): number[];
				getMap(): ymaps.Map;
				setMap(map: ymaps.Map): void;
				getBounds(): number[][];
				getType(): 'LineString';
				static fromEncodedCoordinates(encodedCoordinates: string): {_coordPath:{_coordinates:number[][]}}; 
				static toEncodedCoordinates(geometry: geometry.LineString): string; 
			}
    }
    export class Map implements IDomEventEmitter {
        constructor(parentElement: HTMLElement | string, state: IMapState, options?:MapOptions);
        events:IEventManager;
        geoObjects: IGeoObjectCollection;
    }
    export class MapOptions {
        projection:IProjection;
    }
    export class Projection  {
        static sphericalMercator: IProjection;
    
    }

    export interface Player {
        ( element: HTMLElement | string, panorama: IPanorama, options?: {} ): Player;

        element: HTMLElement | string;
        panorama: IPanorama;
        options?: {}
        events: IEventPlayer

        getDirection(): number[]; // Возвращает текущее направление обзора в формате [bearing, pitch],
        // где bearing — азимут направления в градусах, pitch — угол подъема над линией горизонта в градусах.
        getPanorama(): IPanorama; // Возвращает открытую панораму в плеере.

        moveTo( point: number[], options?: {} ): Promise<{}>;
    }

    function route(points:Array<string|number[]|IRoutePoint>, params?:IRouteParameters):vow.Promise;
    function geocode(request:string|number[], options?:IGeocodeOptions):vow.Promise;

    export class Route implements IGeoObject  {
        options: IOptionManager;
        geometry: IGeometry;
        properties: IDataManager;
        state: IDataManager;
        events: IEventManager;
       
        getHumanJamsTime():string;
        getHumanLength():string;
        getHumanTime():string;
        getJamsTime():number;
        getLength():number;
        getPaths():GeoObjectCollection; 
        getTime():number;
        getViaPoints():GeoObjectCollection; 
        getWayPoints():GeoObjectCollection; 
    }

    export class Path extends GeoObject {

        getHumanJamsTime():string;
        getHumanLength():string;
        getHumanTime():string;
        getJamsTime():number;
        getLength():number;
        getSegments(): Segment[];
        getTime():number;

    }
    export class Polyline extends GeoObject {
        constructor(geometry:number[][], properties?:IDataManager)
    }

    export class GeoObject implements IGeoObject {

        geometry:IGeometry;
        properties: IDataManager;
        state: IDataManager;
        options: IOptionManager;
        getLength?(): number;
        events: IEventManager;
  
        constructor(feature?:GeoObjectFeature, options?:GeoObjectOptions);
    }
    
    export class GeoObjectFeature {
        geometry  :IGeometry;
        properties:IDataManager;
    }

    export class GeoObjectOptions {
        cursor:string;
        draggable:boolean;
        fill:boolean;
        fillColor:string;
        fillImageHref:string;
        fillMethod:'tile'|'stretch';
        fillOpacity:number;
        hasBalloon:boolean;
        hasHint:boolean;
        hideIconOnBalloonOpen:boolean;
        iconColor:string;
        iconShadowOffset:number[];
        interactiveZIndex:boolean;
        preset:string;
        syncOverlayInit:boolean;
        visible:boolean;
        zIndex:number;
        zIndexActive:number;
        zIndexDrag:number;
        zIndexHover:number;
    }
    export class Segment {

        getAction():'left'
            |'slight left'
            |'hard left'
            |'right'
            |'slight right'
            |'hard right'
            |'none'
            |'back'
            |'enter roundabout'
            |'leave roundabout'
            |'merge'
            |'board ferry'
            |'exit right'
            |'exit left'
            |string; // because of "leave roundabout [N]"

        getAngle():number;
        getCoordinates():number[][];
        getHumanAction():string;
        getHumanJamsTime():string;
        getHumanLength():string;
        getHumanTime():string;
        getIndex():number;
        getJamsTime():number;
        getLength():number;
        getPolylineEndIndex():number;
        getPolylineStartIndex():number;
        getStreet():string;
        getTime():number;
    }
    export class GeoObjectFeatureProperties { 
        iconContent:string;
        hintContent:string;
        balloonContent:string;
        balloonContentHeader:string;
        balloonContentBody:string;
        balloonContentFooter:string;
    }

    export interface IGeocodeResult   {
        geoObjects: IGeoObjectCollection; 

    }
    export class GeoObjectCollection implements IGeoObject, IGeoObjectCollection {
        constructor(feature?:IGeoObjectCollectionFeature, options?:IGeoObjectOptions)
        options: IOptionManager;
        geometry: IGeometry;
        properties: IDataManager;
        state: IDataManager;
        events: IEventManager;
        add(child:IGeoObject, index?:number):IGeoObjectCollection;
        get(index: number): IGeoObject;
        getLength():number;

    }

    const ready: () => Promise<void>;
    const panorama: IPanorama;
}

declare namespace vow {

    class Promise {
        constructor(resolver?: () => void);

        done(onFulfilled?: Function, onRejected?: Function, onProgress?: Function, ctx?: any): void;

        spread(onFulfilled?: Function, onRejected?: Function, ctx?: any): Promise;

        then(onFulfilled?: Function, onRejected?: Function, onProgress?: Function, ctx?: any): Promise;

        catch(onFulfilled?: Function, onRejected?: Function, onProgress?: Function, ctx?: any): Promise;

        valueOf(): any;
    }
}