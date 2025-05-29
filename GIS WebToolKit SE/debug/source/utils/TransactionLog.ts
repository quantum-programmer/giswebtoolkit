/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *               Журнал транзакций редактора объектов               *
 *                                                                  *
 *******************************************************************/

import Utils from '~/services/Utils';

export interface TransactionData {
    id: string;
    timeStamp: number;
    actionId: string;
    commitList: {
        transactionNumber: string;
        xId: string;
    }[]
}

export interface TransactionStorage {
    undoList: TransactionData[];
    redoList: TransactionData[];
}


/**
 * Журнал транзакций редактора объектов
 * @class TransactionLog
 */
export default class TransactionLog {

    private readonly transactions: TransactionData[] = [];

    private readonly undoneTransactions: TransactionData[] = [];

    constructor( transactionStorage: TransactionStorage, layersXIdList: string[] ) {

        const storageClearDate = new Date();
        storageClearDate.setHours( 0, 0, 0, 0 );
        storageClearDate.setDate( storageClearDate.getDate() - 1 ); // позавчерашняя дата

        const minTransactionTimestampValue = storageClearDate.getTime();

        transactionStorage.undoList.forEach( transaction => {
            if ( transaction.timeStamp >= minTransactionTimestampValue ) {
                const commitList: TransactionData['commitList'] = [];

                transaction.commitList.forEach( ( { xId, transactionNumber } ) => {
                    if ( layersXIdList.includes( xId ) ) {
                        commitList.push( { xId, transactionNumber } );
                    }
                } );

                if ( commitList.length ) {
                    const transactionCopy = TransactionLog.copyTransaction( transaction );
                    transactionCopy.commitList = commitList;
                    this.transactions.push( transactionCopy );
                }
            }
        } );

        transactionStorage.redoList.forEach( transaction => {
            if ( transaction.timeStamp >= minTransactionTimestampValue ) {
                const commitList: TransactionData['commitList'] = [];

                transaction.commitList.forEach( ( { xId, transactionNumber } ) => {
                    if ( layersXIdList.includes( xId ) ) {
                        commitList.push( { xId, transactionNumber } );
                    }
                } );

                if ( commitList.length ) {
                    const transactionCopy = TransactionLog.copyTransaction( transaction );
                    transactionCopy.commitList = commitList;
                    this.undoneTransactions.push( transactionCopy );
                }
            }
        } );

    }

    doTransaction( transaction: TransactionData ): void {
        const originTransactionIndex = this.undoneTransactions.findIndex( currentTransaction => currentTransaction.id === transaction.id );
        if ( originTransactionIndex !== -1 ) {
            //чистим транзакции по наличию в передаваемом объекте
            const originTransaction = this.undoneTransactions[ originTransactionIndex ];
            for ( let i = 0; i < originTransaction.commitList.length; i++ ) {
                const originCommitItem = originTransaction.commitList[ i ];
                if ( transaction.commitList.find( commitItem => commitItem.xId === originCommitItem.xId ) ) {
                    originTransaction.commitList.splice( i, 1 );
                    i--;
                }
            }

            //если отменены транзакции по всем слоям, удаляем запись
            if ( originTransaction.commitList.length === 0 ) {
                this.undoneTransactions.splice( originTransactionIndex, 1 );
            } else {
                originTransaction.id = Utils.generateGUID();
            }

        } else {
            //чистим все, если новое действие пользователя
            this.undoneTransactions.splice( 0 );
        }
        this.transactions.push( transaction );
    }

    undoTransaction( transaction: TransactionData ): void {
        const originTransactionIndex = this.transactions.findIndex( currentTransaction => currentTransaction.id === transaction.id );
        if ( originTransactionIndex !== -1 ) {
            //чистим транзакции по наличию в передаваемом объекте
            const originTransaction = this.transactions[ originTransactionIndex ];
            for ( let i = 0; i < originTransaction.commitList.length; i++ ) {
                const originCommitItem = originTransaction.commitList[ i ];
                if ( transaction.commitList.find( commitItem => commitItem.xId === originCommitItem.xId ) ) {
                    originTransaction.commitList.splice( i, 1 );
                    i--;
                }
            }

            //если отменены транзакции по всем слоям, удаляем запись
            if ( originTransaction.commitList.length === 0 ) {
                this.transactions.splice( originTransactionIndex, 1 );
            }

            this.undoneTransactions.push( transaction );
        }
    }

    getLastTransaction( layerXId?: string ): TransactionData | undefined {
        if ( this.transactions.length === 0 ) {
            return;
        }

        if ( !layerXId ) {
            return TransactionLog.copyTransaction( this.transactions[ this.transactions.length - 1 ] );
        }

        for ( let i = this.transactions.length - 1; i >= 0; i-- ) {
            const transactionItem = this.transactions[ i ];
            if ( transactionItem.commitList.find( commitItem => commitItem.xId === layerXId ) ) {
                const result = TransactionLog.copyTransaction( transactionItem );
                result.commitList = result.commitList.filter( commitItem => commitItem.xId === layerXId );
                return result;
            }
        }
    }

    getTransactionsCount( layerXId?: string ): number {
        let result = this.transactions.length;
        if ( result && layerXId ) {
            result = 0;
            this.transactions.forEach( transactionItem => {
                if ( transactionItem.commitList.find( commitItem => commitItem.xId === layerXId ) ) {
                    result++;
                }
            } );
        }
        return result;
    }

    getLastUndoneTransaction(): TransactionData | undefined {
        if ( this.undoneTransactions.length !== 0 ) {
            return TransactionLog.copyTransaction( this.undoneTransactions[ this.undoneTransactions.length - 1 ] );
        }
    }

    getUndoneTransactionsCount(): number {
        return this.undoneTransactions.length;
    }

    updateLayerTransactions( layerXId: string, transactionNumbers: string[] ): void {

        for ( let i = 0; i < this.transactions.length; i++ ) {
            const originTransaction = this.transactions[ i ];
            for ( let j = 0; j < originTransaction.commitList.length; j++ ) {
                const originCommitItem = originTransaction.commitList[ j ];
                if ( originCommitItem.xId === layerXId && !transactionNumbers.includes( originCommitItem.transactionNumber ) ) {
                    originTransaction.commitList.splice( j, 1 );
                    j--;
                }
            }
            //если отменены транзакции по всем слоям, удаляем запись
            if ( originTransaction.commitList.length === 0 ) {
                this.transactions.splice( i, 1 );
                i--;
            }
        }
    }

    toJSON(): TransactionStorage {
        const undoList: TransactionData[] = this.transactions.map( TransactionLog.copyTransaction );

        const redoList: TransactionData[] = this.undoneTransactions.map( TransactionLog.copyTransaction );

        return { undoList, redoList };
    }

    private static copyTransaction( transaction: TransactionData ): TransactionData {
        const {
            id,
            timeStamp,
            actionId,
            commitList
        } = transaction;

        return {
            id,
            timeStamp,
            actionId,
            commitList: commitList.map( ( { xId, transactionNumber } ) => ({ xId, transactionNumber }) )
        };

    }
}
