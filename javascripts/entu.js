var entuAPI = 'https://nommelumepark.entu.ee/api2/'
var erplyAPI = 'https://nommelumepark.entu.ee/erply/'
var entu = {}



entu.getAuthUrl = function(state, redirect_url, http, callback) {
    http.post(entuAPI + 'user/auth', {state: state, redirect_url: redirect_url})
        .success(function(data) {
            if(!data.result) { return callback(data) }

            callback(null, data.result)
        })
        .error(callback)
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
        .error(callback)
}



var getEntity = function(entityId, userId, userToken, http, callback) {
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
        .error(callback)
}
entu.getEntity = getEntity



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

            async.map(data.result, function(entity, callback) {
                entu.getEntity(entity.id, userId, userToken, http, callback)
            }, callback)
        })
        .error(callback)
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

            var ids = []
            for(var i in data.result) {
                if(!data.result.hasOwnProperty(i)) { continue }
                for(var n in data.result[i].entities) {
                    if(!data.result[i].entities.hasOwnProperty(n)) { continue }
                    ids.push(data.result[i].entities[n])
                }
            }

            async.map(ids, function(id, callback) {
                entu.getEntity(id, userId, userToken, http, callback)
            }, callback)
        })
        .error(callback)
}



entu.getReferrals = function(entityId, userId, userToken, http, callback) {
    http.get(entuAPI + 'entity-' + entityId +'/referrals', {
            headers: {
                'X-Auth-UserId': userId,
                'X-Auth-Token': userToken
            },
            params: params
        })
        .success(function(data) {
            if(!data.result) { return callback(data) }

            var ids = []
            for(var i in data.result) {
                if(!data.result.hasOwnProperty(i)) { continue }
                for(var n in data.result[i].entities) {
                    if(!data.result[i].entities.hasOwnProperty(n)) { continue }
                    ids.push(data.result[i].entities[n])
                }
            }

            async.map(ids, function(id, callback) {
                entu.getEntity(id, userId, userToken, http, callback)
            }, callback)
        })
        .error(callback)
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
        .error(callback)
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
        .error(callback)
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
        .error(callback)
}
