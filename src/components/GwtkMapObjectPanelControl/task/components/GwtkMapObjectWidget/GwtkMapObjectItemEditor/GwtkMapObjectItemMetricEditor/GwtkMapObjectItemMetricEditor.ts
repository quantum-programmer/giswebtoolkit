/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *         Компонент "Редактирование метрики объекта карты"         *
 *                                                                  *
 *******************************************************************/


import { Component, Prop, Vue } from 'vue-property-decorator';
import {
    GwtkMapObjectTaskState,
    SHOW_SELECTED_OBJECT_POINT_IN_MAP
} from '@/components/GwtkMapObjectPanelControl/task/GwtkMapObjectTask';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import { AngleUnit, CursorCoordinateUnit } from '~/utils/WorkspaceManager';
import { ContourSelector, ObjectSelector, PointInfo, PointSelector } from '~/mapobject/geometry/BaseMapObjectGeometry';
import { MapPoint } from '~/geometry/MapPoint';
import GeoPoint from '~/geo/GeoPoint';
import Trigonometry from '~/geo/Trigonometry';
import MapObjectContent from '~/mapobject/utils/MapObjectContent';
import Utils from '~/services/Utils';

/**
 * Компонент "Редактирование метрики объекта карты"
 * @class GwtkMapObjectItemMetricEditor
 * @extends Vue
 */
@Component
export default class GwtkMapObjectItemMetricEditor extends Vue {

    @Prop( { default: () => ({}) } )
    readonly setState!: <K extends keyof GwtkMapObjectTaskState>( key: K, value: GwtkMapObjectTaskState[K] ) => void;

    @Prop( { default: () => ({}) } )
    readonly mapObject!: MapObjectContent;

    @Prop( { default: false } )
    readonly coordinateDisplayFormatValue!: AngleUnit;

    @Prop( { default: '' } )
    readonly coordinateDisplayFormat!: CursorCoordinateUnit;

    @Prop( { default: false } )
    readonly isReducedSizeInterface!: boolean;

    readonly openedPanels = [];

    tableMod = true;

    /**
     * Отображать поле "Высота"
     */
    showPointHeight = false;

    /**
     * Номер выбранного контура, по умолчанию 0
     */
    selectedContourNumber = 0;  // todo: Пока работаем только с первым подобъектом
    /**
     * Номер выбранного подобъекта, по умолчанию 0
     */
    selectedObjectNumber = 0;

    /**
     * Список индексов контуров полигона
     */
    contourIndexList: number[] = [];

    /**
     * Список индексов подобъектов объекта
     */
    readonly subObjectsIndexList: number[] = [];

    /**
     * Список координат объекта по выбранному контуру объекта
     */
    readonly coordinatesList: number[] = [];

    /**
     * Отображать выбранную точку на карте
     */
    selectedPointId: number | null = null;

    created() {
        this.updateSubObjectsIndexList();
        this.updateContourIndexList();
        this.updateCoordinatesListInSelectedContour();
    }

    get isDegreesMinutesSeconds() {
        return this.coordinateDisplayFormat === CursorCoordinateUnit.DegreesMinutesSeconds;
    }

    get isDegreesOrRadians() {
        return this.coordinateDisplayFormat === CursorCoordinateUnit.Degrees ||
            this.coordinateDisplayFormat === CursorCoordinateUnit.Radians;
    }

    get isDegrees() {
        return this.coordinateDisplayFormat === CursorCoordinateUnit.Degrees;
    }

    get isRadians() {
        return this.coordinateDisplayFormat === CursorCoordinateUnit.Radians;
    }

    get isMeters() {
        return (this.coordinateDisplayFormat === CursorCoordinateUnit.Meter);
    }

    get latitudeTitle(): string {
        if ( this.isMeters ) {
            return 'X';
        }
        return this.$t( 'phrases.Latitude' ) as string;
    }

    get longitudeTitle(): string {
        if ( this.isMeters ) {
            return 'Y';
        }
        return this.$t( 'phrases.Longitude' ) as string;
    }

    get unitTitle() {
        let result = '';
        if ( this.coordinateDisplayFormat === CursorCoordinateUnit.Degrees ) {
            result = ',°';
        }
        if ( this.coordinateDisplayFormat === CursorCoordinateUnit.Radians ) {
            result = ',' + this.$t( 'phrases.rad' );
        }

        return result + ':';
    }

    /**
     * Обновить список индексов подобъектов
     * @method updateSubObjectsIndexList
     */
    updateSubObjectsIndexList(): void {
        const count = this.mapObject.getObjectSubObjectsCount();

        this.subObjectsIndexList.splice( 0, this.subObjectsIndexList.length, ...Array( count ).keys() );
    }

    /**
     * Получить и создать список для количества контуров
     * @method updateContourIndexList
     */
    updateContourIndexList( objectNumber = 0 ) {
        const count = this.mapObject.getObjectContoursCount( objectNumber );

        this.contourIndexList.splice( 0, this.contourIndexList.length, ...Array( count ).keys() );
    }

    /**
     * Получить список координат объекта по выбранному контуру объекта
     * @method updateCoordinatesListInSelectedContour
     */
    updateCoordinatesListInSelectedContour(): void {
        if ( this.selectedPointId !== null ) {
            this.showPointInMap( this.selectedPointId );
        }

        const newCoordinatesList = this.mapObject.getContourPoints( this.selectedObjectNumber, this.selectedContourNumber );

        if ( newCoordinatesList.length > 0 ) {
            this.coordinatesList.splice( 0, this.coordinatesList.length, ...Array( newCoordinatesList.length ).keys() );
        }
    }

    /**
     * Обновить контуров и список координат объекта по выбранному подобъекту
     * @private
     * @method updateContourAndCoordinatesListInSelectedSubObject
     */
    updateContourAndCoordinatesListInSelectedSubObject(): void {
        this.selectedContourNumber = 0;

        this.updateContourIndexList( this.selectedObjectNumber );
        this.updateCoordinatesListInSelectedContour();
    }

    getMapObjectPoint( positionNumber: number ): MapPoint {
        const pointSelector: PointInfo = {
            objectNumber: this.selectedObjectNumber,
            contourNumber: this.selectedContourNumber,
            positionNumber
        };
        return this.mapObject.getPoint( pointSelector ) || new MapPoint();
    }

    /**
     * Получить координаты
     * @private
     * @method getEditPoint
     * @param positionNumber {number} Индекс точки в контуре
     */
    getEditPoint( positionNumber: number ): { x: string; y: string; h: string; } {

        const pointSelector: PointInfo = {
            objectNumber: this.selectedObjectNumber,
            contourNumber: this.selectedContourNumber,
            positionNumber
        };
        const point = this.mapObject.getPoint( pointSelector ) || new MapPoint();

        const geoPoint = point.toGeoPoint();
        if ( !geoPoint ) {
            throw Error( 'Geo is not supported' );
        }

        if ( this.isDegrees ) {
            return {
                x: Utils.toFixed(geoPoint.getLatitude(), 10),
                y: Utils.toFixed(geoPoint.getLongitude(), 10),
                h: geoPoint.getHeight().toString()
            };
        }

        if ( this.isRadians ) {
            const geoPointRad = Trigonometry.toRadians( geoPoint );
            return {
                x: Utils.toFixed(geoPointRad.getLatitude(), 8),
                y: Utils.toFixed(geoPointRad.getLongitude(), 8),
                h: geoPointRad.getHeight().toString()
            };
        }

        if ( this.isDegreesMinutesSeconds ) {
            return {
                x: this.checkDegreesMinutesSecondsValue( geoPoint.getLatitude() ),
                y: this.checkDegreesMinutesSecondsValue( geoPoint.getLongitude() ),
                h: geoPoint.getHeight().toString()
            };
        }

        return { x: point.x.toString(), y: point.y.toString(), h: point.h.toString() };
    }

    checkDegreesMinutesSecondsValue( coordinate: number ): string {
        let coordinateString = GeoPoint.degrees2DegreesMinutesSeconds( coordinate );
        if ( coordinate !== 0 ) {
            coordinateString = coordinateString
                .replace( /^-/, '' )
                .replace( /^0+/, '' );
        } else {
            coordinateString = coordinateString
                .replace( /^0+/, '0' );
        }

        if ( coordinate < 0 ) {
            coordinateString = '-' + coordinateString;
        }
        return coordinateString;
    }

    /**
     * Добавить новый подобъект
     * @private
     * @method addNewSubObject
     */
    addNewSubObject(): void {
        const newSubObject = this.mapObject.addEmptySubObject();
        if ( newSubObject.objectNumber && newSubObject.objectNumber > 0 ) {
            this.updateSubObjectsIndexList();
            this.selectedObjectNumber = newSubObject.objectNumber;
            this.addNewContour();
        }
    }

    removeSubObject() {
        const objectSelector: ObjectSelector = {
            objectNumber: this.selectedObjectNumber
        };
        this.mapObject.removeSubObject(objectSelector);
        let newselectedObjectNumber = 0;
        if (this.selectedObjectNumber > 0)
            newselectedObjectNumber = this.selectedObjectNumber - 1;
        this.updateSubObjectsIndexList();
        this.updateContourIndexList();
        this.selectedObjectNumber = newselectedObjectNumber;
        this.selectedContourNumber = 0;
        this.updateCoordinatesListInSelectedContour();
    }

    reverseContour() {
        const contourSelector: ContourSelector = {
            objectNumber: this.selectedObjectNumber,
            contourNumber: this.selectedContourNumber
        };
        this.mapObject.reverseContour(contourSelector);
        const objectNumber = this.selectedObjectNumber;
        this.updateSubObjectsIndexList();
        this.updateContourIndexList();
        this.updateContourIndexList(objectNumber);
        this.updateCoordinatesListInSelectedContour();
    }

    /**
     * Добавить новый контур
     * @method addEmptyContour
     */
    addNewContour() {
        const objectNumber = this.selectedObjectNumber;
        const selector = this.mapObject.addEmptyContour( objectNumber );

        if ( selector ) {
            this.mapObject.addPoint( new MapPoint(), selector );

            this.updateContourIndexList( objectNumber );

            this.selectedContourNumber = this.contourIndexList.length - 1;
            this.updateCoordinatesListInSelectedContour();
        }

    }

    isLastPolygonPoint( positionNumber: number ) {
        return (positionNumber === this.coordinatesList.length - 1) && (this.mapObject.type === MapObjectType.Polygon || this.mapObject.type === MapObjectType.MultiPolygon);
    }

    get availableMultiplyContours() {
        return (this.mapObject.type === MapObjectType.MultiLineString || this.mapObject.type === MapObjectType.Polygon || this.mapObject.type === MapObjectType.MultiPolygon);
    }

    get availableMultiPolygon(): boolean {
        return this.mapObject.type === MapObjectType.MultiPolygon;
    }

    /**
     * Добавить новую точку в контур
     * @method addNewPoint
     */
    addNewPoint() {
        const copyPointSelector: PointInfo = {
            objectNumber: this.selectedObjectNumber,
            contourNumber: this.selectedContourNumber,
            positionNumber: this.coordinatesList.length - 1
        };

        if ( this.isLastPolygonPoint( this.coordinatesList.length - 1 ) ) {
            copyPointSelector.positionNumber--;
        }

        const newPoint = this.mapObject.getPoint( copyPointSelector ) || new MapPoint();

        const pointSelector: PointSelector = {
            objectNumber: this.selectedObjectNumber,
            contourNumber: this.selectedContourNumber
        };

        this.mapObject.addPoint( newPoint, pointSelector );

        this.updateCoordinatesListInSelectedContour();
    }

    /**
     * Удалить точку из контура
     * @method removePoint
     * @param pointNumber {Number} Номер точки
     */
    removePoint( pointNumber: number ) {
        const pointSelector: PointSelector = {
            objectNumber: this.selectedObjectNumber,
            contourNumber: this.selectedContourNumber,
            positionNumber: pointNumber
        };

        this.mapObject.removePoint( pointSelector );

        this.updateCoordinatesListInSelectedContour();

        if ( this.coordinatesList.length === 0 ) {
            const contourSelector: ContourSelector = {
                objectNumber: this.selectedObjectNumber,
                contourNumber: this.selectedContourNumber
            };
            let newContourNumber = 0;
            if ( this.selectedContourNumber > 0 )
                newContourNumber = this.selectedContourNumber - 1;

            this.mapObject.removeContour( contourSelector );

            this.updateContourIndexList();

            this.selectedContourNumber = newContourNumber;
            this.updateCoordinatesListInSelectedContour();
        }
    }

    removeContour() {
        const contourSelector: ContourSelector = {
            objectNumber: this.selectedObjectNumber,
            contourNumber: this.selectedContourNumber
        };
        this.mapObject.removeContour(contourSelector);
        let newContourNumber = 0;
        if (this.selectedContourNumber > 0)
            newContourNumber = this.selectedContourNumber - 1;
        this.updateContourIndexList();
        this.selectedContourNumber = newContourNumber;
        this.updateCoordinatesListInSelectedContour();
    }


    showPointInMap( positionNumber: number ) {
        if ( this.selectedPointId === positionNumber ) {
            this.selectedPointId = null;
            this.setState( SHOW_SELECTED_OBJECT_POINT_IN_MAP, null );

        } else {
            this.selectedPointId = positionNumber;
            const pointSelector: PointInfo = {
                objectNumber: this.selectedObjectNumber,
                contourNumber: this.selectedContourNumber,
                positionNumber
            };
            const mapPoint = this.mapObject.getPoint( pointSelector );
            if ( mapPoint ) {
                this.setState( SHOW_SELECTED_OBJECT_POINT_IN_MAP, mapPoint );
            }
        }
    }

    /**
     * Изменить значения поле "Широта"
     * @method changeX
     * @param positionNumber{number} Индекс точки в контуре
     * @param value{String}
     */
    changeX( positionNumber: number, value: string ) {
        const pointSelector: PointInfo = {
            objectNumber: this.selectedObjectNumber,
            contourNumber: this.selectedContourNumber,
            positionNumber
        };
        const newPoint = this.mapObject.getPoint( pointSelector )?.clone();

        if ( newPoint ) {

            if ( !this.isMeters ) {
                const newGeoPoint = newPoint.toGeoPoint();

                if ( newGeoPoint ) {
                    let newValue = parseFloat( value );
                    if ( this.coordinateDisplayFormat === CursorCoordinateUnit.Radians ) {
                        newValue = Trigonometry.toDegrees( newValue );
                    }

                    newGeoPoint.setLatitude( newValue );

                    const newMapPoint = newGeoPoint.toMapPoint();

                    if ( newMapPoint ) {
                        newPoint.x = newMapPoint.x;
                    }
                }
            } else {
                newPoint.x = parseFloat( value );
            }
            this.mapObject.updatePoint( newPoint, pointSelector );
        }
        this.selectedPointId = null;
        this.showPointInMap( positionNumber );
    }

    /**
     * Изменить значения поле "Долгота"
     * @method changeY
     * @param positionNumber{number} Индекс точки в контуре
     * @param value{String}
     */
    changeY( positionNumber: number, value: string ) {
        const pointSelector: PointInfo = {
            objectNumber: this.selectedObjectNumber,
            contourNumber: this.selectedContourNumber,
            positionNumber
        };
        const newPoint = this.mapObject.getPoint( pointSelector )?.clone();

        if ( newPoint ) {

            if ( !this.isMeters ) {
                const newGeoPoint = newPoint.toGeoPoint();

                if ( newGeoPoint ) {
                    let newValue = parseFloat( value );
                    if ( this.coordinateDisplayFormat === CursorCoordinateUnit.Radians ) {
                        newValue = Trigonometry.toDegrees( newValue );
                    }

                    newGeoPoint.setLongitude( newValue );

                    const newMapPoint = newGeoPoint.toMapPoint();

                    if ( newMapPoint ) {
                        newPoint.y = newMapPoint.y;
                    }
                }
            } else {
                newPoint.y = parseFloat( value );
            }

            this.mapObject.updatePoint( newPoint, pointSelector );
        }

        this.selectedPointId = null;
        this.showPointInMap( positionNumber );
    }

    /**
     * Изменить значения поле "Высоту"
     * @method changePointHeight
     * @param positionNumber{number} Индекс точки в контуре
     * @param heightValue{String}
     */
    changePointHeight( positionNumber: number, heightValue: string ) {
        const pointSelector: PointInfo = {
            objectNumber: this.selectedObjectNumber,
            contourNumber: this.selectedContourNumber,
            positionNumber
        };
        const newPoint = this.mapObject.getPoint( pointSelector )?.clone();

        if ( newPoint ) {

            newPoint.h = parseFloat( heightValue );

            this.mapObject.updatePoint( newPoint, pointSelector );

            this.selectedPointId = null;
            this.showPointInMap( positionNumber );
        }
    }

    isCanClose() {
        const pointSelectorFirst: PointInfo = {
            objectNumber: this.selectedObjectNumber,
            contourNumber: this.selectedContourNumber,
            positionNumber: 0
        };
        const pointSelectorLast: PointInfo = {
            objectNumber: this.selectedObjectNumber,
            contourNumber: this.selectedContourNumber,
            positionNumber: this.coordinatesList[this.coordinatesList.length - 1]
        };
        const pointFirst = this.mapObject.getPoint(pointSelectorFirst) || new MapPoint();
        const pointLast = this.mapObject.getPoint(pointSelectorLast) || new MapPoint();
        return MapPoint.equals(pointFirst, pointLast);
    }

    closeContour() {
        const copyPointSelector: PointInfo = {
            objectNumber: this.selectedObjectNumber,
            contourNumber: this.selectedContourNumber,
            positionNumber: 0
        };
        const pointSelector: PointSelector = {
            objectNumber: this.selectedObjectNumber,
            contourNumber: this.selectedContourNumber
        };
        const newPoint = this.mapObject.getPoint(copyPointSelector) || new MapPoint();
        this.mapObject.addPoint(newPoint, pointSelector);
        this.updateContourIndexList();
        this.updateCoordinatesListInSelectedContour();
    }
}