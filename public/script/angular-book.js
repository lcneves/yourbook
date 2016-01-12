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
                // Get user's personal book collection
                $scope.listMyCollection();
            } else {
                $scope.isLogged = false;
                $scope.user = '';
            }
        });
        
        // Begin YourBook controller logic
        
        // Controls the navigation tabs behaviour
        $scope.tab = "allBooks";
        
        
        // Function to display all books in all users' collections
        $scope.allBooks = {};
        $scope.listAllBooks = function() {
            if (!$scope.allBooks.status != "loading") {
                $scope.allBooks.status = "loading";
                jQuery.post("list-all-books", function(data) {
                    console.log(JSON.stringify(data));
                    if (data.error) {
                        $scope.allBooks.status = "error";
                        $scope.allBooks.message = data.message;
                    } else {
                        $scope.allBooks.status = "success";
                        $scope.allBooks.books = data.data;
                    }
                    $scope.$apply();
                });
            }
        };
        
        // Function to display books in personal collection
        $scope.myCollection = {};
        $scope.listMyCollection = function() {
            if (!$scope.myCollection.status != "loading") {
                $scope.myCollection.status = "loading";
                jQuery.post("list-personal-collection", function(data) {
                    console.log(JSON.stringify(data));
                    if (data.error) {
                        $scope.myCollection.status = "error";
                        $scope.myCollection.message = data.message;
                    } else {
                        $scope.myCollection.status = "success";
                        $scope.myCollection.books = data.data;
                    }
                    $scope.$apply();
                });
            }
        };
        
        $scope.query = {};
        // Function to query for books to add to collection
        $scope.searchBook = function(bookQuery) {
            if ($scope.query.status != "loading") {
                $scope.query.status = "loading";
                jQuery.post("search-book", bookQuery, function(data) {
                    if (data.error) {
                        $scope.query.status = "error";
                        $scope.query.message = data.message;
                    } else {
                        $scope.query.status = "success";
                        $scope.resultsArray = data.data;
                    }
                    $scope.$apply();
                });
            }
        };
        
        // Function to add a book to user's collection
        $scope.addBook = function(book) {
            $scope.query.status = "adding";
            jQuery.post("add-book", book, function(data) {
                if (data.error) {
                    $scope.query.status = "error";
                    $scope.query.message = data.message;
                    $scope.$apply();
                } else {
                    $scope.listMyCollection();
                }
            });
        };
        
        // Undoes the above
        $scope.removeBook = function(book) {
            jQuery.post("remove-book", book, function(data) {
                if (data.error) {
                    $scope.myCollection.status = "error";
                    $scope.myCollection.message = data.message;
                    $scope.$apply();
                } else {
                    $scope.listMyCollection();
                }
            });
        };
        // Initialization
        $scope.listAllBooks();
    }]);
}());