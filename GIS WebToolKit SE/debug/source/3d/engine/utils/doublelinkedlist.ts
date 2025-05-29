/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Класс двоично связанного списка                   *
 *                                                                  *
 *******************************************************************/

/**
 * Класс двоично связанного списка
 * @class DoubleLinkedList
 */
export default class DoubleLinkedList<T = never> {
    head: NodeDLL<T> | null = null;
    last: NodeDLL<T> | null = null;
    count = 0;

    /**
     * Добавить данные в начало списка
     * @method push
     * @param new_data {object} Данные
     */
    push( new_data: T ) {
        /* 1. allocate node
         * 2. put in the data */
        const new_Node = new NodeDLL<T>( new_data );
        this.addNode( new_Node );
    }

    /**
     * Добавить данные в конец списка
     * @method pushLast
     * @param new_data {object} Данные
     */
    pushLast( new_data: T ) {
        /* 1. allocate node
         * 2. put in the data */
        const new_Node = new NodeDLL<T>( new_data );
        this.addLast( new_Node );
    }

    /**
     * Добавить узел в начало списка
     * @param new_Node {NodeDLL} Узел двоично связанного списка
     */
    addNode( new_Node: NodeDLL<T> ) {
        /* 3. Make next of new node as head and previous as NULL */
        new_Node.setNext( this.head );
        new_Node.setPrev( null );

        /* 4. change prev of head node to new node */
        if ( this.head !== null ) {
            this.head.setPrev( new_Node );
        } else {
            this.last = new_Node;
        }

        /* 5. move the head to point to the new node */
        this.head = new_Node;

        this.count++;
    }

    /**
     * Добавить узел в конец списка
     * @param newNode {NodeDLL} Узел двоично связанного списка
     */
    addLast( newNode: NodeDLL<T> ) {
        /* 3. Make next of new node as head and previous as NULL */
        newNode.setNext( null );
        newNode.setPrev( this.last );

        /* 4. change prev of head node to new node */
        if ( this.last !== null ) {
            this.last.setNext( newNode );
        }
        /* 5. move the head to point to the new node */
        this.last = newNode;

        if ( this.head === null ) {
            this.head = newNode;
        }

        this.count++;
    }

    /**
     * Удалить узел
     * @method deleteNode
     * @param del {NodeDLL} Узел двоично связанного списка
     */
    deleteNode( del: NodeDLL<T> ) {
        // Base case
        if ( this.head !== null && del !== null ) {
            // If node to be deleted is head node
            if ( this.head === del ) {
                this.head = del.getNext();
            }
            if ( this.last === del ) {
                this.last = del.getPrev();
            }

            // Change next only if node to be deleted
            // is NOT the last node
            const delNext = del.getNext();
            if ( delNext !== null ) {
                delNext.setPrev( del.getPrev() );
            }

            // Change prev only if node to be deleted
            // is NOT the first node
            const delPrev = del.getPrev();
            if ( delPrev !== null ) {
                delPrev.setNext( del.getNext() );
            }

            this.count--;
        }
    }

    /**
     * Получить узел начала списка
     * @return {NodeDLL} Узел начала списка
     */
    getHead() {
        return this.head;
    }

    /**
     * Получить узел конца списка
     * @return {NodeDLL} Узел конца списка
     */
    getLast() {
        return this.last;
    }

    /**
     * Получить количество узлов в списке
     * @method getCount
     * @return {number} Количество узлов в списке
     */
    getCount() {
        return this.count;
    }

    /**
     * Очистить список
     * @method clear
     */
    clear() {
        const next = this.head;
        if ( next ) {
            next.setPrev( null );
            next.setNext( null );
        }
        this.head = null;

        this.last = null;
    }
}

/**
 * Класс узла двоично связанного списка
 * @param data {object} Данные
 */
export class NodeDLL<T> {
    data: T;
    private next: NodeDLL<T> | null = null;
    private prev: NodeDLL<T> | null = null;

    constructor( data: T ) {
        this.data = data;
    }

    /**
     * Получить данные
     * @method getData
     * @return {object} Данные
     */
    getData() {
        return this.data;
    }


    /**
     * Установить следующий узел
     * @param value {NodeDLL|null} Узел
     */
    setNext( value: NodeDLL<T> | null ) {
        this.next = value;
    }


    /**
     * Получить следующий узел
     * @return {NodeDLL|null} Узел
     */
    getNext() {
        return this.next;
    }


    /**
     * Установить предыдущий узел
     * @param value {NodeDLL|null} Узел
     */
    setPrev( value: NodeDLL<T> | null ) {
        this.prev = value;
    }


    /**
     * Получить предыдущий узел
     * @return {NodeDLL|null} Узел
     */
    getPrev() {
        return this.prev;
    }
}
