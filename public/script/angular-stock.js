(function() {
    var app = angular.module('stockModule', []);
    app.controller('MainController', ['$scope', function($scope) {
        
        var chart;
        var host = location.origin.replace(/^http/, 'ws');
        var ws = new WebSocket(host);
        ws.onmessage = function (event) {
            var data = JSON.parse(event.data);
            if (data.error) {
                if (data.message) { $scope.message = data.message; }
            } else if (data.stocks) {
                $scope.stocksArray = data.stocks;
                $scope.message = '';
                (function($) { $(function() {
                    chart = new Highcharts.StockChart({
                        chart: {
                            renderTo: 'chart-container'
                        },
                        rangeSelector: {
                            selected: 1
                        },
                        series: data.stocks
                    });
                })}(jQuery));
            }
            $scope.isLoading = false;
            $scope.isRefreshing = false;
            $scope.$apply();
        };
        
        // Function to add new stock to watch list
        $scope.addStock = function(stockInput) {
            $scope.stockInput = '';
            if (stockInput) {
                var stockTrimmed = stockInput.replace(/\W/g, '');
                if (stockTrimmed.length > 1) {
                    $scope.isLoading = true;
                    ws.send(JSON.stringify({
                        add: true,
                        stock: stockTrimmed.toUpperCase()
                    }));
                }
            }
        };
        
        $scope.removeStock = function(stock) {
            stock.isLoading = true;
            ws.send(JSON.stringify({
                remove: true,
                stock: stock.name
            }));
        };
        
        $scope.refresh = function() {
            if (!$scope.isRefreshing) {
                $scope.isRefreshing = true;
                ws.send(JSON.stringify({
                    refresh: true
                }));
            }
        };  
    }]);
}());