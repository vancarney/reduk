{_}   = require 'lodash'
Hash  = require '../base_class/Hash'
#### ClientOptions
class ClientOptions extends Hash
  constructor:(params={})->
    ApiHero = require '../..'
    # invokes `Hash` with extended API Option Defaults
    ClientOptions.__super__.constructor.call @, o = _.extend( (
      host : ApiHero.getApp().get 'host'
      port : ApiHero.getApp().get 'post'
      api_version : (ApiHero.getApp().get 'version') || 1
      # app_id: require.main.exports.get 'APP'
      # app_id_param_name : ApiHero.CLIENT_APP_ID_PARAM_NAME
      # api_namespace : ApiHero.CLIENT_API_NAMESPACE
      # rest_key : ApiHero.CLIENT_REST_KEY
      # rest_key_param_name  : ApiHero.CLIENT_REST_KEY_PARAM_NAME
      # protocol : ApiHero.CLIENT_PROTOCOL
      ), params),
      # passes array of keys to restrict Hash access
      _.keys o
module.exports = ClientOptions
ApiHero = require '../..'
