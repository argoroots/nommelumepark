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
            if (reload === false) {
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
    .controller('lendingsCtrl', ['$scope', '$rootScope', '$http', '$routeParams', '$window', function($scope, $rootScope, $http, $routeParams, $window) {
        if(!$rootScope.rData) { $rootScope.rData = {} }

        $rootScope.rData.activeMenu = $routeParams.filter
        $rootScope.rData.pageTitle = $routeParams.filter === 'bron' ? 'Broneeringud' : 'Rendis'

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
                        callback()
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
                        if(error) {
                            callback(error)
                        } else {
                            entity.status = entity.staatus ? entity.staatus.value : 'archive'
                            if(!$routeParams.filter || $routeParams.filter === entity.status) {
                                $scope.sData.lendings.push(entity)
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
        })
    }])



//LENDING
    .controller('lendingCtrl', ['$scope', '$rootScope', '$http', '$routeParams', '$location', '$window', function($scope, $rootScope, $http, $routeParams, $location, $window) {
        if(!$rootScope.rData) { $rootScope.rData = {} }

        $rootScope.rData.activeMenu = $routeParams.id
        $rootScope.rData.pageTitle = $routeParams.id === 'new' ? 'Uus' : '#' + $routeParams.id

        $scope.sData = {
            lending: {},
            oldLending: {},
            customers: [],
            prices: [],
            lendingRows: [],
            invoiceRows: [],
            addLendingRowQuery: ''
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
                        callback()
                    }
                })
            },
            function getData(callback) {
                async.parallel([
                    function getLending(callback) {
                        if(!lendingId) { return callback() }

                        entu.getEntity(lendingId, $rootScope.rData.user.id, $rootScope.rData.user.token, $http, function(error, entity) {
                            if(error) {
                                callback(error)
                            } else {
                                $rootScope.rData.pageTitle = $routeParams.id === 'new' ? 'Uus' : '#' + entity._id

                                $scope.sData.lending = entity
                                for (var i in $scope.sData.lending) {
                                    if (!$scope.sData.lending.hasOwnProperty(i)) { continue }
                                    if (!$scope.sData.lending[i].db_value) { continue }
                                    $scope.sData.oldLending[i] = $scope.sData.lending[i].db_value
                                }
                                $scope.calculateDates()
                                callback()
                            }
                        })
                    },
                    function getLendingRows(callback) {
                        if(!lendingId) { return callback() }

                        async.waterfall([
                            function getChilds(callback) {
                                entu.getChilds(lendingId, $rootScope.rData.user.id, $rootScope.rData.user.token, $http, callback)
                            },
                            function getEntities(lendingChilds, callback) {
                                $scope.sData.lendingRows = []
                                async.each(lendingChilds, function(value, callback) {
                                    entu.getEntity(value.id, $rootScope.rData.user.id, $rootScope.rData.user.token, $http, function(error, entity) {
                                        if(error) {
                                            callback(error)
                                        } else {
                                            $scope.sData.lendingRows.push(entity)
                                            callback()
                                        }
                                    })
                                }, callback)
                            }
                        ], callback)
                    },
                    function getErplyCustomers(callback) {
                        entu.getErply('getCustomers', {}, $rootScope.rData.user.id, $rootScope.rData.user.token, $http, function(error, customers) {
                            if(error) {
                                callback(error)
                            } else {
                                $scope.sData.customers = []
                                async.each(customers, function(item, callback) {
                                    $scope.sData.customers.push({
                                        id: item.customerID,
                                        name: item.fullName.trim()
                                    })
                                    callback()
                                }, callback)
                            }
                        })
                    },
                    function getErplyPrices(callback) {
                        entu.getErply('getProducts', { groupID: 3 }, $rootScope.rData.user.id, $rootScope.rData.user.token, $http, function(error, customers) {
                            if(error) {
                                callback(error)
                            } else {
                                $scope.sData.prices = []
                                async.each(customers, function(item, callback) {
                                    $scope.sData.prices.push({
                                        id: item.productID,
                                        name: item.name.trim(),
                                        price: item.priceWithVat,
                                        quantity: 1
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
        })

        $scope.calculateDates = function(argument) {
            if($scope.sData.lending.algus) {
                $scope.sData.lending.algus.db_value = $scope.sData.lending.algus.db_value.substring(0, 16)
                $scope.sData.lending.algus.value = $scope.sData.lending.algus.value.substring(0, 16)
                $scope.sData.lendingEnd = {
                    h1: Date.parse($scope.sData.lending.algus.db_value).add({ hours: 1 }).toString('HH:mm'),
                    h3: Date.parse($scope.sData.lending.algus.db_value).add({ hours: 3 }).toString('HH:mm')
                }
            } else {
                $scope.sData.lendingEnd = {}
            }
        }


        $scope.saveLending = function(property) {
            if(!$scope.sData.lending[property]) { return }
            if($scope.sData.oldLending[property] && $scope.sData.lending[property].db_value === $scope.sData.oldLending[property]) { return }

            var lendingId = $scope.sData.lending._id

            if(property === 'algus') { $scope.sData.lending[property].db_value = parseDate($scope.sData.lending[property].db_value) }

            async.series([
                function getUser(callback) {
                    entu.getUser($window.sessionStorage.getItem('userId'), $window.sessionStorage.getItem('userToken'), $http, function(error, user) {
                        if(error) {
                            $rootScope.rData.user = null
                            callback(error)
                        } else {
                            $rootScope.rData.user = user
                            callback()
                        }
                    })
                },
                function addLendingEntity(callback) {
                    if(lendingId) { return callback() }

                    var lendingData = {
                        definition: 'laenutus',
                        'laenutus-staatus': 'bron'
                    }

                    entu.addEntity(614, lendingData, $rootScope.rData.user.id, $rootScope.rData.user.token, $http, function(error, newEntity) {
                        lendingId = newEntity.id
                        $location.path('/lending/' + lendingId, false)
                        callback()
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
                        if(error) {
                            callback(error)
                        } else {
                            $rootScope.rData.activeMenu = null
                            $rootScope.rData.pageTitle = '#' + entity._id

                            $scope.sData.lending = entity
                            for (var i in $scope.sData.lending) {
                                if (!$scope.sData.lending.hasOwnProperty(i)) { continue }
                                if (!$scope.sData.lending[i].db_value) { continue }
                                $scope.sData.oldLending[i] = $scope.sData.lending[i].db_value
                            }
                            callback()
                        }
                    })
                }
            ], function(error) {
                if(error) {
                    cl(error)
                }
                if(property === 'algus') { $scope.calculateDates() }
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
                            callback()
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
                            if(error) {
                                callback(error)
                            } else {
                                $scope.sData.foundItems.push(entity)
                                callback()
                            }
                        })
                    }, callback)
                }
            ], function(error) {
                if(error) {
                    cl(error)
                } else {
                    $('#select-item-modal').modal('show')
                }
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
                            callback()
                        }
                    })
                },
                function addLendingRowEntity(callback) {
                    var lendingRow = {
                        definition: 'laenutuse-rida',
                        'laenutuse-rida-varustus': item._id
                    }
                    if($scope.sData.lending.algus) { lendingRow['laenutuse-rida-bronnialgus'] = $scope.sData.lending.algus.db_value }
                    if($scope.sData.lending.kestvus) { lendingRow['laenutuse-rida-kestus'] = $scope.sData.lending.kestvus.value }

                    entu.addEntity($scope.sData.lending._id, lendingRow, $rootScope.rData.user.id, $rootScope.rData.user.token, $http, callback)
                },
                function getNewLendingRow(lendingRow, callback) {
                    entu.getEntity(lendingRow.id, $rootScope.rData.user.id, $rootScope.rData.user.token, $http, function(error, entity) {
                        if(error) {
                            callback(error)
                        } else {
                            $scope.sData.lendingRows.push(entity)
                            callback()
                        }
                    })
                }
            ], function(error) {
                if(error) {
                    cl(error)
                }
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
                            callback()
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
                        if(error) {
                            callback(error)
                        } else {
                            for (var r in $scope.sData.lendingRows) {
                                if (!$scope.sData.lendingRows.hasOwnProperty(r)) { continue }

                                if($scope.sData.lendingRows[r]._id === item._id) {
                                    $scope.sData.lendingRows.splice(r, 1)
                                    break
                                }
                            }
                            $scope.sData.lendingRows.push(entity)
                            callback()
                        }
                    })
                }
            ], function(error) {
                if(error) {
                    cl(error)
                }
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
                            callback()
                        }
                    })
                },
                function editLendingRowEntities(callback) {
                    for (var r in $scope.sData.lendingRows) {
                        if (!$scope.sData.lendingRows.hasOwnProperty(r)) { continue }

                        var item = $scope.sData.lendingRows[r]

                        var lendingRow = {}
                        if($scope.sData.lending.staatus.value === 'bron' && !item.algus && !item.l6pp) {
                            lendingRow['laenutuse-rida-algus'] = parseDate('now')
                        } else if($scope.sData.lending.staatus.value === 'out' && item.algus && !item.l6pp){
                            lendingRow['laenutuse-rida-l6pp'] = parseDate('now')
                        } else {
                            continue
                        }

                        entu.changeEntity(item._id, lendingRow, $rootScope.rData.user.id, $rootScope.rData.user.token, $http, function(error) {
                            if(error) {
                                cl(error)
                            }
                        })
                    }
                    callback()
                },
                function createNewErplyInvoice(callback) {
                    if($scope.sData.lending.erply) { return callback() }

                    var params = {
                        type: 'CASHINVOICE',
                        pointOfSaleID: 2,
                        confirmInvoice: 0,
                    }
                    for (var i in $scope.sData.customers) {
                        if (!$scope.sData.customers.hasOwnProperty(i)) { continue }
                        if($scope.sData.lending.laenutaja.value === $scope.sData.customers[i].name) {
                            params.customerID = $scope.sData.customers[i].id
                            break
                        }
                    }
                    var n = 1
                    for (var i in $scope.sData.invoiceRows) {
                        if (!$scope.sData.invoiceRows.hasOwnProperty(i)) { continue }
                        params['productID' + n] = $scope.sData.invoiceRows[i].id
                        params['amount' + n] = $scope.sData.invoiceRows[i].quantity
                        n = n + 1
                    }
                    entu.getErply('saveSalesDocument', params, $rootScope.rData.user.id, $rootScope.rData.user.token, $http, callback)
                },
                function changeLendingEntity(invoice, callback) {
                    var lendingData = {}
                    if(!$scope.sData.lending.erply) {
                        if(!invoice[0]) { callback(invoice) }
                        if(!invoice[0].invoiceID) { callback(invoice) }
                        lendingData['laenutus-erply'] = invoice[0].invoiceID
                    }
                    if(!$scope.sData.lending.staatus) {
                        lendingData['laenutus-staatus'] = 'out'
                    } else if($scope.sData.lending.staatus.value === 'bron') {
                        lendingData['laenutus-staatus.' + $scope.sData.lending.staatus.id] = 'out'
                    } else if($scope.sData.lending.staatus.value === 'out') {
                        lendingData['laenutus-staatus.' + $scope.sData.lending.staatus.id] = 'archive'
                    }
                    entu.changeEntity($scope.sData.lending._id, lendingData, $rootScope.rData.user.id, $rootScope.rData.user.token, $http, callback)
                },
            ], function(error) {
                if(error) {
                    cl(error)
                } else {
                    location.reload()
                }
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
