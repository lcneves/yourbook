(function() {
    var app = angular.module('bookModule', ['loginModule']);
    app.controller('MainController', ['$scope', 'loginStatus', function($scope, loginStatus) {
        
        // Listen to angular-login.js' $emit info on login
        $scope.receivedLogin = false;
        $scope.$on('received', function(event, data){
            $scope.receivedLogin = true;
        });
        $scope.$on('user', function(event, data){
            if (data) {
                $scope.isLogged = true;
                $scope.user = data;
                console.log(data);
            } else {
                $scope.isLogged = false;
                $scope.user = '';
            }
        });
        
        // Begin YourBook controller logic
    }]);
}());