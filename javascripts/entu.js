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
                    _id: data.result.id,
                    _name: data.result.displayname,
                    _info: data.result.displayinfo
                }
                for(var p in data.result.properties) {
                    if(!data.result.properties.hasOwnProperty(p)) { continue }
                    if(!data.result.properties[p].values) { continue }
                    entity[p] = data.result.properties[p].values[0]
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
                for(var i in data.result) {
                    if(!data.result.hasOwnProperty(i)) { continue }
                    for(var n in data.result[i].entities) {
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