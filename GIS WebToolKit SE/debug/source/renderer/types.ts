import MapObject from '~/mapobject/MapObject';
import Style from '~/style/Style';
import { GwtkMap } from '~/types/Types';

export interface IRenderer<T> {

    destroy(): void;

    draw( renderableContent: T ): void;

    clear(): void;
}


export interface IRenderable<T> {
    setOpacity( value: string ): void;

    clear(): void;

    drawRenderable( renderer: IRenderer<T> ): void;

    drawMapObject( renderer: IRenderer<T>, mapObject: MapObject, style?: Style ): Promise<void>;
}