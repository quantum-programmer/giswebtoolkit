/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *     Функция преобразования строки в дерево XML-элементов         *
 *                                                                  *
 *******************************************************************/


import XMLElement from '~/services/Utils/XMLElement';
import XMLShallowParse from '~/services/Utils/XMLShallowParse';

const tagRegex = /<([\w|:]+)\W/;
const tagClosingRegex = /<\//;
const tagSelfClosingRegex = /\/>/;
const attributesRegex = /(\S+)=['"]((?:(?!\/>|>|"|').)*)/g;

/**
 * Преобразование каждой строки в XML-элемент
 * @function parseIteration
 * @param startIndex {number} Индекс родительского узла при разборе
 * @param xmlArray {string[]} Массив строк XML-элементов
 * @param parentNode {XMLElement} Текущий родительский XML-элемент
 * @return {number} Индекс нового узла
 */
function parseIteration( startIndex: number, xmlArray: string[], parentNode: XMLElement ) {
    let i = startIndex + 1;
    for ( ; i < xmlArray.length; i++ ) {
        const xmlElement = xmlArray[ i ].trim();
        if ( xmlElement ) {
            const xmlTag = xmlElement.match( tagRegex );
            if ( xmlTag && xmlTag[ 1 ] ) {
                const tagName = xmlTag[ 1 ];
                const xmlObject = new XMLElement( tagName );
                parentNode.addChild( xmlObject );

                let m;
                while ( (m = attributesRegex.exec( xmlElement )) !== null ) {
                    // This is necessary to avoid infinite loops with zero-width matches
                    if ( m.index === attributesRegex.lastIndex ) {
                        attributesRegex.lastIndex++;
                    }
                    if ( m[ 0 ] ) {
                        let value = m[2];
                        if (value.length > 0) {
                            value = value.replaceAll('&quot;', '"');
                            value = value.replaceAll('&apos;', "'");
                            value = value.replaceAll('&lt;', '<');
                            value = value.replaceAll('&gt;', '>');
                            value = value.replaceAll('&amp;', '&');
                        }

                        xmlObject.addAttribute( m[ 1 ], value );
                    }
                }

                if ( xmlElement.match( tagSelfClosingRegex ) ) {
                    continue;
                }
                i = parseIteration( i, xmlArray, xmlObject );
            } else {
                if ( xmlElement.match( tagClosingRegex ) ) {
                    break;
                }
                parentNode.data = xmlElement;
            }
        }
    }
    return i;
}

/**
 * Преобразование XML строки в дерево XML-элементов
 * @function ParseTextToXml
 * @param XMLDoc {string} Строка XML
 * @return {XMLElement} Головной XML-элемент
 */
export function ParseTextToXml( XMLDoc: string ) {
    const xmlArray = XMLShallowParse( XMLDoc );

    const parentNode = new XMLElement( 'document' );
    if ( xmlArray !== null ) {
        parseIteration( -1, xmlArray, parentNode );
    }
    return parentNode;
}
