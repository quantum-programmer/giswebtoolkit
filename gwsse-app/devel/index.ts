import GISWebServerSEService from '../service/GISWebServerSEService';

//для разработки подменяем адрес
//@ts-ignore
GISWebServerSEService.prototype.getDefaults = function () {
    return {
        url: 'http://localhost/GWSSE/',
        // url: 'http://127.0.0.1/GWSSE/',
        withCredentials: true,
        timeout: 60000,
        responseType: 'json',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    };
};


// const url = 'http://localhost:8080/?b=55.850000&l=38.440000&z=13';
// const url = 'http://localhost:8080/?objcard=C6BAE178-B390-4E86-BBD2-EE6941318593:ObjName:111111112222&objcardact=fitmapobject';
//const url = 'http://localhost:8080/?objcard=C6BAE178-B390-4E86-BBD2-EE6941318593:ObjName:111111112222&objcardact=opencard';
//const url = 'http://localhost:8080/?objcard=C6BAE178-B390-4E86-BBD2-EE6941318593:ObjName:111111112222';

// (window as any).theMapVue.ready.then(() => {
//     window.setTimeout(() => {
//
//         (window as any).theMapVue.loadFromUrl(url);
//
//     }, 1000);
// });
