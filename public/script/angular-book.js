(function() {
    var app = angular.module('bookModule', ['loginModule']);
    app.controller('MainController', ['$scope', 'loginStatus', function($scope, loginStatus) {
        
        // Listen to angular-login.js' $emit info on login
        $scope.receivedLogin = false;
        $scope.$on('received', function(event, data) {
            $scope.receivedLogin = true;
        });
        $scope.$on('user', function(event, data) {
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
        
        // Controls the navigation tabs behaviour
        $scope.tab = "allBooks";
        
        // Function to query for books to add to collection
        $scope.addBook = function(bookQuery) {
            if (bookQuery && !bookQuery.isLoading) {
                bookQuery.isLoading = true;
                jQuery.post("search-book", bookQuery, function(data) {
                    bookQuery.isLoading = false;
                    if (data.error) {
                        bookQuery.errorStatus = "error";
                        bookQuery.errorMessage = data.message;
                    } else {
                        bookQuery.errorStatus = "success";
                        $scope.resultsArray = data.data;
                    }
                    $scope.$apply();
                });
            }
        };
        
    }]);
}());