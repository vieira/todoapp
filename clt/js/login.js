var loginApp = angular.module('loginApp', []);

loginApp.controller('loginCtrl', function($scope, $http, $window) {
    $scope.state = "btn-primary";
    localStorage.removeItem("at");
    $scope.login = function(user) {
        $http({
            url: "/login",
            method: "POST",
            data: JSON.stringify({username: user.name, password: user.pass}),
            headers: {'Content-Type': 'application/json'}
        }).success(function(data, status, headers, config) {
            $scope.state = "btn-success";
            var at = { 'cmd': 'login-user', 'username': user.name, 
                       'token': data };
            at = JSON.stringify(at);
            localStorage.setItem("at", at);
            setTimeout(function() { $window.location.href="/"; }, 200);
        }).error(function(data, status, headers, config) {
            $scope.state = "btn-danger";
        });

    };
});
