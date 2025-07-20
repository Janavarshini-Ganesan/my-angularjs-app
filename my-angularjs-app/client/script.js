// script.js

angular.module('myApp')
.controller('HomeController', ['$scope', '$http', function($scope, $http) {
    $scope.message = "Welcome to the Tuition Management System!";
    $scope.search = {};
    $scope.userTuitions = [];

    $scope.fetchUserTuitions = function() {
        const tuitionName = ''; // Update this if needed
        $http.get(`/userTuitions?tuitionName=${tuitionName}`)
            .then(response => {
                $scope.userTuitions = response.data;
            })
            .catch(error => {
                console.error('Error fetching user tuitions:', error);
            });
    };

    $scope.fetchUserTuitions();

    $scope.submitSearch = function() {
        // Search logic if needed
    };
}]);
