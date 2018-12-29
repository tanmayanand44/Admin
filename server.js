const http = require('http');
const app = require('./app');

const port = process.env.PORT || 3800;

const server = http.createServer(app);

server.listen(port, function () {
    console.log(`listening on ${port}`);
});
//hel
