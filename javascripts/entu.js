var entuAPI = 'https://nommelumepark.entu.ee/api2/'
var erplyAPI = 'https://nommelumepark.entu.ee/erply/'
var entu = {}



entu.getAuthUrl = function(state, redirect_url, http, callback) {
    http.post(entuAPI + 'user/auth', {state: state, redirect_url: redirect_url})
        .success(function(data) {
            if(!data.result) { return callback(data) }

            callback(null, data.result)
        })
        .error(function(error) {
            callback(error)
        })
}



entu.getUser = function(userId, userToken, http, callback) {
    http.get(entuAPI + 'user', {
            headers: {
                'X-Auth-UserId': userId,
                'X-Auth-Token': userToken
            }
        })
        .success(function(data) {
            if(!data.result) { return callback(data) }

            var user = {
                id: data.result.id,
                token: data.result.session_key,
                name: data.result.name
            }

            callback(null, user)
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
            if(!data.result) { return callback(data) }
            if(data.result.length === 0) { return callback(data) }

            callback(null, data.result)
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
            if(!data.result) { return callback(data) }

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
            if(!data.result) { return callback(data) }

            var entities = []
            for(var i in data.result) {
                if(!data.result.hasOwnProperty(i)) { continue }
                for(var n in data.result[i].entities) {
                    if(!data.result[i].entities.hasOwnProperty(n)) { continue }
                    entities.push(data.result[i].entities[n])
                }
            }

            callback(null, entities)
        })
        .error(function(error) {
            callback(error)
        })
}



entu.getErply = function(method, params, userId, userToken, http, callback) {
    http.post(erplyAPI + method, params, {
            headers: {
                'X-Auth-UserId': userId,
                'X-Auth-Token': userToken
            }
        })
        .success(function(data) {
            if(!data.result) { return callback(data) }

            callback(null, data.result)
        })
        .error(function(error) {
            callback(error)
        })
}



entu.addEntity = function(parentEntityId, properties, userId, userToken, http, callback) {
    http.post(entuAPI + 'entity-' + parentEntityId, properties, {
            headers: {
                'X-Auth-UserId': userId,
                'X-Auth-Token': userToken
            }
        })
        .success(function(data) {
            if(!data.result) { return callback(data) }

            callback(null, data.result)
        })
        .error(function(error) {
            callback(error)
        })
}



entu.changeEntity = function(entityId, properties, userId, userToken, http, callback) {
    http.put(entuAPI + 'entity-' + entityId, properties, {
            headers: {
                'X-Auth-UserId': userId,
                'X-Auth-Token': userToken
            }
        })
        .success(function(data) {
            if(!data.result) { return callback(data) }

            callback(null, data.result)
        })
        .error(function(error) {
            callback(error)
        })
}
