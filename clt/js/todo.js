var todoApp = angular.module('todoApp', []);

todoApp.factory("ws", function($rootScope, $window) {
    if (localStorage.getItem("at") === null) {
        $window.location.href="/login.html";
        return;
    }
 
    var ws = new WebSocket("ws://vieira.yubo.be");
    var mq = JSON.parse(localStorage.getItem('mq'));
    if (!mq) mq = [];
    return { 
        onmessage: function(callback) {
            ws.onmessage = function(e) {
                callback(JSON.parse(e.data));
            }
        }, 
        send: function(cmd) {
            if (ws.readyState == ws.OPEN) {
                ws.send(JSON.stringify(cmd));
            } else {
                mq.push(JSON.stringify(cmd));
                localStorage.setItem('mq', JSON.stringify(mq));
            }
        },
        onopen: function(callbefore, callafter) {
            ws.onopen = function() {
                callbefore(function() {
                    while ((cmd = mq.shift())) {
                        ws.send(cmd);
                    }
                    localStorage.setItem('mq', JSON.stringify(mq));
                    callafter();
                });
            }
        },
        onclose: function(callback) {
            ws.onclose = function() {
                var onopen = ws.onopen;
                var onclose = ws.onclose;
                var onmessage = ws.onmessage;
                if (navigator.onLine) { // we are connected to some network
                    setTimeout(function() {
                        ws = new WebSocket(ws.url);
                        ws.onopen = onopen;
                        ws.onclose = onclose;
                        ws.onmessage = onmessage;
                    }, 15000);
                } else { // try reconnecting when some network is available
                    window.addEventListener("online", function(e) {
                        ws = new WebSocket(ws.url);
                        ws.onopen = onopen;
                        ws.onclose = onclose;
                        ws.onmessage = onmessage;
                    });
                }
                callback();
            }
        }
    };
});

todoApp.factory("ls", function() {
    function Lists() {
        properties = JSON.parse(localStorage.getItem("ls"));

        for (var property in properties) {
            this[property] = properties[property];
        }

        Lists.prototype.save = function() {
            //console.log(JSON.stringify(this));
            localStorage.setItem("ls", JSON.stringify(this));
        }
    }
    return new Lists();
});


todoApp.config(['$routeProvider',
        function($routeProvider) {
            $routeProvider.when('/:listName', {
                templateUrl: 'items.html'
                //controller: 'todoListCtrl'
            }).when('/:listName/share', {
                templateUrl: 'share.html' 
                //controller: 'todoListCtrl'
            }).otherwise({
                templateUrl: 'lists.html'
                //controller: 'todoListCtrl'
            });
}]);

todoApp.controller('todoListCtrl', 
        function($scope, $http, $routeParams, $location, ws, ls) {
    $scope.lists = ls;
    $scope.state = {}
    $scope.state.cls = "btn-default";
    $scope.state.msg = "connecting";

    var changeState = function(online) {
        if (online) {
            $scope.state.cls = "btn-success";
            $scope.state.msg = "online";
        } else {
            $scope.state.cls = "btn-danger";
            $scope.state.msg = "offline";
        }
        $scope.$digest();
    }

    ws.onopen(
        function(next) {
            var at = localStorage.getItem("at");
            changeState(true);
            ws.send(JSON.parse(at));
            next();
        },
        function() {
            ws.send({'cmd': 'get-list'});
        });

    ws.onmessage(function(lists) {
        for (var list in ls) delete ls[list]; // clear without changing ref
        for (var list in lists) {
            ls[list] = lists[list];
            ls[list].name = list;
        }
        $scope.$digest();
    });

    ws.onclose(function() {
        changeState(false);
    });

    window.addEventListener("online", function(e) {
        changeState(true);
    });

    window.addEventListener("offline", function(e) {
        changeState(false);
    });

    $scope.$watch('lists', function(newValue, oldValue) {
        if (newValue !== oldValue) {
            ls.save();
        }
    }, true);

    $scope.removeList = function(list) {
        ws.send({'cmd': 'remove-list', 'name': list.name});
        delete ls[list.name];
    };

    $scope.addList = function(list) {
        ws.send({'cmd': 'add-list', 'name': list.name});
        list['items'] = [];
        ls[list.name] = angular.copy(list);
        list.name = "";
    };

    $scope.getItems = function() {
        return ls[$routeParams.listName].items;
    }

    $scope.addItem = function(item) {
        listName = $routeParams.listName;
        ws.send({'cmd': 'add-item', 'name': listName, 'item': item.name});
        ls[listName].items.unshift(item.name);
        item.name = "";
    };

    $scope.removeItem = function(item) {
        listName = $routeParams.listName;
        ws.send({'cmd': 'remove-item', 'name': listName, 'item': item});
        ls[listName].items.splice(ls[listName].items.indexOf(item), 1);
    };

    $scope.shareList = function(user) {
        listName = $routeParams.listName;
        ws.send({'cmd': 'share-list', 'name': listName, 'username': user.name});
        $location.path("/"+listName);
    }
});
