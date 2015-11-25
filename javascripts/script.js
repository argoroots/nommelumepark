var entuAPI = 'https://nommelumepark.entu.ee/api2/'
var entuAPI3 = 'https://auth.entu.ee/'
var erplyAPI = 'https://nommelumepark.entu.ee/erply/'

var cl = function(data) {
    console.log(data)
}



// ENTU HELPERS
var entu = {}

entu.getUser = function(userId, userToken, http, callback) {
    http.get(entuAPI + 'user', {
            headers: {
                'X-Auth-UserId': userId,
                'X-Auth-Token': userToken
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
                callback(data)
            }
        })
        .error(function(error) {
            callback(error)
        })
}

entu.getEntities = function(params, userId, userToken, http, callback) {
    http.get(entuAPI + 'entity', {
            headers: {
                'X-Auth-UserId': userId,
                'X-Auth-Token': userToken
            },
            params: params
        })
        .success(function(data) {
            if(data.result !== []) {
                callback(null, data.result)
            } else {
                callback(data)
            }
        })
        .error(function(error) {
            callback(error)
        })
}

entu.getEntity = function(entityId, userId, userToken, http, callback) {
    http.get(entuAPI + 'entity-' + entityId, {
            headers: {
                'X-Auth-UserId': userId,
                'X-Auth-Token': userToken
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
                callback(data)
            }
        })
        .error(function(error) {
            callback(error)
        })
}

entu.getChilds = function(entityId, userId, userToken, http, callback) {
    http.get(entuAPI + 'entity-' + entityId +'/childs', {
            headers: {
                'X-Auth-UserId': userId,
                'X-Auth-Token': userToken
            }
        })
        .success(function(data) {
            if(data.result) {
                var entities = []
                for (var i in data.result) {
                    if(!data.result.hasOwnProperty(i)) { continue }
                    for (var n in data.result[i].entities) {
                        if(!data.result[i].entities.hasOwnProperty(n)) { continue }
                        entities.push(data.result[i].entities[n])
                    }
                }
                callback(null, entities)
            } else {
                callback(data)
            }
        })
        .error(function(error) {
            callback(error)
        })
}

entu.getErply = function(method, params, userId, userToken, http, callback) {
    http.get(erplyAPI + method, {
            headers: {
                'X-Auth-UserId': userId,
                'X-Auth-Token': userToken
            },
            params: params
        })
        .success(function(data) {
            if(data.records) {
                callback(null, data.records)
            } else {
                callback(data)
            }
        })
        .error(function(error) {
            callback(error)
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
                redirectTo: '/lendings/bron'
            })
    }])



// ANALYTICS
    // .run(['$rootScope', '$location', function($rootScope, $location) {
    //     $rootScope.$on('$routeChangeSuccess', function() {
    //         ga('send', 'pageview', {page: $location.path(), title: $location.path().substring(1).replace('/', ' - ')})
    //     })
    // }])



// START
    .controller('startCtrl', ['$rootScope', '$http', '$window', function($rootScope, $http, $window) {
        $rootScope.loading = true
        $rootScope.activeMenu = null
        $rootScope.entuUrl = entuAPI

        entu.getUser($window.sessionStorage.getItem('userId'), $window.sessionStorage.getItem('userToken'), $http, function(error, user) {
            if(error) {
                $rootScope.user = null
            } else {
                $rootScope.user = user
            }
            $rootScope.loading = false
        })
    }])



// LOGIN
    .controller('loginCtrl', ['$http', '$location', '$window', function($http, $location, $window) {
        var state = '1234567890abcdef'

        $window.sessionStorage.clear()
        $window.sessionStorage.setItem('state', state)

        $http.post(entuAPI + 'user/auth', {state: state, redirect_url: $location.protocol() + '://' + location.host + '/#/auth'})
            .success(function(data) {
                $window.sessionStorage.setItem('authUrl', data.result.auth_url)
                $window.location.href = data.result.auth_url
            })
            .error(function(data) {
                cl(data)
            })
    }])



// AUTH AFTER LOGIN
    .controller('authCtrl', ['$http', '$window', function($http, $window) {
        var authUrl = $window.sessionStorage.getItem('authUrl')
        var state = $window.sessionStorage.getItem('state')

        $http.post(authUrl, {state: state})
            .success(function(data) {
                $window.sessionStorage.clear()
                $window.sessionStorage.setItem('userId', data.result.user.id)
                $window.sessionStorage.setItem('userToken', data.result.user.session_key)
                $window.location.href = '/'
            })
            .error(function(data) {
                cl(data)
            })
    }])



// LOGOUT
    .controller('logoutCtrl', ['$rootScope', '$location', '$window', function($rootScope, $location, $window) {
        $window.sessionStorage.clear()
        $rootScope.user = null
        $window.location.href = entuAPI3 + 'exit?next=' + $location.protocol() + '://' + location.host
    }])



// LENDINGS
    .controller('lendingsCtrl', ['$scope', '$rootScope', '$http', '$routeParams', '$window', function($scope, $rootScope, $http, $routeParams, $window) {
        $rootScope.loading = true
        $rootScope.activeMenu = $routeParams.filter

        async.waterfall([
            function getUser(callback) {
                entu.getUser($window.sessionStorage.getItem('userId'), $window.sessionStorage.getItem('userToken'), $http, function(error, user) {
                    if(error) {
                        $rootScope.user = null
                        callback(error)
                    } else {
                        $rootScope.user = user
                        callback()
                    }
                })
            },
            function getLendings(callback) {
                entu.getEntities({ definition: 'laenutus' }, $rootScope.user.id, $rootScope.user.token, $http, callback)
            },
            function getEachLending(lendings, callback) {
                $scope.lendings = []
                async.each(lendings, function(lending) {
                    entu.getEntity(lending.id, $rootScope.user.id, $rootScope.user.token, $http, function(error, entity) {
                        if(error) {
                            callback(error)
                        } else {
                            entity.status = entity.properties.staatus.values ? entity.properties.staatus.values[0].db_value : 'archive'
                            if(!$routeParams.filter || $routeParams.filter === entity.status) {
                                $scope.lendings.push(entity)
                            }
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



//LENDING
    .controller('lendingCtrl', ['$scope', '$rootScope', '$http', '$routeParams', '$window', function($scope, $rootScope, $http, $routeParams, $window) {
        $rootScope.loading = true

        async.series([
            function getUser(callback) {
                entu.getUser($window.sessionStorage.getItem('userId'), $window.sessionStorage.getItem('userToken'), $http, function(error, user) {
                    if(error) {
                        $rootScope.user = null
                        callback(error)
                    } else {
                        $rootScope.user = user
                        callback()
                    }
                })
            },
            function getData(callback) {
                async.parallel([
                    function getLending(callback) {
                        entu.getEntity($routeParams.id, $rootScope.user.id, $rootScope.user.token, $http, function(error, entity) {
                            if(error) {
                                callback(error)
                            } else {
                                $scope.lending = entity
                                callback()
                            }
                        })
                    },
                    function getLendingRows(callback) {
                        async.waterfall([
                            function getChilds(callback) {
                                entu.getChilds($routeParams.id, $rootScope.user.id, $rootScope.user.token, $http, callback)
                            },
                            function getEntities(lendingChilds, callback) {
                                $scope.lendingRows = []
                                async.each(lendingChilds, function(value, callback) {
                                    entu.getEntity(value.id, $rootScope.user.id, $rootScope.user.token, $http, function(error, entity) {
                                        if(error) {
                                            callback(error)
                                        } else {
                                            $scope.lendingRows.push(entity)
                                            callback()
                                        }
                                    })
                                }, callback)
                            }
                        ], callback)
                    },
                    function getErplyCustomers(callback) {
                        entu.getErply('getCustomers', { recordsOnPage: 1000 }, $rootScope.user.id, $rootScope.user.token, $http, function(error, customers) {
                            if(error) {
                                callback(error)
                            } else {
                                $scope.customers = []
                                async.each(customers, function(item, callback) {
                                    $scope.customers.push({
                                        id: item.customerID,
                                        name: item.fullName.trim()
                                    })
                                    callback()
                                }, callback)
                            }
                        })
                    },
                    function getErplyPrices(callback) {
                        entu.getErply('getProducts', { groupID: 3, recordsOnPage: 1000 }, $rootScope.user.id, $rootScope.user.token, $http, function(error, customers) {
                            if(error) {
                                callback(error)
                            } else {
                                $scope.prices = []
                                async.each(customers, function(item, callback) {
                                    $scope.prices.push({
                                        id: item.productID,
                                        name: item.name.trim()
                                    })
                                    callback()
                                }, callback)
                            }
                        })
                    },
                ], callback)
            }
        ], function(error) {
            if(error) {
                cl(error)
            }
            $rootScope.loading = false
        })

        $scope.addErplyRow = function(value) {
            if(!value) {
                return
            }
            if(!$scope.erplyRows) {
                $scope.erplyRows = []
            }
            $scope.erplyRows.push(value)
            $scope.newErplyRow = ''
        }

    }])



// $http.get(erplyAPI + 'saveSalesDocument', {
//         headers: {
//             'X-Auth-UserId': $window.sessionStorage.getItem('userId'),
//             'X-Auth-Token': $window.sessionStorage.getItem('userToken')
//         },
//         params: {
//             type: 'CASHINVOICE',
//             pointOfSaleID: 2,
//             customerID: 496,
//             confirmInvoice: 0,
//             productID2: 20,
//             amount2: 1,
//             productID3: 21,
//             amount3: 1,
//         }
//     })
//     .success(function(data) {
//         cl(data)
//     })
