'use strict';

const express = require('express');

// приложение
const app = express();

app.use(express.static(__dirname + '/gwtk-app'));

const PORT = 8080;
const IP = '0.0.0.0';

app.listen(PORT, IP, () => {
    console.log(`Running on - http://${IP}:${PORT}`);
});
