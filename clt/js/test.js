angular.module('formTest', [])
    .controller('TestCtrl', ['$scope', function($scope) {
        $scope.master = {};

        $scope.update = function(user) {
            $scope.master = anguler.copy(user);
        };

        $scope.reset = function() {
            $scope.user = angular.copy($scope.master);
        };

        $scope.reset();
    }])
    .directive('foobar', function() {
        return {
            require: 'ngModel',
            restrict: 'A',
            link: function(scope, elm, attrs, ctrl) {
                ctrl.$parsers.push(function(viewValue) {
                    if (viewValue % 2 == 0) {
                        ctrl.$setValidity('foobar', true);
                        return viewValue;
                    } else {
                        ctrl.$setValidity('foobar', false);
                        return undefined;
                    }
                });
            }
        };
    });
