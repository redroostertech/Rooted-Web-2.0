#!/usr/bin/env node

const debug         = require('debug')('app');
const app           = require('./server/index');
const http          = require('http');

app.set('port', process.env.PORT || 3000);

var server = http.createServer(app);
server.setTimeout(72000000);
server.timeout = 72000000;
server.agent= false;
server.listen(app.get('port'), function() {
    console.log('Rooted running on port ' + server.address().port + '.');
});
