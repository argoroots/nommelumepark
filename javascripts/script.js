var entuAPI = 'https://nommelumepark.entu.ee/api2/'
var entuAPI3 = 'https://auth.entu.ee/'
var erplyAPI = 'https://nommelumepark.entu.ee/erply/'

var cl = function(data) {
    console.log(data)
}



// ENTU HELPERS
var entu = {}

entu.getUser = function(user_id, user_token, http, callback) {
    http.get(entuAPI + 'user', {
            headers: {
                'X-Auth-UserId': user_id,
                'X-Auth-Token': user_token
            }
        })
        .success(function(data) {
            if(data.result) {
                var user = {
                    id: data.result.id,
                    token: data.result.session_key,
                    name: data.result.name
                }

                callback(null, user)
            } else {
                callback(new Error('No user'))
            }
        })
        .error(function(error) {
            cl(error)
            callback(new Error('No user'))
        })
}

entu.getEntities = function(params, user_id, user_token, http, callback) {
    http.get(entuAPI + 'entity', {
            headers: {
                'X-Auth-UserId': user_id,
                'X-Auth-Token': user_token
            },
            params: params
        })
        .success(function(data) {
            if(data.result !== []) {
                callback(null, data.result)
            } else {
                callback(new Error('No entities'))
            }
        })
        .error(function(error) {
            cl(error)
            callback(new Error('No entities'))
        })
}


entu.getEntity = function(entity_id, user_id, user_token, http, callback) {
    http.get(entuAPI + 'entity-' + entity_id, {
            headers: {
                'X-Auth-UserId': user_id,
                'X-Auth-Token': user_token
            }
        })
        .success(function(data) {
            if(data.result) {
                var entity = {
                    id: data.result.id,
                    name: data.result.displayname,
                    info: data.result.displayinfo,
                    properties: data.result.properties
                }

                callback(null, entity)
            } else {
                callback(new Error('No entity #' + entity_id + ''))
            }
        })
        .error(function(error) {
            cl(error)
            callback(new Error('No entity #' + entity_id + ''))
        })
}





angular.module('lumeparkApp', ['ngRoute'])



//ROUTER
    .config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {
        $locationProvider.html5Mode(false)
        $routeProvider
            .when('/', {
                templateUrl: 'start',
                controller: 'startCtrl'
            })
            .when('/login', {
                templateUrl: 'start',
                controller: 'loginCtrl'
            })
            .when('/auth', {
                templateUrl: 'start',
                controller: 'authCtrl'
            })
            .when('/logout', {
                templateUrl: 'start',
                controller: 'logoutCtrl'
            })
            .when('/lendings/:filter', {
                templateUrl: 'lendings',
                controller: 'lendingsCtrl'
            })
            .when('/lending/:id', {
                templateUrl: 'lending',
                controller: 'lendingCtrl'
            })
            .otherwise({
                redirectTo: '/'
            })
    }])



// ANALYTICS
    .run(['$rootScope', '$location', function($rootScope, $location) {
        // $rootScope.$on('$routeChangeSuccess', function(){
        //     ga('send', 'pageview', {page: $location.path(), title: $location.path().substring(1).replace('/', ' - ')})
        // })
    }])



// START
    .controller('startCtrl', ['$rootScope', '$http', '$window', function($rootScope, $http, $window) {
        $rootScope.loading = true
        $rootScope.activeMenu = null
        $rootScope.entuUrl = entuAPI

        entu.getUser($window.sessionStorage.getItem('user_id'), $window.sessionStorage.getItem('user_token'), $http, function(error, user) {
            if(error) {
                $rootScope.user = null
            } else {
                $rootScope.user = user
            }
            $rootScope.loading = false
        })
    }])



// LOGIN
    .controller('loginCtrl', ['$http', '$location', '$window', function($http, $location, $window){
        var state = '1234567890abcdef'

        $window.sessionStorage.clear()
        $window.sessionStorage.setItem('state', state)

        $http.post(entuAPI + 'user/auth', {state: state, redirect_url: $location.protocol() + '://' + location.host + '/#/auth'})
            .success(function(data) {
                $window.sessionStorage.setItem('auth_url', data.result.auth_url)
                $window.location.href = data.result.auth_url
            })
            .error(function(data) {
                cl(data)
            })
    }])



// AUTH AFTER LOGIN
    .controller('authCtrl', ['$http', '$window', function($http, $window){
        var auth_url = $window.sessionStorage.getItem('auth_url')
        var state = $window.sessionStorage.getItem('state')

        $http.post(auth_url, {state: state})
            .success(function(data) {
                $window.sessionStorage.clear()
                $window.sessionStorage.setItem('user_id', data.result.user.id)
                $window.sessionStorage.setItem('user_token', data.result.user.session_key)
                $window.location.href = '/'
            })
            .error(function(data) {
                cl(data)
            })
    }])



// LOGOUT
    .controller('logoutCtrl', ['$rootScope', '$location', '$window', function($rootScope, $location, $window){
        $window.sessionStorage.clear()
        $rootScope.user = null
        $window.location.href = entuAPI3 + 'exit?next=' + $location.protocol() + '://' + location.host
    }])



// LENDINGS
    .controller('lendingsCtrl', ['$scope', '$rootScope', '$http', '$routeParams', '$window', function($scope, $rootScope, $http, $routeParams, $window){
        $rootScope.loading = true
        $rootScope.activeMenu = $routeParams.filter

        async.waterfall([
            function getUser(callback) {
                entu.getUser($window.sessionStorage.getItem('user_id'), $window.sessionStorage.getItem('user_token'), $http, function(error, user) {
                    if(error) {
                        $rootScope.user = null
                        callback(error)
                    } else {
                        $rootScope.user = user
                        callback(null, user)
                    }
                })
            },
            function getLendings(user, callback) {
                entu.getEntities({ definition: 'laenutus' }, user.id, user.token, $http, function(error, lendings) {
                    if(error) {
                        callback(error)
                    } else {
                        callback(null, lendings)
                    }
                })
            },
            function getEachLending(lendings, callback) {
                $scope.lendings = []
                async.each(lendings, function(lending) {
                    entu.getEntity(lending.id, $rootScope.user.id, $rootScope.user.token, $http, function(error, entity) {
                        if(error) {
                            callback(error)
                        } else {
                            entity.status = entity.properties.staatus.values ? entity.properties.staatus.values[0].db_value : 'archive'
                            if(!$routeParams.filter || $routeParams.filter === entity.status) $scope.lendings.push(entity)

                            callback()
                        }
                    })
                }, callback)
            }
        ], function(error) {
            if(error) {
                cl(error)
            }
            $rootScope.loading = false
        })
    }])
        })
    }])
