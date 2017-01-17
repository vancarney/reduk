{_}             = require 'lodash'
fs              = require 'fs'
path            = require 'path'
Util            = require '../utils'
APIOptions      = require '../config/APIOptions'
SchemaManager   = require '../schema/SchemaManager'
AbstractMonitor = require '../base_class/AbstractMonitor'
class SchemaMonitor extends AbstractMonitor
  __exclude:[/^(_+.*|\.+\.?)$/]
  constructor:->
    Util.File.ensureDirExists @__path = APIOptions.get 'schema_path'
    SchemaMonitor.__super__.constructor.call @
    return unless APIOptions.get 'monitoring_enabled'
    setTimeout (=>
      unless _initialized
        _initialized = true
        @emit 'init', '0':'added':@getCollection()
    ), 600
  refresh:(callback)->
    ex = []
    SchemaManager.getInstance().listSchemas (e, names)=>
      list = _.compact _.map names, (v)=>
        if !fs.existsSync _path = "#{@__path}#{path.sep}#{v}.js"
          @__collection.removeItemAt @getNames().indexOf v
          return null
        if (@filter v) and (stats = fs.statSync _path)?
          {name:v, updated:new Date(stats.mtime).getTime()}
      if list.length > 0
        _.each list, (value)=>
          if 0 <= (idx = @getNames().indexOf value.name)
            ex.push value
            if (@__collection.getItemAt( idx ).updated != value.updated)
              @__collection.setItemAt value, idx
        @__collection.addAll list if (list = _.difference list, ex).length
      callback? e, list
  startPolling:->
    @__iVal ?= fs.watch @__path, (event, filename) =>
      try
        SchemaManager.getInstance().load()
      catch e
        console.log e
      finally
        @refresh()
  stopPolling:->
    if @__iVal
      @__iVal.close()
      @__iVal = null
module.exports = SchemaMonitor
