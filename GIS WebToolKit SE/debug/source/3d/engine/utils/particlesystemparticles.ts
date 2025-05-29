/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *            Компонент  анимированного объекта (система частиц)    *
 *            Шейдер                                                *
 *                                                                  *
 *******************************************************************/
import {SimpleJson} from '~/types/CommonTypes';
import {Vector3D, Vector4D} from '~/3d/engine/core/Types';

/**
 * Этот файл содержит различные функции и классы для рендеринга частиц на основе графических процессоров.
 */

/**
 * Методы для работы с частицами
 * @static
 * @class Particles
 */
export default class Particles {

    /**
     * Углы.
     * @private
     * @type {!Array.<!Array.<number>>}
     */
    static CORNERS = [
        [-0.5, -0.5],
        [+0.5, -0.5],
        [+0.5, +0.5],
        [-0.5, +0.5]];

    /**
     * Проверяет и добавляет недостающие параметры частиц.
     * @param parameters {!ParticleSpec}  Параметры для проверки.
     */
    static validateParameters(parameters: SimpleJson<any>) { //TODO:не должно быть этого метода, поменять логику
        const defaults = new ParticleSpec();

        for (const keyP in parameters) {
            if (keyP !== 'startTime' && !Reflect.has(defaults, keyP)) {
                throw 'unknown particle parameter "' + keyP + '"';
            }
        }

        for (const k in defaults) {
            const key = k as keyof typeof defaults;
            if (parameters[key] === undefined) {
                parameters[key] = defaults[key];
            }
        }
    }
}

/**
 * Класс параметров работы с частицами
 * @class ParticleSpec
 */
class ParticleSpec {
    /**
     * Количество создаваемых частиц.
     * @type {number}
     */
    numParticles = 1;

    /**
     * Количество кадров в текстуре частиц.
     * @type {number}
     */
    numFrames = 1;

    /**
     * Длительность кадра, при которой анимируется текстура частицы, в секундах на кадр.
     * @type {number}
     */
    frameDuration = 1;

    /**
     * Начальный кадр, отображаемый для конкретной частицы.
     * @type {number}
     */
    frameStart = 0;

    /**
     * Диапазон начала кадра.
     * @type {number}
     */
    frameStartRange = 0;

    /**
     * Время жизни всей системы частиц.
     * Чтобы сделать систему частиц непрерывной, установите это значение, соответствующее параметру lifeTime.
     * @type {number}
     */
    timeRange = 99999999;

    /**
     * Время начала частицы.
     * @type {number}
     */
    startTime?: number;

    /**
     * Время жизни частицы.
     * @type {number}
     */
    lifeTime = 1;

    /**
     * Диапазон lifeTime.
     * @type {number}
     */
    // lifeTimeRange = 0;

    /**
     * Начальный размер частицы.
     * @type {number}
     */
    startSize = 1;

    /**
     * Диапазон начальных размеров.
     * @type {number}
     */
    startSizeRange = 0;

    /**
     * Конечный размер частицы.
     * @type {number}
     */
    endSize = 1;

    /**
     * Конечный диапазон размеров.
     * @type {number}
     */
    endSizeRange = 0;

    /**
     * Начальное положение частицы в локальном пространстве.
     */
    position: Vector3D = [0, 0, 0];

    /**
     * Диапазон начальных позиций.
     */
    positionRange: Vector3D = [0, 0, 0];

    /**
     * Скорость частицы в локальном пространстве.
     */
    velocity: Vector3D = [0, 0, 0];

    /**
     * Диапазон скорости
     */
    velocityRange: Vector3D = [0, 0, 0];

    /**
     * Ускорение частицы в локальном пространстве
     */
    acceleration: Vector3D = [0, 0, 0];

    /**
     * диапазон ускорения
     */
    accelerationRange: Vector3D = [0, 0, 0];

    /**Начальное значение вращения частицы в радианах.
     * @type {number}
     */
    spinStart = 0;

    /**Диапазон начала вращения.
     * @type {number}
     */
    spinStartRange = 0;

    /**
     * скорость вращения частицы в радианах.
     * @type {number}
     */
    spinSpeed = 0;

    /** Диапазон скорости вращения
     * @type {number}
     */
    spinSpeedRange = 0;

    /**
     * Множитель цвета частицы.
     */
    colorMult: Vector4D = [1, 1, 1, 1];

    /**
     * Диапазон множителя цвета
     */
    colorMultRange: Vector4D = [0, 0, 0, 0];

    /**Скорость всех частиц в мировом пространстве.
     */
    worldVelocity: Vector3D = [0, 0, 0];

    /**Ускорение всех частиц в мировом пространстве.
     */
    worldAcceleration: Vector3D = [0, 0, 0];

    /**Независимо от того, ориентированы ли эти частицы в 2 или 3 измерениях. истина = 2d, ложь = 3d.
     * @type {boolean}
     */
    billboard = true;

    /**
     Для взрыва свой шейдер
     */
    // explosion = false;

    /**
     Для взрыва свой шейдер, камни
     */
    // explosion_stone = false;

    /**
     * Рябь воды
     */
    ripple = false;


    /** Ориентация частицы. Используется только если billboard = false.
     */
    orientation: Vector4D = [0, 0, 0, 1];
}
