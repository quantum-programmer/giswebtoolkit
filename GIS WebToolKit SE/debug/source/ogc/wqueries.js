

// Создать XML-документ
xmlDocument = function xmlDocument() {
    if (window.DOMParser) {
        return new DOMParser();
    }
    else    // ie
    {
        var xdoc = new ActiveXObject("Microsoft.XMLDOM");
        xdoc.async = "false";
        return xdoc;
    }
}

// загрузить xml
function xmlLoad(xml) {
    if (xml == null || xml.length == 0)
        return;
    var doc = xmlDocument();
    if (window.DOMParser) {
        var xdoc = doc.parseFromString(xml, "application/xml");
        doc = xdoc;
    }
    else    // ie
    {
        doc.loadXML(xml);
    }
    return doc;
}


// Создать XML-отчет об ошибке (OGC OWS 2.0 standard)
setExceptionResponse = function (mess) {

    var str = '<?xml version=\"1.0\" encoding=\"utf-8\"?><ExceptionReport ' +
        'version="1.0.0" xmlns="http://www.opengis.net/ows/2.0" ' +
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
        'xsi:schemaLocation="http://www.opengis.net/ows/2.0 owsExceptionReport.xsd" ><Exception><ExceptionText>';

    if (typeof (mess) != "undefined")
        str += mess;

    str += '</ExceptionText></Exception></ExceptionReport>';

    return str;
}