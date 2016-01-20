var cl = function(data) {
    console.log(data)
}



var parseDate = function(time) {
    var d = Date.parse(time)
    if(d) {
        return d.toString('yyyy-MM-dd HH:mm')
    } else {
        return ''
    }
}



var getReturnTime = function(out, length, back) {
    if(!length) { return }

    var endTimePromise
    var endTimeReal
    var result = {}

    var outDt = out ? Date.parse(out.db_value) : Date.parse('now')
    if(length.db_value === '1h') {
        endTimePromise = outDt.addHours(1)
    } else if(length.db_value === '3h') {
        endTimePromise = outDt.addHours(3)
    } else if(length.db_value === 'päev') {
        endTimePromise = outDt.addDays(1).clearTime()
    }

    var endTimeReal = back ? Date.parse(back.db_value) : Date.parse('now')

    if(endTimePromise >= endTimeReal) {
        result.diff = (new Date(endTimePromise - endTimeReal)).addMinutes(Date.parse('now').getTimezoneOffset()).toString('HH:mm')
        result.sign = '-'
    } else {
        result.diff = (new Date(endTimeReal - endTimePromise)).addMinutes(Date.parse('now').getTimezoneOffset()).toString('HH:mm')
        result.sign = '+'
    }

    return result
}



angular.module('lumeparkApp', ['ngRoute'])



//ROUTER
    .config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {
        $locationProvider.html5Mode(false)
        $routeProvider
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



// SPINNER
    .directive('isLoading', ['$http', function($http) {
        return {
            restrict: 'A',
            link: function(scope, elm) {
                scope.isLoading = function() {
                    return $http.pendingRequests.length > 0
                }
                scope.$watch(scope.isLoading, function(v) {
                    if(v) {
                        if(elm[0].nodeName === 'IMG') { elm.show() }
                        if(elm[0].nodeName === 'INPUT' || elm[0].nodeName === 'SELECT') { elm.attr('readonly', 'readonly') }
                    } else {
                        if(elm[0].nodeName === 'IMG') { elm.hide() }
                        if(elm[0].nodeName === 'INPUT' || elm[0].nodeName === 'SELECT') { elm.attr('readonly', null) }
                    }
                })
            }
        }
    }])



// GOOGLE ANALYTICS
    .run(['$rootScope', '$location', function($rootScope, $location) {
        $rootScope.$on('$routeChangeSuccess', function() {
            window.Intercom('update')

            ga('send', 'pageview', {
                page: $location.path(),
                title: $location.path().substring(1).replace('/', ' - ')
            })
        })
    }])



// SET PATH WITHOUT RELOADING
    .run(['$route', '$rootScope', '$location', function ($route, $rootScope, $location) {
        var original = $location.path
        $location.path = function (path, reload) {
            if(reload === false) {
                var lastRoute = $route.current
                var un = $rootScope.$on('$locationChangeSuccess', function () {
                    $route.current = lastRoute
                    un()
                })
            }
            return original.apply($location, [path])
        }
    }])



// START
    .controller('startCtrl', ['$rootScope', '$http', '$window', function($rootScope, $http, $window) {
        if(!$rootScope.rData) { $rootScope.rData = {} }

        $rootScope.rData.pageTitle = null
        $rootScope.rData.activeMenu = null

        entu.getUser($window.sessionStorage.getItem('userId'), $window.sessionStorage.getItem('userToken'), $http, function(error, user) {
            if(error) {
                $rootScope.rData.user = null
            } else {
                $rootScope.rData.user = user
            }
        })
    }])



// LOGIN
    .controller('loginCtrl', ['$http', '$location', '$window', function($http, $location, $window) {
        var state = '1234567890abcdef'

        $window.sessionStorage.clear()
        $window.sessionStorage.setItem('state', state)

        entu.getAuthUrl(state, $location.protocol() + '://' + location.host + '/#/auth', $http, function(error, data) {
            if(error) { return cl(error) }
            if(!data.auth_url) { return cl(data) }

            $window.sessionStorage.setItem('authUrl', data.auth_url)
            $window.location.href = data.auth_url
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

                window.Intercom('boot', {
                    app_id: 'a8si2rq4',
                    name: data.result.user.name,
                    email: data.result.user.email,
                    created_at: new Date().getTime()
                })

                $window.location.href = '/'
            })
            .error(function(error) {
                cl(error)
            })
    }])



// LOGOUT
    .controller('logoutCtrl', ['$rootScope', '$location', '$window', function($rootScope, $location, $window) {
        $rootScope.rData = {}

        $window.sessionStorage.clear()
        $window.location.href = 'https://auth.entu.ee/exit?next=' + $location.protocol() + '://' + location.host
    }])



// LENDINGS
    .controller('lendingsCtrl', ['$scope', '$rootScope', '$http', '$routeParams', '$window', '$interval', function($scope, $rootScope, $http, $routeParams, $window, $interval) {
        if(!$rootScope.rData) { $rootScope.rData = {} }
        if($rootScope.rData.calculateReturnTimeInterval) { $interval.cancel($rootScope.rData.calculateReturnTimeInterval) }

        $rootScope.rData.activeMenu = $routeParams.filter
        if($routeParams.filter === 'bron') { $rootScope.rData.pageTitle = 'Broneeringud' }
        if($routeParams.filter === 'bron') { $rootScope.rData.pageTitle = 'Rendis' }
        if($routeParams.filter === 'archive') { $rootScope.rData.pageTitle = 'Arhiiv' }

        $scope.sData = {
            lendings: []
        }

        async.waterfall([
            function getUser(callback) {
                entu.getUser($window.sessionStorage.getItem('userId'), $window.sessionStorage.getItem('userToken'), $http, function(error, user) {
                    if(error) {
                        $rootScope.rData.user = null
                        callback(error)
                    } else {
                        $rootScope.rData.user = user
                        callback(null)
                    }
                })
            },
            function getLendings(callback) {
                entu.getEntities({ definition: 'laenutus' }, $rootScope.rData.user.id, $rootScope.rData.user.token, $http, callback)
            },
            function getEachLending(lendings, callback) {
                $scope.sData.lendings = []
                async.each(lendings, function(lending) {
                    entu.getEntity(lending.id, $rootScope.rData.user.id, $rootScope.rData.user.token, $http, function(error, entity) {
                        if(error) { return callback(error) }

                        entity.status = entity.staatus ? entity.staatus.db_value : 'archive'
                        if(!$routeParams.filter || $routeParams.filter === entity.status) {
                            $scope.sData.lendings.push(entity)
                        }
                        callback(null)
                    })
                }, callback)
            }
        ], function(error) {
            if(error) { cl(error) }
        })
    }])



//LENDING
    .controller('lendingCtrl', ['$scope', '$rootScope', '$http', '$routeParams', '$location', '$window', '$interval', function($scope, $rootScope, $http, $routeParams, $location, $window, $interval) {
        if(!$rootScope.rData) { $rootScope.rData = {} }
        if($rootScope.rData.calculateReturnTimeInterval) { $interval.cancel($rootScope.rData.calculateReturnTimeInterval) }

        $rootScope.rData.activeMenu = $routeParams.id
        $rootScope.rData.pageTitle = $routeParams.id === 'new' ? 'Uus' : '#' + $routeParams.id

        $scope.sData = {
            lending: {},
            oldLending: {},
            customers: [],
            prices: [],
            lendingRows: [],
            invoiceRows: [],
            paymentTypes: [],
            paymentType: 'CASH',
            addLendingRowQuery: '',
            lendingEndHours: {}
        }

        var lendingId = parseInt($routeParams.id, 10)

        async.series([
            function getUser(callback) {
                entu.getUser($window.sessionStorage.getItem('userId'), $window.sessionStorage.getItem('userToken'), $http, function(error, user) {
                    if(error) {
                        $rootScope.rData.user = null
                        callback(error)
                    } else {
                        $rootScope.rData.user = user
                        callback(null)
                    }
                })
            },
            function getLending(callback) {
                if(!lendingId) { return callback(null) }

                entu.getEntity(lendingId, $rootScope.rData.user.id, $rootScope.rData.user.token, $http, function(error, entity) {
                    if(error) { return callback(error) }

                    $rootScope.rData.pageTitle = $routeParams.id === 'new' ? 'Uus' : '#' + entity._id

                    if(entity.staatus) {
                        $scope.sData.isBron = entity.staatus.db_value === 'bron'
                        $scope.sData.isOut = entity.staatus.db_value === 'out'
                        $scope.sData.isArchived = entity.staatus.db_value === 'archive'
                        $rootScope.rData.activeMenu = entity.staatus.db_value
                    }

                    $scope.sData.lending = entity

                    for (var i in $scope.sData.lending) {
                        if(!$scope.sData.lending.hasOwnProperty(i)) { continue }
                        if(!$scope.sData.lending[i].db_value) { continue }

                        $scope.sData.oldLending[i] = $scope.sData.lending[i].db_value
                    }

                    callback(null)
                })
            },
            function calculateDates(callback) {
                $scope.calculateDates(callback)
            },
            function getOtherData(callback) {
                async.parallel([
                    function getLendingRows(callback) {
                        if(!lendingId) { return callback(null) }

                        async.waterfall([
                            function getChilds(callback) {
                                entu.getChilds(lendingId, $rootScope.rData.user.id, $rootScope.rData.user.token, $http, callback)
                            },
                            function getEntities(lendingChilds, callback) {
                                $scope.sData.lendingRows = []
                                async.each(lendingChilds, function(value, callback) {
                                    entu.getEntity(value.id, $rootScope.rData.user.id, $rootScope.rData.user.token, $http, function(error, entity) {
                                        if(error) { return callback(error) }

                                        $scope.sData.lendingRows.push(entity)
                                        callback(null)
                                    })
                                }, callback)
                            }
                        ], function(error) {
                            if(error) { callback(error) }

                            $scope.calculateReturnTime()
                            $rootScope.rData.calculateReturnTimeInterval = $interval($scope.calculateReturnTime, 10000)
                            callback(null)
                        })
                    },
                    function getErplyInvoice(callback) {
                        if(!$scope.sData.lending.erply) { return callback(null) }
                        entu.getErply('getSalesDocuments', { id: $scope.sData.lending.erply.db_value }, $rootScope.rData.user.id, $rootScope.rData.user.token, $http, function(error, invoice) {
                            if(error) { return callback(error) }

                            if(!invoice) { return callback(null) }
                            if(invoice.length === 0) { return callback(null) }

                            if(invoice[0].paymentType) {
                                $scope.sData.paymentType = invoice[0].paymentType
                            }
                            if(invoice[0].rows) {
                                for (var i in invoice[0].rows) {
                                    if(!invoice[0].rows.hasOwnProperty(i)) { continue }
                                    $scope.sData.invoiceRows.push({
                                        id: invoice[0].rows[i].productID,
                                        name: invoice[0].rows[i].itemName,
                                        price: parseFloat(invoice[0].rows[i].price),
                                        quantity: parseInt(invoice[0].rows[i].amount, 10)
                                    })
                                }
                            }
                        })
                    },
                    function getErplyCustomers(callback) {
                        entu.getErply('getCustomers', {}, $rootScope.rData.user.id, $rootScope.rData.user.token, $http, function(error, customers) {
                            if(error) { return callback(error) }

                            $scope.sData.customers = []
                            async.each(customers, function(item, callback) {
                                $scope.sData.customers.push({
                                    id: item.customerID,
                                    name: item.fullName.trim()
                                })
                                callback(null)
                            }, callback)
                        })
                    },
                    function getErplyPrices(callback) {
                        entu.getErply('getProducts', { groupID: 3 }, $rootScope.rData.user.id, $rootScope.rData.user.token, $http, function(error, customers) {
                            if(error) { return callback(error) }

                            $scope.sData.prices = []
                            async.each(customers, function(item, callback) {
                                $scope.sData.prices.push({
                                    id: item.productID,
                                    name: item.name.trim(),
                                    price: item.priceWithVat,
                                    quantity: 1
                                })
                                callback(null)
                            }, callback)
                        })
                    },
                    function getErplyPaymentTypes(callback) {
                        entu.getErply('getInvoicePaymentTypes', { groupID: 3 }, $rootScope.rData.user.id, $rootScope.rData.user.token, $http, function(error, types) {
                            if(error) { return callback(error) }

                            $scope.sData.paymentTypes = []
                            for (var i in types) {
                                if (!types.hasOwnProperty(i)) { continue }
                                $scope.sData.paymentTypes.push({
                                    id: types[i].type,
                                    name: types[i].name
                                })
                            }
                        })
                    },
                ], callback)
            },
        ], function(error) {
            if(error) { cl(error) }
        })



        $scope.calculateDates = function(callback) {
            if($scope.sData.lending.algus) {
                $scope.sData.lending.algus.db_value = $scope.sData.lending.algus.db_value.substring(0, 16)
                $scope.sData.lendingEndHours = {
                    one: Date.parse($scope.sData.lending.algus.db_value).addHours(1).toString('HH:mm'),
                    three: Date.parse($scope.sData.lending.algus.db_value).addHours(3).toString('HH:mm')
                }
            } else {
                $scope.sData.lendingEndHours = {}
            }

            callback(null)
        }



        $scope.calculateReturnTime = function() {
            for (var i in $scope.sData.lendingRows) {
                if(!$scope.sData.lendingRows.hasOwnProperty(i)) { continue }

                $scope.sData.lendingRows[i].returnTime = getReturnTime($scope.sData.lendingRows[i].algus, $scope.sData.lendingRows[i].kestvus, $scope.sData.lendingRows[i].l6pp)
            }
        }



        $scope.changeLending = function(property) {
            if(!$scope.sData.lending[property]) { return }
            if($scope.sData.oldLending[property] && $scope.sData.lending[property].db_value === $scope.sData.oldLending[property]) { return }

            var lendingId = $scope.sData.lending._id
            var lendingRowIds = []

            if(property === 'algus') { $scope.sData.lending[property].db_value = parseDate($scope.sData.lending[property].db_value) }

            async.series([
                function getUser(callback) {
                    entu.getUser($window.sessionStorage.getItem('userId'), $window.sessionStorage.getItem('userToken'), $http, function(error, user) {
                        if(error) {
                            $rootScope.rData.user = null
                            callback(error)
                        } else {
                            $rootScope.rData.user = user
                            callback(null)
                        }
                    })
                },
                function addLendingEntity(callback) {
                    if(lendingId) { return callback(null) }

                    var lendingData = {
                        definition: 'laenutus',
                        'laenutus-staatus': 'bron'
                    }

                    entu.addEntity(614, lendingData, $rootScope.rData.user.id, $rootScope.rData.user.token, $http, function(error, newEntity) {
                        lendingId = newEntity.id
                        $location.path('/lending/' + lendingId, false)
                        callback(null)
                    })
                },
                function changeLendingEntity(callback) {
                    var lendingData = {}
                    if($scope.sData.lending[property].id) {
                        lendingData['laenutus-' + property + '.' + $scope.sData.lending[property].id] = $scope.sData.lending[property].db_value
                    } else {
                        lendingData['laenutus-' + property] = $scope.sData.lending[property].db_value
                    }
                    entu.changeEntity(lendingId, lendingData, $rootScope.rData.user.id, $rootScope.rData.user.token, $http, callback)
                },
                function getLending(callback) {
                    entu.getEntity(lendingId, $rootScope.rData.user.id, $rootScope.rData.user.token, $http, function(error, entity) {
                        if(error) { return callback(error) }

                        $rootScope.rData.activeMenu = null
                        $rootScope.rData.pageTitle = '#' + entity._id

                        $scope.sData.lending = entity
                        for (var i in $scope.sData.lending) {
                            if(!$scope.sData.lending.hasOwnProperty(i)) { continue }
                            if(!$scope.sData.lending[i].db_value) { continue }
                            $scope.sData.oldLending[i] = $scope.sData.lending[i].db_value
                        }
                        callback(null)
                    })
                },
                function calculateDates(callback) {
                    $scope.calculateDates(callback)
                },
                function changeLendingRowEntities(callback) {
                    if(property !== 'algus' && property !== 'kestvus') { return callback(null) }

                    async.each($scope.sData.lendingRows, function(row, callback) {
                        lendingRowIds.push(row._id)

                        var lendingRow = {}

                        if(row.bronnialgus) {
                            lendingRow['laenutuse-rida-bronnialgus.' + row.bronnialgus.id] = $scope.sData.lending.algus ? $scope.sData.lending.algus.db_value : ''
                        } else {
                            lendingRow['laenutuse-rida-bronnialgus'] = $scope.sData.lending.algus ? $scope.sData.lending.algus.db_value : ''
                        }
                        if(row.kestvus) {
                            lendingRow['laenutuse-rida-kestvus.' + row.kestvus.id] = $scope.sData.lending.kestvus ? $scope.sData.lending.kestvus.db_value : ''
                        } else {
                            lendingRow['laenutuse-rida-kestvus'] = $scope.sData.lending.kestvus ? $scope.sData.lending.kestvus.db_value : ''
                        }

                        entu.changeEntity(row._id, lendingRow, $rootScope.rData.user.id, $rootScope.rData.user.token, $http, callback)
                    }, callback)
                },
                function getLendingRows(callback) {
                    if(property !== 'algus' && property !== 'kestvus') { return callback(null) }

                    $scope.sData.lendingRows = []

                    async.each(lendingRowIds, function(id, callback) {
                        entu.getEntity(id, $rootScope.rData.user.id, $rootScope.rData.user.token, $http, function(error, entity) {
                            if(error) { return callback(error) }

                            $scope.sData.lendingRows.push(entity)
                            callback(null)
                        })
                    }, function(error) {
                        if(error) { callback(error) }

                        $scope.calculateReturnTime()
                        callback(null)
                    })
                },
            ], function(error) {
                if(error) { cl(error) }
            })
        }



        $scope.searchLendingRowItem = function(keyEvent) {
            if(keyEvent.which !== 13) { return }

            async.waterfall([
                function getUser(callback) {
                    entu.getUser($window.sessionStorage.getItem('userId'), $window.sessionStorage.getItem('userToken'), $http, function(error, user) {
                        if(error) {
                            $rootScope.rData.user = null
                            callback(error)
                        } else {
                            $rootScope.rData.user = user
                            callback(null)
                        }
                    })
                },
                function getItems(callback) {
                    entu.getEntities({ definition: 'varustus', query: $scope.sData.addLendingRowQuery }, $rootScope.rData.user.id, $rootScope.rData.user.token, $http, callback)
                },
                function getEachItem(lendings, callback) {
                    $scope.sData.foundItems = []
                    async.each(lendings, function(lending) {
                        entu.getEntity(lending.id, $rootScope.rData.user.id, $rootScope.rData.user.token, $http, function(error, entity) {
                            if(error) { return callback(error) }

                            $scope.sData.foundItems.push(entity)
                            callback(null)
                        })
                    }, callback)
                }
            ], function(error) {
                if(error) { cl(error) }

                $('#select-item-modal').modal('show')
            })

        }



        $scope.addLendingRow = function(item) {
            $('#select-item-modal').modal('hide')

            if(!$scope.sData.lending._id) { return }

            async.waterfall([
                function getUser(callback) {
                    entu.getUser($window.sessionStorage.getItem('userId'), $window.sessionStorage.getItem('userToken'), $http, function(error, user) {
                        if(error) {
                            $rootScope.rData.user = null
                            callback(error)
                        } else {
                            $rootScope.rData.user = user
                            callback(null)
                        }
                    })
                },
                function addLendingRowEntity(callback) {
                    var lendingRow = {
                        definition: 'laenutuse-rida',
                        'laenutuse-rida-varustus': item._id
                    }
                    if($scope.sData.lending.algus) { lendingRow['laenutuse-rida-bronnialgus'] = $scope.sData.lending.algus.db_value }
                    if($scope.sData.lending.kestvus) { lendingRow['laenutuse-rida-kestvus'] = $scope.sData.lending.kestvus.db_value }

                    entu.addEntity($scope.sData.lending._id, lendingRow, $rootScope.rData.user.id, $rootScope.rData.user.token, $http, callback)
                },
                function getNewLendingRow(lendingRow, callback) {
                    entu.getEntity(lendingRow.id, $rootScope.rData.user.id, $rootScope.rData.user.token, $http, function(error, entity) {
                        if(error) { return callback(error) }

                        $scope.sData.lendingRows.push(entity)
                        callback(null)
                    })
                }
            ], function(error) {
                if(error) { cl(error) }
            })
        }



        $scope.lendLendingRow = function(item) {
            async.waterfall([
                function getUser(callback) {
                    entu.getUser($window.sessionStorage.getItem('userId'), $window.sessionStorage.getItem('userToken'), $http, function(error, user) {
                        if(error) {
                            $rootScope.rData.user = null
                            callback(error)
                        } else {
                            $rootScope.rData.user = user
                            callback(null)
                        }
                    })
                },
                function editLendingRowEntity(callback) {
                    var lendingRow = {}
                    if(!item.algus && !item.l6pp) {
                        lendingRow['laenutuse-rida-algus'] = parseDate('now')
                    } else if(item.algus && !item.l6pp) {
                        lendingRow['laenutuse-rida-l6pp'] = parseDate('now')
                    } else if(item.algus && item.l6pp) {
                        lendingRow['laenutuse-rida-algus.' + item.algus.id] = parseDate('now')
                        lendingRow['laenutuse-rida-l6pp.' + item.l6pp.id] = ''
                    }

                    entu.changeEntity(item._id, lendingRow, $rootScope.rData.user.id, $rootScope.rData.user.token, $http, callback)
                },
                function getNewLendingRow(lendingRow, callback) {
                    entu.getEntity(lendingRow.id, $rootScope.rData.user.id, $rootScope.rData.user.token, $http, function(error, entity) {
                        if(error) { return callback(error) }

                        for (var r in $scope.sData.lendingRows) {
                            if(!$scope.sData.lendingRows.hasOwnProperty(r)) { continue }

                            if($scope.sData.lendingRows[r]._id === item._id) {
                                $scope.sData.lendingRows.splice(r, 1)
                                break
                            }
                        }
                        $scope.sData.lendingRows.push(entity)
                        callback(null)
                    })
                }
            ], function(error) {
                if(error) { cl(error) }
            })
        }



        $scope.lendAllAddInvoice = function() {
            async.waterfall([
                function getUser(callback) {
                    entu.getUser($window.sessionStorage.getItem('userId'), $window.sessionStorage.getItem('userToken'), $http, function(error, user) {
                        if(error) {
                            $rootScope.rData.user = null
                            callback(error)
                        } else {
                            $rootScope.rData.user = user
                            callback(null)
                        }
                    })
                },
                function changeLendingRowEntities(callback) {
                    async.each($scope.sData.lendingRows, function(row, callback) {
                        var lendingRow = {}
                        if($scope.sData.isBron && !row.algus && !row.l6pp) {
                            lendingRow['laenutuse-rida-algus'] = parseDate('now')
                        } else if($scope.sData.isOut && row.algus && !row.l6pp){
                            lendingRow['laenutuse-rida-l6pp'] = parseDate('now')
                        } else {
                            return callback(null)
                        }
                        entu.changeEntity(row._id, lendingRow, $rootScope.rData.user.id, $rootScope.rData.user.token, $http, callback)
                    }, function(error) {
                        if(error) { cl(error) }

                        callback(null)
                    })
                },
                function createNewErplyInvoice(callback) {
                    if($scope.sData.lending.erply || $scope.sData.invoiceRows.length === 0) { return callback(null, null) }

                    var params = {
                        type: 'CASHINVOICE',
                        pointOfSaleID: 2,
                        paymentType: $scope.sData.paymentType
                    }
                    for (var i in $scope.sData.customers) {
                        if(!$scope.sData.customers.hasOwnProperty(i)) { continue }
                        if($scope.sData.lending.laenutaja.db_value === $scope.sData.customers[i].name) {
                            params.customerID = $scope.sData.customers[i].id
                            break
                        }
                    }
                    var n = 1
                    for (var ir in $scope.sData.invoiceRows) {
                        if(!$scope.sData.invoiceRows.hasOwnProperty(ir)) { continue }
                        params['productID' + n] = $scope.sData.invoiceRows[ir].id
                        params['amount' + n] = $scope.sData.invoiceRows[ir].quantity
                        n = n + 1
                    }
                    entu.getErply('saveSalesDocument', params, $rootScope.rData.user.id, $rootScope.rData.user.token, $http, callback)
                },
                function changeLendingEntity(invoice, callback) {
                    var lendingData = {}
                    if(!$scope.sData.lending.erply && invoice) {
                        if(invoice.length === 0) { return callback(invoice) }
                        if(!invoice[0].invoiceID) { return callback(invoice) }

                        lendingData['laenutus-erply'] = invoice[0].invoiceID
                    }
                    if(!$scope.sData.lending.staatus) {
                        lendingData['laenutus-staatus'] = 'out'
                    } else if($scope.sData.isBron) {
                        lendingData['laenutus-staatus.' + $scope.sData.lending.staatus.id] = 'out'
                    } else if($scope.sData.isOut) {
                        lendingData['laenutus-staatus.' + $scope.sData.lending.staatus.id] = 'archive'
                    }
                    entu.changeEntity($scope.sData.lending._id, lendingData, $rootScope.rData.user.id, $rootScope.rData.user.token, $http, callback)
                },
            ], function(error) {
                if(error) { cl(error) }

                location.reload()
            })
        }



        $scope.addInvoiceRow = function(value) {
            if(!value) { return }

            $scope.sData.newInvoiceRow = {
                id: 0,
                name: '-- Lisa uus --'
            }
            if(!$scope.sData.invoiceRows) {
                $scope.sData.invoiceRows = []
            }

            for(var i in $scope.sData.invoiceRows) {
                if(!$scope.sData.invoiceRows.hasOwnProperty(i)) { continue }
                if($scope.sData.invoiceRows[i].id === value.id) {
                    $scope.sData.invoiceRows[i].quantity = $scope.sData.invoiceRows[i].quantity + 1
                    return
                }
            }
            $scope.sData.invoiceRows.push(value)
        }



        $scope.deleteInvoiceRow = function(value) {
            if(!value) { return }

            for(var i in $scope.sData.invoiceRows) {
                if(!$scope.sData.invoiceRows.hasOwnProperty(i)) { continue }
                if($scope.sData.invoiceRows[i].id === parseInt(value, 10)) {
                    if($scope.sData.invoiceRows[i].quantity > 1) {
                        $scope.sData.invoiceRows[i].quantity = $scope.sData.invoiceRows[i].quantity - 1
                    } else {
                        $scope.sData.invoiceRows.splice(i, 1)
                    }
                    break
                }
            }
        }



        $scope.sumInvoiceRows = function() {
            var sum = 0
            for(var i in $scope.sData.invoiceRows) {
                if(!$scope.sData.invoiceRows.hasOwnProperty(i)) { continue }
                sum = sum + $scope.sData.invoiceRows[i].price * $scope.sData.invoiceRows[i].quantity
            }
            return sum
        }

    }])
