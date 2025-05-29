/********************************************************************
 *                                                                  *
 *    REX/Javascript 1.0                                            *
 *    Robert D. Cameron "REX: XML Shallow Parsing with Regular      *
 *    Expressions", Technical Report TR 1998-17, School of          *
 *    Computing Science, Simon Fraser University, November, 1998.   *
 *    Copyright (c) 1998, Robert D. Cameron.                        *
 *    The following code may be freely used and distributed         *
 *    provided that this copyright and citation notice remains      *
 *    intact and that modifications or additions are clearly        *
 *    identified.                                                   *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                       Класс XML элемента                         *
 *                                                                  *
 *******************************************************************/


const TextSE = '[^<]+';
const UntilHyphen = '[^-]*-';
const Until2Hyphens = UntilHyphen + '([^-]' + UntilHyphen + ')*-';
const CommentCE = Until2Hyphens + '>?';
const UntilRSBs = '[^]]*]([^]]+])*]+';
const CDATA_CE = UntilRSBs + '([^]>]' + UntilRSBs + ')*>';
const S = '[ \\n\\t\\r]+';
const NameStructure = '[A-Za-z_:]|[^\\x00-\\x7F]';
const NameChar = '[A-Za-z0-9_:.-]|[^\\x00-\\x7F]';
const Name = '(' + NameStructure + ')(' + NameChar + ')*';
const QuoteSE = '"[^"]' + '*' + '"' + "|'[^']*'";
const DT_IdentSE = S + Name + '(' + S + '(' + Name + '|' + QuoteSE + '))*';
const MarkupDeclCE = "([^]\"'><]+|" + QuoteSE + ')*>';
const S1 = '[\\n\\r\\t ]';
const UntilQMs = '[^?]*\\?+';
const PI_Tail = '\\?>|' + S1 + UntilQMs + '([^>?]' + UntilQMs + ')*>';
const DT_ItemSE = '<(!(--' + Until2Hyphens + '>|[^-]' + MarkupDeclCE + ')|\\?' + Name + '(' + PI_Tail + '))|%' + Name + ';|' + S;
const DocTypeCE = DT_IdentSE + '(' + S + ')?(\\[(' + DT_ItemSE + ')*](' + S + ')?)?>?';
const DeclCE = '--(' + CommentCE + ')?|\\[CDATA\\[(' + CDATA_CE + ')?|DOCTYPE(' + DocTypeCE + ')?';
const PI_CE = Name + '(' + PI_Tail + ')?';
const EndTagCE = Name + '(' + S + ')?>?';
const AttValSE = '"[^<"]' + '*' + '"' + "|'[^<']*'";
const ElemTagCE = Name + '(' + S + Name + '(' + S + ')?=(' + S + ')?(' + AttValSE + '))*(' + S + ')?/?>?';
const MarkupSPE = '<(!(' + DeclCE + ')?|\\?(' + PI_CE + ')?|/(' + EndTagCE + ')?|(' + ElemTagCE + ')?)';
const XML_SPE = TextSE + '|' + MarkupSPE;

/**
 * Разбор XML строки по регулярному выражению
 * @function XMLShallowParse
 * @param XMLDoc {string} Строка XML
 * @return {RegExpMatchArray|null} Результат разбора
 */
export default function XMLShallowParse( XMLDoc: string ) {
    return XMLDoc.match( new RegExp( XML_SPE, 'g' ) );
}
