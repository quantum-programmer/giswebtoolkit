import ComboPoint3D from '~/3d/engine/core/combopoint3d';
import { AngleUnit, Unit, UnitText } from '~/utils/WorkspaceManager';

export type Controller3d = any;

type MeasurementResultItem = {
    value: number;
    unit: string;
    text: string;
}

export type MeasurementResults = {
    geometry: {
        points: ComboPoint3D[];
        triangles: {
            indices: number[];
            pointListOrder: string;
            points: [3][];
            slope: number;
        };
    };
    points: {
        auxiliaryValues: {
            active: boolean;
        };
        metricValues: {
            absoluteHeight: MeasurementResultItem;
            relativeHeight: MeasurementResultItem;
            surfaceHeight: MeasurementResultItem;
        }
    }[];
    segments: {
        angleValues: {
            azimuth: MeasurementResultItem;
            interiorAngle: MeasurementResultItem;
            rotation: MeasurementResultItem;
            slope: MeasurementResultItem;
        };
        auxiliaryValues: {
            active: boolean;
            intersected: boolean;
            linePoints: [number, number, number][];
            slope: number;
        };
        metricValues: {
            deltaHeight: MeasurementResultItem;
            distance: MeasurementResultItem;
            planeDistance: MeasurementResultItem;
        };
    }[];
    total: {
        area: MeasurementResultItem;
        distance: MeasurementResultItem;
        slope: MeasurementResultItem;
    }
}

export type SegmentItemData = {
    name: MeasurementName,
    value: string,
    unit: Unit | AngleUnit | UnitTextExport | UnitText | string
}

export type SegmentItem = {
    data: SegmentItemData[],
    active: boolean
}

export enum MeasurementName {
    angle = 'Angle',
    activeSegment = 'Active segment',
    area = 'Area',
    azimuth = 'Azimuth',
    directionAngle = 'Direction angle',
    directDistance = 'Direct distance',
    excess = 'Excess',
    horizontalDistance = 'Horizontal distance',
    interiorAngle = 'Interior angle',
    length = 'Length',
    perimeter = 'Perimeter',
    rotation = 'Rotation',
    slope = 'Slope',
    startPoint = 'Start point',
    totalLength = 'Total length',
    units = 'Units',
    verticalDistance = 'Vertical distance',
}

export enum UnitTextExport {
    meters = 'm',
    kilometers = 'km',
    degrees = '°',
    degMinSec = 'deg min sec',
    radians = 'rad',
    miles = 'Nm',
    feet = 'ft',
    squareMeters = 'm²',
    squareKilometers = 'km²',
    hectares = 'ha'
}