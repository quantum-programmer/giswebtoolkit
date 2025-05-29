/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                        Класс связанного списка                   *
 *                                                                  *
 *******************************************************************/

/**
 * Класс связанного списка
 * @class LinkedList
 */
export default class LinkedList<T = never> {
    head?: Node<T>;
    length = 0;

    /**
     * Добавить данные в конец списка
     * @method add
     * @param data {object} Данные
     * @param index {number} Индекс
     */
    add( data: T, index: number ) {
        const nodeToAdd = new Node<T>( data, index );
        let nodeToCheck = this.head;
        // if the head is null
        if ( !nodeToCheck ) {
            this.head = nodeToAdd;
            this.length++;
        } else {
            // loop until we find the end
            while ( nodeToCheck.next ) {
                nodeToCheck = nodeToCheck.next;
            }
            // once were at the end of the list
            nodeToCheck.next = nodeToAdd;
            nodeToAdd.prev = nodeToCheck;
            this.length++;
        }
    }

    /**
     * Добавить узел в конец списка
     * @method addNode
     * @param nodeToAdd {Node} Узел связанного списка
     */
    addNode( nodeToAdd: Node<T> ) {

        // if the head is null
        if ( !this.head ) {
            this.head = nodeToAdd;
            this.head.prev = undefined;
            this.head.next = undefined;
            this.length++;
        } else {
            let nodeToCheck = this.head;
            // loop until we find the end
            while ( nodeToCheck.next ) {
                nodeToCheck = nodeToCheck.next;
            }
            // once were at the end of the list
            nodeToCheck.next = nodeToAdd;
            nodeToAdd.prev = nodeToCheck;
            nodeToAdd.next = undefined;
            this.length++;
        }
    }

    /**
     * Добавить узел перед другим узлом
     * @method addNodeBefore
     * @param nodeToAdd {Node} Узел связанного списка
     * @param node {Node} Узел, перед которым следует добавить новый
     */
    addNodeBefore( nodeToAdd: Node<T>, node: Node<T> ) {
        let nodeToCheck = this.head;
        // if the head is null
        if ( !node || !nodeToCheck ) {
            return;
        }
        let exist = false;
        // loop until we find the end
        while ( !exist && nodeToCheck.next ) {
            if ( nodeToCheck.index == node.index )
                exist = true;
            nodeToCheck = nodeToCheck.next;
        }
        if ( exist ) {
            if ( nodeToCheck.prev ) {
                nodeToAdd.prev = nodeToCheck.prev;
                nodeToAdd.prev.next = nodeToAdd;
            } else {
                nodeToAdd.prev = undefined;
            }
            nodeToAdd.next = nodeToCheck;
            nodeToCheck.prev = nodeToAdd;
        }
        this.length++;
    }

    /**
     * Получить узел по порядковому номеру
     * @method get
     * @param num {number} Порядковый номер узла
     * @return {Node} Узел связанного списка
     */
    get( num: number ) {
        let result;
        // a little error checking
        if ( num <= this.length && num >= 0 ) {
            let nodeToCheck = this.getHead(),
                count = 0;
            // if the first node
            if ( num !== 0 ) {
                // find the node we're looking for
                while ( nodeToCheck && count < num ) {
                    nodeToCheck = nodeToCheck.next;
                    count++;
                }
            }
            result = nodeToCheck;
        }
        return result;
    }

    /**
     * Получить головной узел
     * @method getHead
     * @return {Node} Головной узел
     */
    getHead() {
        return this.head;
    }

    /**
     * Удалить узел по порядковому номеру
     * @method remove
     * @param num {number} Порядковый номер узла
     */
    remove( num: number ) {
        // error check
        if ( this.head && num <= this.length ) {
            // if the first node
            if ( num === 0 ) {
                this.head = this.head.next;
                if ( this.head ) {
                    this.head.prev = undefined;
                }
                this.length--;
            } else {
                let nodeToCheck: Node<T> | undefined = this.head,
                    count = 0,
                    prevNode;
                // all other cases
                while ( nodeToCheck && count < num ) {
                    prevNode = nodeToCheck;
                    nodeToCheck = nodeToCheck.next;
                    count++;
                }
                if ( count === num && nodeToCheck ) {
                    // nodeToCheck is now the correct node
                    const nextNode = nodeToCheck.next;
                    if ( prevNode ) {
                        prevNode.next = nextNode;
                    }
                    if ( nextNode ) {
                        nextNode.prev = prevNode;
                    }
                    // nodeToCheck = null;
                    this.length--;
                }
            }
        }
    }

    /**
     * Удалить узел
     * @method removeNode
     * @param node {Node} Узел связанного списка
     */
    removeNode( node: Node<T> ) {

        // if the first node
        if ( this.head && this.head.index == node.index ) {
            this.head = this.head.next;
            if ( this.head ) {
                this.head.prev = undefined;
            }
            this.length--;
            return;
        }

        let nodeToCheck = this.head,
            prevNode,
            flag = false;

        // all other cases
        while ( nodeToCheck && !flag ) {
            if ( nodeToCheck.index == node.index ) {
                flag = true;
                break;
            }

            prevNode = nodeToCheck;
            nodeToCheck = nodeToCheck.next;
        }
        if ( flag && nodeToCheck ) {
            // nodeToCheck is now the correct node
            if ( prevNode ) {
                prevNode.next = nodeToCheck.next;
            }
            if ( nodeToCheck.next ) {
                nodeToCheck.next.prev = prevNode;
            }
            // nodeToCheck = null;
            this.length--;
        }
    }
}

/**
 * Класс узла связанного списка
 * @class Node
 * @param value {object} Данные
 * @param [index] {number} Индекс
 */
class Node<T> {
    next?: Node<T>;
    prev?: Node<T>;
    value: T;
    index: number;

    constructor( value: T, index = Date.now() + Math.random() ) {
        this.value = value;
        this.index = index;
    }
}
