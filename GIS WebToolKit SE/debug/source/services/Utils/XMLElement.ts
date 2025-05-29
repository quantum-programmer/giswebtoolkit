/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                       Класс XML элемента                         *
 *                                                                  *
 *******************************************************************/

import { SimpleJson } from '~/types/CommonTypes';

type JSONFromXML = SimpleJson<undefined | string | SimpleJson | JSONFromXML[]> & {
    '@tag': string;
    '@data'?: string;
    '@attributes'?: SimpleJson;
    '@children'?: JSONFromXML[];
}

/**
 * Класс XML элементай
 * @class XMLElement
 * @param name {string} Название тега
 * @param data? {string} Данные элемента
 * @param attributes? {SimpleJson} Атрибуты элемента
 */
export default class XMLElement {
    children: XMLElement[] = [];
    data: string | undefined;
    tag: string;
    attributes: SimpleJson;

    constructor( name: string, data?: string, attributes?: SimpleJson ) {
        this.tag = name;
        this.data = data;
        this.attributes = { ...attributes };
    }

    /**
     * Сформировать строку с атрибутами и их значениями
     * @private
     * @method formAttributesString
     * @return {string} Строка с атрибутами и их значениями
     */
    private formAttributesString() {
        const result: string[] = [];
        for ( let key in this.attributes ) {
            result.push( key + '="' + this.attributes[ key ] + '"' );
        }
        return (result.length > 0) ? (' ' + result.join( ' ' )) : '';
    }

    /**
     * Добавить дочерний элемент
     * @method addChild
     * @param xmlObject {XMLElement} XML-элемент
     */
    addChild( xmlObject: XMLElement ) {
        this.children.push( xmlObject );
    }

    /**
     * Добавить атрибут
     * @method addAttribute
     * @param name {string} Название атрибута
     * @param value {string} Значение атрибута
     */
    addAttribute( name: string, value: string ) {
        this.attributes[ name ] = value;
    }

    /**
     * Сформировать XML-строку (вызов метода и в дочерних элементах)
     * @method toString
     * @return {string} XML-в виде строки
     */
    toString() {
        let result = '';
        if ( this.tag !== 'document' ) {
            result += `<${this.tag}${this.formAttributesString()}>`;
        }
        if ( this.data !== undefined ) {
            result += this.data;
        }
        for ( let i = 0; i < this.children.length; i++ ) {
            result += this.children[ i ].toString();
        }
        if ( this.tag !== 'document' ) {
            result += `</${this.tag}>`;
        }
        return result;
    }

    /**
     * Сформировать JSON объект (вызов метода и в дочерних элементах)
     * @method toJSON
     * @return {JSONFromXML} XML-в виде JSON-объекта
     */
    toJSON() {
        // Create the return object
        let attributes;
        if ( Object.values( this.attributes ).length > 0 ) {
            attributes = { ...this.attributes };
        }

        let children;

        if ( this.children.length > 0 ) {
            children = [];
            for ( let i = 0; i < this.children.length; i++ ) {
                const childNode = this.children[ i ];
                children.push( childNode.toJSON() );
            }
        }
        const obj: JSONFromXML = {
            '@tag': this.tag,
            '@data': this.data,
            '@attributes': attributes,
            '@children': children
        };

        return obj;
    }

    /**
     * Найти элемент по тегу (поиск продолжается в дочерних элементах)
     * @method findByTag
     * @param tagName {string} Название тега
     * @return {XMLElement|undefined} Найденный элемент
     */
    findByTag( tagName: string ): XMLElement | undefined {
        let result;

        if ( this.tag === tagName ) {
            result = this;
        } else {
            for ( let i = 0; i < this.children.length; i++ ) {
                const foundElement = this.children[ i ].findByTag( tagName );
                if ( foundElement !== undefined ) {
                    result = foundElement;
                    break;
                }
            }
        }
        return result;
    }

}
