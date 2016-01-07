var PORT = process.env.PORT || 8080,
    http = require("http"),
    https = require("https"),
    express = require('express'),
    app = express(),
    server = http.createServer(app),
    WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({ server: server });
    
// Serve static HTML and JS files from the "public" dir.
app.use(express.static('public'));

// The stocks to follow are in an array.
var stocksArray = [
    {name: 'AAPL', data: []},
    {name: 'QQQ', data: []},
    {name: 'MSFT', data: []}
];

var getStockHistory = function(stock, callback) {
    var date = new Date();
    var lastYear = (date.getFullYear() - 1).toString();
    var thisYear = date.getFullYear().toString();
    var month = ('0' + (date.getMonth() + 1).toString()).slice(-2);
    var day = ('0' + date.getDate().toString()).slice(-2);
    var options = {
        host: 'query.yahooapis.com',
        path: '/v1/public/yql?q=select%20*%20from%20yahoo.finance.historicaldata%20where%20symbol%20%3D%20%22' + stock + '%22%20and%20startDate%20%3D%20%22' + lastYear + '-' + month + '-' + day + '%22%20and%20endDate%20%3D%20%22' + thisYear + '-' + month + '-' + day + '%22&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys'
    };
    https.get(options, function(res) {
        var body = '';
        res.on('data', function(chunk) {
            body += chunk;
        }).on('end', function() {
            var sendArray;
            var data = JSON.parse(body);
            if (data.query.results) {
                sendArray = [];
                data.query.results.quote.forEach(function(each) {
                    sendArray.unshift([new Date(each.Date).getTime(), parseFloat(each.Close)]);
                });
            } else { sendArray = false; }
            callback(sendArray);
        });
    });
};

var refreshStockInfo = function(callback) {
    var newStocksArray = [];
    var count = 0;
    stocksArray.forEach(function(element, index, array) {
        getStockHistory(element.name, function(stockHistoryArray) {
            if (stockHistoryArray) {
                newStocksArray.push({name: element.name, data: stockHistoryArray});
            }
            count++;
            if (count == array.length) {
                stocksArray = newStocksArray.slice(0);
                callback();
            }
        });
    });
}

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        var data = JSON.parse(message);
        var index = -1;
        stocksArray.forEach(function(element, localIndex, array) {
            if (element.name == data.stock) { index = localIndex; }
        });
        if (data.add) {
            if (index == -1) {
                getStockHistory(data.stock, function(stockHistoryArray) {
                    if (stockHistoryArray) {
                        stocksArray.push({name: data.stock, data: stockHistoryArray});
                        wss.broadcast();
                    } else {
                        sendError('Stock ' + data.stock + ' not found');
                    }
                });
            } else {
                sendError('Stock ' + data.stock + ' is already being watched');
            }
        }
        if (data.remove) {
            if (index != -1) {
                stocksArray.splice(index, 1);
            }
            wss.broadcast();
        }
        if (data.refresh) {
            refreshStockInfo(function() {
                wss.broadcast();
            });
        }
    });
    
    wss.broadcast = function broadcast() {
        wss.clients.forEach(function each(client) {
            client.send(JSON.stringify({
                error: false,
                stocks: stocksArray
            }));
        });
    };

    var sendError = function(err) {
        ws.send(JSON.stringify({
            error: true,
            message: err
        }));
    };
    
    wss.broadcast();
});

// Get stock history data and, when done, start listening to connections
refreshStockInfo(function() {
    server.listen(PORT, function() { console.log('Listening on ' + server.address().port) });
});
