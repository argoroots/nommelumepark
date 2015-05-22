function cl(data) {
    console.log(data)
}

var entuAPI = 'https://nommelumepark.entu.ee/api2/'
var erplyAPI = 'https://nommelumepark.entu.ee/erply/'

angular.module('lumeparkApp', ['ionic', 'ngResource'])
    .config(['$stateProvider', '$urlRouterProvider', '$compileProvider', function($stateProvider, $urlRouterProvider, $compileProvider) {
        $stateProvider
            .state('eventmenu', {
                url: '',
                abstract: true,
                templateUrl: 'menu'
            })
            .state('eventmenu.home', {
                url: '/',
                views: {
                    'menuContent' :{
                        templateUrl: 'home'
                    }
                }
            })
            .state('eventmenu.lend', {
                url: '/list/:filter',
                views: {
                    'menuContent' :{
                        templateUrl: 'list',
                        controller: 'listCtrl'
                    }
                }
            })
            .state('eventmenu.login', {
                url: '/login',
                views: {
                    'menuContent' :{
                        templateUrl: 'list',
                        controller: 'loginCtrl'
                    }
                }
            })
            .state('eventmenu.auth', {
                url: '/auth',
                views: {
                    'menuContent' :{
                        templateUrl: 'list',
                        controller: 'authCtrl'
                    }
                }
            })
            .state('eventmenu.item', {
                url: '/item/:id',
                views: {
                    'menuContent' :{
                        templateUrl: 'item',
                        controller: 'itemCtrl'
                    }
                }
            })
        $urlRouterProvider.otherwise('/')
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|javascript|p2spro):/)
        // Angular before v1.2 uses $compileProvider.urlSanitizationWhitelist(...)

    }])

    .service('preferences', ['$window', function($window) {
        try {
            var p = this
            if($window.localStorage.getItem('preferences')) {
                p.preferences = angular.fromJson($window.localStorage.getItem('preferences'))
            } else {
                p.preferences = {}
            }
        } catch(err) {
            $window.localStorage.clear()
            $window.location.reload()
        }
    }])

    .controller('mainCtrl', ['preferences', '$scope', '$http', '$ionicSideMenuDelegate', '$window', function(preferences, $scope, $http, $ionicSideMenuDelegate, $window) {
        $scope.entu_url = entuAPI
        $scope.preferences = preferences.preferences

        $http.get(entuAPI + 'user', {headers: {
                'X-Auth-UserId': $window.sessionStorage.getItem('user_id'),
                'X-Auth-Token': $window.sessionStorage.getItem('token')
            }})
            .success(function(data) {
                $scope.user = data.result
            })
            .error(function(data) {
                $scope.user = null
            })

        $scope.toggleLeft = function() {
            $ionicSideMenuDelegate.toggleLeft()
        }

        $scope.preferencesReset = function() {
            $window.localStorage.clear()
            $window.location.reload()
        }

        $scope.$watch('preferences.p2sMode', function() {
            if($scope.preferences) $window.localStorage.setItem('preferences', angular.toJson($scope.preferences))
        }, true)
    }])

    .controller('loginCtrl', ['preferences', '$scope', '$http', '$stateParams', '$location', '$window', function(preferences, $scope, $http, $stateParams, $location, $window){
        var state = '1234567890abcdef'

        $window.sessionStorage.clear()
        $window.sessionStorage.setItem('state', state)

        $http.post(entuAPI + 'user/auth', {state: state, redirect_url: $location.protocol() + '://' + location.host + '/#/auth'})
            .success(function(data) {
                $window.sessionStorage.setItem('auth_url', data.auth_url)
                $window.location.href = data.auth_url
            })
            .error(function(data) {
                cl(data)
            })
    }])

    .controller('authCtrl', ['preferences', '$scope', '$http', '$stateParams', '$location', '$window', function(preferences, $scope, $http, $stateParams, $location, $window){
        var auth_url = $window.sessionStorage.getItem('auth_url')
        var state = $window.sessionStorage.getItem('state')

        $http.post(auth_url, {state: state})
            .success(function(data) {
                $window.sessionStorage.setItem('user_id', data.result.user.id)
                $window.sessionStorage.setItem('token', data.result.user.session_key)
                $window.location.href = '/'
            })
            .error(function(data) {
                cl(data)
            })
    }])

    .controller('listCtrl', ['preferences', '$scope', '$http', '$stateParams', '$timeout', '$window', function(preferences, $scope, $http, $stateParams, $timeout, $window){
        $scope.entu_url = entuAPI
        $scope.page = 0
        $scope.preferences = preferences.preferences

        $scope.loadEntities = function(reload) {
            if(!$scope.entities || reload === true) $scope.entities = {
                limit: 20,
                page: 0,
                toLoad: 0,
                noMore: false,
                result: []
            }

            if($scope.entities.loading === true) return
            $scope.entities.loading = true

            if(!$stateParams.filter) {
                $scope.entities.title = 'Kõik'
            } else if($stateParams.filter === 'bron') {
                $scope.entities.title = 'Broneeringud'
            } else if($stateParams.filter === 'out') {
                $scope.entities.title = 'Rendis'
            } else if($stateParams.filter === 'archive') {
                $scope.entities.title = 'Tagasi'
            } else {
                $scope.entities.title = $stateParams.filter
            }

            ++$scope.entities.page
            $http.get(entuAPI + 'entity', {
                    headers: {
                        'X-Auth-UserId': $window.sessionStorage.getItem('user_id'),
                        'X-Auth-Token': $window.sessionStorage.getItem('token')
                    },
                    params: {
                        definition: 'laenutus',
                        limit: $scope.entities.limit,
                        page: $scope.entities.page
                    }
                })
                .success(function(data) {
                    var len = data.result.length
                    $scope.entities.toLoad += len
                    if(len < $scope.entities.limit) $scope.entities.noMore = true

                    data.result.forEach(function(value, key) {
                        $http.get(entuAPI + 'entity-' + value.id, {
                                headers: {
                                    'X-Auth-UserId': $window.sessionStorage.getItem('user_id'),
                                    'X-Auth-Token': $window.sessionStorage.getItem('token')
                                }
                            })
                            .success(function(data) {
                                var i = {}
                                i.id = data.result.id
                                i.name = data.result.displayname
                                i.info = data.result.displayinfo
                                i.status = (data.result.properties.staatus.values ? data.result.properties.staatus.values[0].db_value : 'archive')
                                if(!$stateParams.filter || $stateParams.filter === i.status) $scope.entities.result.push(i)
                            })
                            .error(function(data2) {
                                cl(data)
                            })
                            .finally(function() {
                                --$scope.entities.toLoad
                                $scope.endLoading()
                            })
                    })
                })
                .error(function(data2) {
                    cl(data)
                })
                .finally(function() {
                    $scope.endLoading()
                })

        }
        $scope.loadEntities(true)


        $scope.endLoading = function() {
            if($scope.entities.toLoad === 0) {
                $scope.entities.loading = false
                $scope.$broadcast('scroll.refreshComplete')
                $scope.$broadcast('scroll.infiniteScrollComplete')
            }
        }

        $scope.scanCode = function(code) {
            // if(code === 'CANCELLED') return
            alert(code)
        }

        // var timer = false
        // $scope.searchEntities = function() {
        //     if(timer) $timeout.cancel(timer)
        //     timer = $timeout(function() {
        //         $scope.entities (entuAPI, {action: 'entity', definition: 'laenutus', limit:20, query:$scope.query}).get()
        //     }, 1000)
        // }
    }])

    .controller('itemCtrl', ['$scope', '$http', '$resource', '$stateParams', '$window', function($scope, $http, $resource, $stateParams, $window){
        $scope.entities = {
            result: [],
            customers: [],
            prices: []
        }

        $http.get(erplyAPI + 'getCustomers', {
                headers: {
                    'X-Auth-UserId': $window.sessionStorage.getItem('user_id'),
                    'X-Auth-Token': $window.sessionStorage.getItem('token')
                },
                params: {
                    recordsOnPage: 1000
                }
            })
            .success(function(data) {
                cl(data)
                data.records.forEach(function(value, key) {
                    $scope.entities.customers.push({id: value.customerID, name: value.fullName.trim()})
                })
            })
            .error(function(data2) {
                cl(data)
            })
            .finally(function() {

            })

        $http.get(erplyAPI + 'getProducts', {
                headers: {
                    'X-Auth-UserId': $window.sessionStorage.getItem('user_id'),
                    'X-Auth-Token': $window.sessionStorage.getItem('token')
                },
                params: {
                    groupID: 3,
                    recordsOnPage: 1000
                }
            })
            .success(function(data) {
                cl(data)
                data.records.forEach(function(value, key) {
                    $scope.entities.prices.push({id: value.productID, name: value.name.trim()})
                })
            })
            .error(function(data2) {
                cl(data)
            })
            .finally(function() {

            })

        $http.get(entuAPI + 'entity-' + $stateParams.id, {
                headers: {
                    'X-Auth-UserId': $window.sessionStorage.getItem('user_id'),
                    'X-Auth-Token': $window.sessionStorage.getItem('token')
                }
            })
            .success(function(data) {
                cl(data)
                $scope.entities.title = data.result.displayname
                // $scope.entities = data.result.properties.staatus.values[0].db_value
            })
            .error(function(data2) {
                cl(data)
            })
            .finally(function() {
                $scope.endLoading()
            })

        $http.get(entuAPI + 'entity-' + $stateParams.id+'/childs', {
                headers: {
                    'X-Auth-UserId': $window.sessionStorage.getItem('user_id'),
                    'X-Auth-Token': $window.sessionStorage.getItem('token')
                }
            })
            .success(function(data) {
                data.result['laenutuse-rida'].entities.forEach(function(value, key) {
                    $scope.entities.result.push({
                        id: value.id,
                        name: value.name,
                        info: value.info
                    })
                })
            })
            .error(function(data2) {
                cl(data)
            })
            .finally(function() {
                $scope.endLoading()
            })



        $scope.scanCode = function(code) {
            // if(code === 'CANCELLED') return
            if(!code) code = prompt("Sisesta triipkood või inventarinumber")
            if(!code) return

            $http.get(entuAPI + 'entity', {
                    headers: {
                        'X-Auth-UserId': $window.sessionStorage.getItem('user_id'),
                        'X-Auth-Token': $window.sessionStorage.getItem('token')
                    },
                    params: {
                        query: code,
                        definition: 'varustus',
                        limit: 1
                    }
                })
                .success(function(data) {
                    cl(data)
                    $scope.entities.result.push({
                        id: data.result[0].id,
                        name: data.result[0].name,
                        info: null
                    })
                })
                .error(function(data2) {
                    cl(data)
                })
                .finally(function() {
                    $scope.endLoading()
                })



        }

        // $scope.loadEntity = function() {
        //     $http({method: 'GET', url: entuAPI + 'entity-' + $stateParams.entity}).success(function(data) {
        //         $scope.entity = data
        //         $scope.$broadcast('scroll.refreshComplete')
        //     })
        //     $scope.childs = $resource(entuAPI + 'entity-' + $stateParams.entity+'/childs').get()
        //     $scope.referrers = $resource(entuAPI + 'entity-' + $stateParams.entity+'/referrals').get()
        // }
        // $scope.loadEntity()
    }])
