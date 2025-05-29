import { Vector3D, Vector4D } from '~/3d/engine/core/Types';
import { WindingOrder } from '~/3d/engine/core/geometry/mesh';
import EllipsoidTangentPlane from '~/3d/engine/core/geometry/ellipsoidtangentplane';
import { vec3, vec4 } from '~/3d/engine/utils/glmatrix';
import PolygonAlgorithms from '~/3d/engine/core/geometry/polygonalgorithms';
import HeightTile from '~/3d/engine/scene/terrain/heightsource/heighttile';
import { Feature } from '~/utils/GeoJSON';
import { Projection } from '~/3d/engine/core/geometry/projection';
import Geodetic3D from '~/3d/engine/core/geodetic3d';
import Trigonometry from '~/3d/engine/core/trigonometry';


class SUBJECT_MIN_MAX {
    Maximum: number = 0;  // Максимальное абсолютное удаление координат
    // точек подобъектов от осей X и Y проходящих
    // через с центр габаритов объекта
    Direct = 0;   // Направление перпендикулярного от оси вектора к
    // точке, имеющей максимальное абсолютное удаление
    //  1 - вверх (максимум по X)
    //  2 - вниз (минимум по X)
    //  3 - вправо (максимум по Y)
    //  4 - влево (минимум по Y)
    Number = 0;   // Номер точки имеющей максимальное абсолютное удаление
    Count = 0;    // Число точек подобъекта
    Subject = 0;  // Номер подобъекта
}

export default class TriangulatePanoramaAlgorithm {

    static start( feature: Feature, heightTile: HeightTile ) {


        const positionsGeoJSONList = feature.getFullGeometryCoordinates();
        const bbox = vec4.setValues( vec4.create(), Number.MAX_VALUE, Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE );
        const resultPositionList: Vector3D[][] = [];
        const projection = heightTile.projection;

        positionsGeoJSONList.forEach( objectContoursGeoJSON => {
            for ( let j = 0; j < objectContoursGeoJSON.length; j++ ) {
                const positionsGeoJSON = objectContoursGeoJSON[ j ];
                const resultPositions: Vector3D[] = [];
                for ( let i = 0; i < positionsGeoJSON.length; i++ ) {
                    const geodetic = positionsGeoJSON[ i ];
                    const lng = Trigonometry.toRadians( geodetic[ 0 ] );
                    const lat = Trigonometry.toRadians( geodetic[ 1 ] );
                    const point = projection.geo2xy( new Geodetic3D( lng, lat, geodetic[ 2 ] ) );
                    resultPositions.push( point );
                    if ( bbox[ 0 ] > point[ 0 ] ) {
                        bbox[ 0 ] = point[ 0 ];
                    }
                    if ( bbox[ 1 ] > point[ 1 ] ) {
                        bbox[ 1 ] = point[ 1 ];
                    }
                    if ( bbox[ 2 ] < point[ 0 ] ) {
                        bbox[ 2 ] = point[ 0 ];
                    }
                    if ( bbox[ 3 ] < point[ 1 ] ) {
                        bbox[ 3 ] = point[ 1 ];
                    }
                }
                resultPositionList[ j ] = resultPositions;
            }
        } );

        const resultPointsArray = TriangulatePanoramaAlgorithm.TransformSubjectsToObject( bbox, resultPositionList, projection );

        const resultGeoJSON: Vector3D[] = [];
        for ( let i = 0; i < resultPointsArray.length; i++ ) {
            const point = resultPointsArray[ i ];
            const geoPoint = Trigonometry.toDegrees( projection.xy2geo( point[ 0 ], point[ 1 ], point[ 2 ] ) );
            resultGeoJSON.push( [geoPoint.getLongitude(), geoPoint.getLatitude(), geoPoint.getHeight()] );
        }

        return resultGeoJSON;
    }

    //------------------------------------------------------------------
    // Преобразование подобъектов объекта  in  в сплошную метрику metrics
    // countOut будет содержать количество точек созданной метрики
    // offset - массив номеров точек метрики, которые являются следующими
    // по порядку для точки по номеру в массиве
    // При ошибке возвращает 0
    //------------------------------------------------------------------
    private static TransformSubjectsToObject( bbox: Vector4D, metrics: Vector3D[][], projection: Projection ) {

        //****************************************************************
        // ВКЛЮЧИТЬ МЕТРИКУ ВХОДНОГО ОБЪЕКТА В КОНТУР ВЫХОДНОГО ОБЪЕКТА
        //****************************************************************

        const buffer = [];

        // Запрос - имеет ли объект  in трехмерную метрику
        // const isObject3D = true;

        // Число точек объекта
        // const countIn = mapPointCount(in, 0);
        const countIn = metrics[ 0 ].length;


        const pointOut = [];

        let windingOrder = TriangulatePanoramaAlgorithm.getWindingOrder( metrics[ 0 ], projection );
        // Объект слева ?
        if ( windingOrder === WindingOrder.Counterclockwise ) {
            const points = metrics[ 0 ];
            // Добавить точки входного объекта в метрику выходного объекта
            for ( let i = 0; i < countIn; i++ ) {
                pointOut[ i ] = points[ i ];
            }
        } else {
            const points = metrics[ 0 ];
            // Добавить точки входного объекта в метрику выходного объекта
            for ( let i = 0; i < countIn; i++ ) {
                pointOut[ i ] = points[ countIn - 1 - i ];
            }
        }

        // Число точек выходной метрики
        let countOut = countIn;

        //****************************************************************
        // СОХРАНИТЬ НОМЕРА ТОЧЕК ПОДОБЪЕКТОВ, ИМЕЮЩИЕ МАКСИМАЛЬНОЕ
        // АБСОЛЮТНОЕ УДАЛЕНИЕ КООРДИНАТ ТОЧЕК ПОДОБЪЕКТОВ ОТ ОСЕЙ X И Y
        // ПРОХОДЯЩИХ ЧЕРЕЗ С ЦЕНТР ГАБАРИТОВ ОБЪЕКТА
        //****************************************************************

        // Число составных частей (подобъектов + 1)
        // const polyCount = mapPolyCount(in);
        const polyCount = metrics.length;

        // Объект без подобъектов не обрабатывать
        if ( polyCount <= 1 ) {
            return pointOut;
        }

        // Разместить массив указателей
        // const index: number[] = [];

        const centerX = (bbox[ 0 ] + bbox[ 2 ]) / 2.0;
        const centerY = (bbox[ 1 ] + bbox[ 3 ]) / 2.0;

        // Цикл по подобъектам
        for ( let subject = 1; subject < polyCount; subject++ ) {
            // Инициализировать массив указателей
            // index[ subject ] = subject;

            // Максимальное абсолютное удаление
            let maximum = 0.0;

            // Направление
            let direct = 0;

            // Номер точки
            let number = 0;

            // Число точек подобъекта
            const count = metrics[ subject ].length;

            // Замкнутый контур имеет более трех точек
            if ( count > 3 ) {
                // Цикл по точкам подобъекта (исключая точку замыкания)
                for ( let i = 1; i < count; i++ ) {
                    // mapGetPlanePoint( in,&point[ 0 ], i, subject);
                    const point = metrics[ subject ][ i ];

                    const signDx = (point[ 0 ] - centerX);
                    const dx = Math.abs( signDx );

                    if ( maximum < dx ) {
                        maximum = dx;
                        if ( signDx > 0.0 ) {
                            direct = 1;
                        } else {
                            direct = 2;
                        }
                        number = i;
                    }

                    const signDy = (point[ 1 ] - centerY);
                    const dy = Math.abs( signDy );

                    if ( maximum < dy ) {
                        maximum = dy;
                        if ( signDy > 0.0 ) direct = 3;
                        else direct = 4;
                        number = i;
                    }
                }
            }

            if ( direct && number ) {
                const subject_min_max = new SUBJECT_MIN_MAX();
                subject_min_max.Direct = direct;
                subject_min_max.Number = number;
                subject_min_max.Count = count;
                subject_min_max.Subject = subject;
                subject_min_max.Maximum = maximum;

                buffer[ subject ] = subject_min_max;
            }
        }

        //****************************************************************
        // СОРТИРОВКА ПОДОБЪЕКТОВ В ПОРЯДКЕ УБЫВАНИЯ ВЕЛИЧИН
        // МАКСИМАЛЬНОГО АБСОЛЮТНОГО УДАЛЕНИЯ
        //****************************************************************

        // Число подобъектов
        // const count1 = polyCount - 1;

        // Сортировка по методу "пузырька" (сортировка указателей
        // вместо записей увеличивает скорость обработки)

        // Число проходов = count1-1 раз
        // for ( let i1 = 1; i1 < count1; i1++ ) {
        //     // Опустить запись с минимальным значением вниз
        //     // Число сравнений = count1-1 раз
        //     for ( let i2 = 1; i2 < count1; i2++ ) {
        //         const index1 = index[ i2 ];
        //         const index2 = index[ i2 + 1 ];
        //
        //         if ( buffer[ index1 ].Maximum < buffer[ index2 ].Maximum ) {
        //             // Поменять записи местами
        //             index[ i2 ] = index2;
        //             index[ i2 + 1 ] = index1;
        //         }
        //     }
        // }

        buffer.sort( ( a, b ) => b.Maximum - a.Maximum );


        //**************************************************************
        // ВКЛЮЧИТЬ МЕТРИКУ ПОДОБЪЕКТОВ ВХОДНОГО ОБЪЕКТА В КОНТУР
        // ВЫХОДНОГО ОБЪЕКТА
        //**************************************************************

        // const mCurVector = vec2.create();

        // Цикл по подобъектам в порядке сортировки
        for ( let i = 1; i < polyCount; i++ ) {
            // const record = buffer[ index[ i ] ];
            const record = buffer[ i - 1 ];

            const subject = record.Subject;
            if ( subject === 0 )
                continue;

            //**************************************************************
            // Найти ближайшую точку пересечения линии в направлении вектора
            // (вертикальной или горизонтальной) с отрезками выходного объекта
            //**************************************************************

            // Флаг наличия точки пересечения  // 0 - нет пересечения
            let cross = 0;                     // 1 - пересечение в точке crossNumber
            // 2 - пересечение за точкой crossNumber
            let crossNumber = 0;

            let dx, dy, a, b, crossX = 0, crossY = 0;

            // Точка подобъекта
            let maxPoint = metrics[ subject ][ record.Number ];

            // Первая точка первого отрезка
            let point2 = metrics[ 0 ][ 0 ];

            if ( record.Direct == 1 ) {     //  1 - вверх (максимум по X)

                let crossX_min = Number.MAX_VALUE;
                crossY = maxPoint[ 1 ];

                // Цикл по отрезкам выходного объекта (проходов на 1 меньше числа точек)
                for ( let j = 2; j <= countOut; j++ ) {
                    const point1 = point2;
                    point2 = pointOut[ j - 1 ];

                    // Пропустить отрезок ниже maxPoint[0]
                    if ( point1[ 0 ] < maxPoint[ 0 ] && point2[ 0 ] < maxPoint[ 0 ] ) continue;

                    // Пропустить отрезок слева и справа относительно maxPoint[1]
                    if ( point1[ 1 ] < maxPoint[ 1 ] && point2[ 1 ] < maxPoint[ 1 ] ) continue;
                    if ( point1[ 1 ] > maxPoint[ 1 ] && point2[ 1 ] > maxPoint[ 1 ] ) continue;

                    dx = point2[ 0 ] - point1[ 0 ];

                    // Горизонтальный отрезок
                    if ( Math.abs( dx ) < 1e-10 ) {
                        if ( crossX_min > point1[ 0 ] ) {
                            crossX_min = point1[ 0 ];
                            crossNumber = j - 1;
                            cross = 2;  // Пересечение после точки crossNumber
                        }

                        continue;
                    }

                    dy = point2[ 1 ] - point1[ 1 ];

                    // Вертикальный отрезок
                    if ( Math.abs( dy ) < 1e-10 ) {
                        // Вертикальный отрезок не принадлежит вертикальной линии
                        if ( Math.abs( maxPoint[ 1 ] - point1[ 1 ] ) > 1e6 )
                            continue;

                        // Отрезок объекта не может проходить через точку подобъекта
                        if ( point1[ 0 ] < maxPoint[ 0 ] || point2[ 0 ] < maxPoint[ 0 ] )
                            continue;

                        // Сохранить нижнюю точку отрезка (ближайшую к точке по maxPoint[0])
                        if ( point1[ 0 ] < point2[ 0 ] ) {
                            if ( crossX_min > point1[ 0 ] ) {
                                crossX_min = point1[ 0 ];
                                crossNumber = j - 1;
                                cross = 1;  // Пересечение в точке crossNumber
                            }
                        } else {
                            if ( crossX_min > point2[ 0 ] ) {
                                crossX_min = point2[ 0 ];
                                crossNumber = j;
                                cross = 1;  // Пересечение в точке crossNumber
                            }
                        }
                        continue;
                    }

                    a = dy / dx;
                    b = point1[ 1 ] - point1[ 0 ] * a;
                    crossX = (crossY - b) / a;

                    // Точка пересечения должна быть выше maxPoint[0]
                    if ( crossX > maxPoint[ 0 ] ) {
                        if ( crossX_min > crossX ) {
                            crossX_min = crossX;
                            crossNumber = j - 1;
                            cross = 2;  // Пересечение после точки crossNumber
                        }
                    }
                }

                crossX = crossX_min;
            } else if ( record.Direct == 2 ) { //  2 - вниз (минимум по X)

                let crossX_max = -Number.MAX_VALUE;
                crossY = maxPoint[ 1 ];

                // Цикл по отрезкам выходного объекта (проходов на 1 меньше числа точек)
                for ( let j = 2; j <= countOut; j++ ) {
                    const point1 = point2;
                    point2 = pointOut[ j - 1 ];

                    // Пропустить отрезок выше maxPoint[0]
                    if ( point1[ 0 ] > maxPoint[ 0 ] && point2[ 0 ] > maxPoint[ 0 ] ) continue;

                    // Пропустить отрезок слева и справа относительно maxPoint[1]
                    if ( point1[ 1 ] < maxPoint[ 1 ] && point2[ 1 ] < maxPoint[ 1 ] ) continue;
                    if ( point1[ 1 ] > maxPoint[ 1 ] && point2[ 1 ] > maxPoint[ 1 ] ) continue;

                    dx = point2[ 0 ] - point1[ 0 ];

                    // Горизонтальный отрезок
                    if ( Math.abs( dx ) < 1e-10 ) {
                        if ( crossX_max < point1[ 0 ] ) {
                            crossX_max = point1[ 0 ];
                            crossNumber = j - 1;
                            cross = 2;  // Пересечение после точки crossNumber
                        }
                        continue;
                    }

                    dy = point2[ 1 ] - point1[ 1 ];

                    // Вертикальный отрезок
                    if ( Math.abs( dy ) < 1e-10 ) {
                        // Вертикальный отрезок не принадлежит вертикальной линии
                        if ( Math.abs( maxPoint[ 1 ] - point1[ 1 ] ) >= 1e-10 ) {
                            continue;
                        }

                        // Отрезок объекта не может проходить через точку подобъекта
                        if ( point1[ 0 ] < maxPoint[ 0 ] || point2[ 0 ] < maxPoint[ 0 ] ) {
                            continue;
                        }

                        // Сохранить верхнюю точку отрезка (ближайшую к точке по maxPoint[0])
                        if ( point1[ 0 ] > point2[ 0 ] ) {
                            if ( crossX_max < point1[ 0 ] ) {
                                crossX_max = point1[ 0 ];
                                crossNumber = j - 1;
                                cross = 1;  // Пересечение в точке crossNumber
                            }
                        } else {
                            if ( crossX_max < point2[ 0 ] ) {
                                crossX_max = point2[ 0 ];
                                crossNumber = j;
                                cross = 1;  // Пересечение в точке crossNumber
                            }
                        }
                        continue;
                    }

                    a = dy / dx;
                    b = point1[ 1 ] - point1[ 0 ] * a;
                    crossX = (crossY - b) / a;

                    // Точка пересечения должна быть ниже maxPoint[0]
                    if ( crossX < maxPoint[ 0 ] ) {
                        if ( crossX_max < crossX ) {
                            crossX_max = crossX;
                            crossNumber = j - 1;
                            cross = 2;  // Пересечение после точки crossNumber
                        }
                    }
                }
                crossX = crossX_max;
            } else if ( record.Direct == 3 ) { //  3 - вправо (максимум по Y)

                let crossY_min = Number.MAX_VALUE;
                crossX = maxPoint[ 0 ];

                // Цикл по отрезкам выходного объекта (проходов на 1 меньше числа точек)
                for ( let j = 2; j <= countOut; j++ ) {
                    const point1 = point2;
                    point2 = pointOut[ j - 1 ];

                    // Пропустить отрезок левее maxPoint[1]
                    if ( point1[ 1 ] < maxPoint[ 1 ] && point2[ 1 ] < maxPoint[ 1 ] ) continue;

                    // Пропустить отрезок сверху и снизу относительно maxPoint[0]
                    if ( point1[ 0 ] < maxPoint[ 0 ] && point2[ 0 ] < maxPoint[ 0 ] ) continue;
                    if ( point1[ 0 ] > maxPoint[ 0 ] && point2[ 0 ] > maxPoint[ 0 ] ) continue;

                    dy = point2[ 1 ] - point1[ 1 ];

                    // Вертикальный отрезок
                    if ( Math.abs( dy ) < 1e-10 ) {
                        if ( crossY_min > point1[ 1 ] ) {
                            crossY_min = point1[ 1 ];
                            crossNumber = j - 1;
                            cross = 2;  // Пересечение после точки crossNumber
                        }

                        continue;
                    }

                    dx = point2[ 0 ] - point1[ 0 ];

                    // Горизонтальный отрезок
                    if ( Math.abs( dx ) < 1e-10 ) {
                        // Горизонтальный отрезок не принадлежит горизонтальной линии
                        if ( Math.abs( maxPoint[ 0 ] - point1[ 0 ] ) >= 1e-10 ) {
                            continue;
                        }

                        // Отрезок объекта не может проходить через точку подобъекта
                        if ( point1[ 1 ] < maxPoint[ 1 ] || point2[ 1 ] < maxPoint[ 1 ] ) {
                            continue;
                        }

                        // Сохранить левую точку отрезка (ближайшую к точке по maxPoint[1])
                        if ( point1[ 1 ] < point2[ 1 ] ) {
                            if ( crossY_min > point1[ 1 ] ) {
                                crossY_min = point1[ 1 ];
                                crossNumber = j - 1;
                                cross = 1;  // Пересечение в точке crossNumber
                            }
                        } else {
                            if ( crossY_min > point2[ 1 ] ) {
                                crossY_min = point2[ 1 ];
                                crossNumber = j;
                                cross = 1;  // Пересечение в точке crossNumber
                            }
                        }

                        continue;
                    }

                    a = dy / dx;
                    b = point1[ 1 ] - point1[ 0 ] * a;
                    crossY = maxPoint[ 0 ] * a + b;

                    // Точка пересечения должна быть правее maxPoint[1]
                    if ( crossY > maxPoint[ 1 ] )
                        if ( crossY_min > crossY ) {
                            crossY_min = crossY;
                            crossNumber = j - 1;
                            cross = 2;  // Пересечение после точки crossNumber
                        }
                }
                crossY = crossY_min;
            } else if ( record.Direct == 4 ) { //  4 - влево (минимум по Y)

                let crossY_max = -Number.MAX_VALUE;
                crossX = maxPoint[ 0 ];

                // Цикл по отрезкам выходного объекта (проходов на 1 меньше числа точек)
                for ( let j = 2; j <= countOut; j++ ) {
                    const point1 = point2;
                    point2 = pointOut[ j - 1 ];

                    // Пропустить отрезок правее maxPoint[1]
                    if ( point1[ 1 ] > maxPoint[ 1 ] && point2[ 1 ] > maxPoint[ 1 ] ) {
                        continue;
                    }

                    // Пропустить отрезок сверху и снизу относительно maxPoint[0]
                    if ( point1[ 0 ] < maxPoint[ 0 ] && point2[ 0 ] < maxPoint[ 0 ] ) {
                        continue;
                    }
                    if ( point1[ 0 ] > maxPoint[ 0 ] && point2[ 0 ] > maxPoint[ 0 ] ) {
                        continue;
                    }

                    dy = point2[ 1 ] - point1[ 1 ];

                    // Вертикальный отрезок
                    if ( Math.abs( dy ) < 1e-10 ) {
                        if ( crossY_max < point1[ 1 ] ) {
                            crossY_max = point1[ 1 ];
                            crossNumber = j - 1;
                            cross = 2;  // Пересечение после точки crossNumber
                        }

                        continue;
                    }

                    dx = point2[ 0 ] - point1[ 0 ];

                    // Горизонтальный отрезок
                    if ( Math.abs( dx ) < 1e-10 ) {
                        // Горизонтальный отрезок не принадлежит горизонтальной линии
                        if ( Math.abs( maxPoint[ 0 ] - point1[ 0 ] ) >= 1e-10 ) {
                            continue;
                        }

                        // Отрезок объекта не может проходить через точку подобъекта
                        if ( point1[ 1 ] < maxPoint[ 1 ] || point2[ 1 ] < maxPoint[ 1 ] ) {
                            continue;
                        }

                        // Сохранить правую точку отрезка (ближайшую к точке по maxPoint[1])
                        if ( point1[ 1 ] > point2[ 1 ] ) {
                            if ( crossY_max < point1[ 1 ] ) {
                                crossY_max = point1[ 1 ];
                                crossNumber = j - 1;
                                cross = 1;  // Пересечение в точке crossNumber
                            }
                        } else {
                            if ( crossY_max < point2[ 1 ] ) {
                                crossY_max = point2[ 1 ];
                                crossNumber = j;
                                cross = 1;  // Пересечение в точке crossNumber
                            }
                        }

                        continue;
                    }

                    a = dy / dx;
                    b = point1[ 1 ] - point1[ 0 ] * a;
                    crossY = maxPoint[ 0 ] * a + b;

                    // Точка пересечения должна быть левее maxPoint[1]
                    if ( crossY < maxPoint[ 1 ] )
                        if ( crossY_max < crossY ) {
                            crossY_max = crossY;
                            crossNumber = j - 1;
                            cross = 2;  // Пересечение после точки crossNumber
                        }
                }

                crossY = crossY_max;
            }

            //**************************************************************
            // Включить метрику подобъекта входного объекта в контур
            // выходного объекта разрезанием через точку пересечения
            //**************************************************************

            // При отсутствии точки пересечения пропустить подобъект
            // (выходит за границы объекта)
            if ( cross == 0 ) {
                continue;
            }
            crossNumber--;
            // Первая точка соединения в контуре выходного объекта
            if ( cross == 2 ) {
                // Вставить точку пересечения после точки crossNumber
                const pointCross = vec3.setValues( vec3.create(), crossX, crossY, 0 );

                pointOut.splice( crossNumber + 1, 0, pointCross );
                countOut++;

                // Встать на вставленную точку и добавить высоту
                crossNumber++;
                // if (isObject3D) {
                //     let d1c, d12;
                //
                //     // Точка перед вставленной
                //     const p1 = pointOut[crossNumber - 2];
                //
                //     // Инициализация высоты точки пересечения отрезка
                //
                //     // Точка после вставленной
                //     const p2 = pointOut[crossNumber];
                //
                //     // d12 = mapDistance( & p1,&p2);
                //     d12 = vec2.length(vec2.sub(p2, p1, mCurVector));
                //
                //     if (d12 > 1e-10) {
                //         // Точка пересечения
                //         const pc = [crossX, crossY];
                //         // d1c = mapDistance( & p1,&pc);
                //         d1c = vec2.length(vec2.sub(p1, pc, mCurVector));
                //     }
                // }
            }

            // С УЧЕТОМ НАПРАВЛЕНИЯ ЦИФРОВАНИЯ ДОБАВИТЬ ТОЧКИ ПОДОБЪЕКТА
            // ВХОДНОГО ОБЪЕКТА В МЕТРИКУ ВЫХОДНОГО ОБЪЕКТА

            // if ( mapSubjectDirect( in, subject ) !=OD_LEFT){
            windingOrder = TriangulatePanoramaAlgorithm.getWindingOrder( metrics[ subject ], projection );
            if ( windingOrder === WindingOrder.Clockwise ) {
                // Вставить точку соединения и следующие (исключая точку замыкания)
                for ( let i = record.Number; i < record.Count; i++ ) {
                    const point = metrics[ subject ][ i ];
                    // const pointCross = pointOut[crossNumber];
                    // pointCross[0] = point[0];
                    // pointCross[1] = point[1];

                    pointOut.splice( crossNumber + 1, 0, point );
                    countOut++;

                    crossNumber++;
                }

                // Вставить с 1 точки по точку соединения
                for ( let i = 1; i <= record.Number; i++ ) {
                    // mapGetPlanePoint( in,&point[ 0 ], i, subject);
                    const point = metrics[ subject ][ i ];
                    // const pointCross = pointOut[crossNumber];
                    // pointCross[0] = point[0];
                    // pointCross[1] = point[1];

                    // memmove( (pointCross + 1), pointCross, (sizeof( XYHDOUBLE ) * countOut - ((char *)pointCross - (char *)pointOut)));
                    pointOut.splice( crossNumber + 1, 0, point );
                    countOut++;

                    crossNumber++;
                }
            } else {
                // Вставить точку соединения и предыдущие
                for ( let i = record.Number; i >= 1; i-- ) {
                    // mapGetPlanePoint( in,&point[ 0 ], i, subject);
                    const point = metrics[ subject ][ i ];
                    // const pointCross = pointOut[crossNumber];
                    // pointCross[0] = point[0];
                    // pointCross[1] = point[1];
                    // memmove( (pointCross + 1), pointCross, (sizeof( XYHDOUBLE ) * countOut - ((char *)pointCross - (char *)pointOut)));
                    pointOut.splice( crossNumber + 1, 0, point );
                    countOut++;

                    crossNumber++;
                }

                // Вставить с последней точки по точку соединения (исключая точку замыкания)
                for ( let i = record.Count - 1; i >= record.Number; i-- ) {
                    // mapGetPlanePoint( in,&point[ 0 ], i, subject);
                    const point = metrics[ subject ][ i ];

                    // const pointCross = pointOut[crossNumber];
                    // pointCross[0] = point[0];
                    // pointCross[1] = point[1];

                    // memmove( (pointCross + 1), pointCross, (sizeof( XYHDOUBLE ) * countOut - ((char *)pointCross - (char *)pointOut)));
                    pointOut.splice( crossNumber + 1, 0, point );

                    countOut++;

                    crossNumber++;
                }
            }

            // Последняя точка соединения в контуре выходного объекта
            if ( cross == 2 ) {
                // Вставить точку пересечения после точки crossNumber
                const pointCross = vec3.setValues( vec3.create(), crossX, crossY, 0 );
                // memmove( (pointCross + 1), pointCross, (sizeof( XYHDOUBLE ) * countOut - ((char *)pointCross - (char *)pointOut)));
                pointOut.splice( crossNumber + 1, 0, pointCross );
                countOut++;

                // Встать на вставленную точку и добавить высоту
                crossNumber++;
            }
        }

        return pointOut;
    }

    private static mPositions = [];
    private static mCleanedPositions = [];

    private static getWindingOrder( positionsGeoJSON: Vector3D[], projection: Projection ) {

        TriangulatePanoramaAlgorithm.mPositions.length = 0;
        const normalizedPositions = TriangulatePanoramaAlgorithm.computeNormalizedPositions( positionsGeoJSON, TriangulatePanoramaAlgorithm.mPositions, projection );
        // Pipeline Stage 1b:  Clean up - Swap winding order
        TriangulatePanoramaAlgorithm.mCleanedPositions.length = 0;
        const cleanPositions = PolygonAlgorithms.cleanup( normalizedPositions, TriangulatePanoramaAlgorithm.mCleanedPositions );
        const plane = new EllipsoidTangentPlane( projection.getGlobeShape(), cleanPositions );
        const positionsOnPlane = plane.computePositionsOnPlane( cleanPositions );
        return PolygonAlgorithms.computeWindingOrder( positionsOnPlane );
    }

    private static computeNormalizedPositions( positionsGeoJSON: Vector3D[], positionArray: Vector3D[], projection: Projection ) {
        const positions = positionArray || [];
        for ( let i = 0; i < positionsGeoJSON.length; i++ ) {
            const xyhPoint = positionsGeoJSON[ i ];
            const geoPoint = projection.xy2geo( xyhPoint[ 0 ], xyhPoint[ 1 ], xyhPoint[ 2 ] );

            const cosLatitude = Math.cos( geoPoint.getLatitude() );
            positions[ i ] = [
                cosLatitude * Math.cos( geoPoint.getLongitude() ),
                cosLatitude * Math.sin( geoPoint.getLongitude() ),
                Math.sin( geoPoint.getLatitude() )];
        }
        return positions;
    }

    //------------------------------------------------------------------
}


