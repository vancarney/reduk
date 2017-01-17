#### SchemaManager
#> Manages Schema Life Cycle
#> requires: lodash
{_}             = require 'lodash'
#> requires: fs
fs              = require 'fs'
#> requires: path
path            = require 'path'
Util            = require '../utils'
Singleton       = require '../base_class/Singleton'
APIOptions      = require '../config/APIOptions'
# requires: SchemaLoader
SchemaLoader    = require './SchemaLoader'
Schema= require './Schema'
# defines `SchemaManager` as sub-class of `Singleton`
class SchemaManager extends Singleton
  __meta:{}
  # holder for `schemas`
  __schemas:{}
  ## `class` constructor
  constructor:->
    SchemaManager.__super__.constructor.call @
    # defines `__path`
    Util.File.ensureDirExists @__path = APIOptions.get 'schema_path'
    # invokes `load`
    @load()
  ## load()
  #> Shallowly Traverses Schema Directory and loads found Schemas that are not marked as hidden with a prepended `_` or `.`
  load:=>
    try
      # attempts to get stats on the file
      stat = fs.statSync @__path
    catch e
      @emit.apply @, ['error', e]
    # tests for directory
    if stat?.isDirectory()
      # walk this directory
      for file in fs.readdirSync @__path
        # skip files that are declared as hidden
        continue if file.match /^(_|\.)+/
        # creates new SchemaLoader and assign to __schemas hash
        (@__schemas[n = Util.File.name file] = new SchemaLoader "#{@__path}#{path.sep}#{n}")
        .on 'error', (e)=>
          @emit 'error', e if e?
  ## createSchema(name, [data], callback)
  #> retrieves loaded schema by name if exists
  createSchema:(name, data={}, callback)->
    # tests for missing data param
    if typeof data is 'function'
      # assigns args param to callback
      callback = arguments[1]
      # defines data as empty object
      data = {}
    # attempts to get existing schema
    @getSchema name, (e,schema)=>
      # tests if schema was not found
      unless schema?
        # attempts to create a new schema
        (@__schemas[name] = new SchemaLoader).create "#{name}", data, callback
      else
        # invokes callback if schema was found
        callback? null, schema
  ## getSchema(name, callback)
  #> retrieves loaded schema by name if exists
  getSchema:(name, callback)->
    @__schemas ?= {}
    # attempts to assign schema from hash to var
    if (schema = @__schemas[name])?
      # invokes callback with schema if defined
      callback? null, schema
    else
      # invokes callback with error if schema not found
      callback? "Schema '#{name}' was not found", null
  reloadSchema:(name,callback)->
    @getSchema name, (e,schema)=>
      unless schema
        callback? e, null
      else
        schema.reload callback
  ## listSchemas(callback)
  #> retrieves list of all loaded schema names
  listSchemas:(callback)->
    # invokes callback with keys from schema hash
    callback? null, _.keys @__schemas
  ## saveSchema(name, callback)
  #> saves individual schema data to file
  saveSchema:(name, callback)->
    # attempts to get existing schema
    @getSchema name, (e,schema)=>
      # invokes callback and returns if schema does not exist
      return callback? e, null if e?
      return callback? "Schema '#{name} was not found", null unless schema
      # attempts to save schema
      schema.save callback
  ## renameSchema(name, newName, callback)
  #> renames schema in hash and attempts to rename file
  renameSchema:(name, newName, callback)->
    console.log "SchemaManager.renameSchema: #{name} -> #{newName}"
    # attempts to get existing schema
    @getSchema name, (e,schema)=>
      # invokes callback if schema not found
      return callback? e, null if e?
      # creates copy of schema at new hash key
      (@__schemas[newName] = schema).name = newName
      # deletes schema from hash
      delete @__schemas[name]
      # attempts to rename schema
      schema.rename newName, callback
  ## saveSchema(name, callback)
  #> saves all loaded schemas to files
  saveAll:(callback)->
    # holder for error output
    eOut = []
    # loops on all Schema elements
    _.each @__schemas, (v,k)-> 
      # attempts to save schema
      v.save (e)=> eOut.push e if e
    # invokes callback if defined
    callback? (if eOut.length then eOut else null), null
  ## destroySchema(name, callback)
  #> removes schema from hash and attempts to rename/remove file
  destroySchema:(name, callback)->
    # attempts to get existing schema
    @getSchema name, (e,schema)=>
      # attempts to invoke callback if error is defined
      return callback? e, null if e?
      # attemps to destroy the schema file
      schema.destroy (e,s)=>
        # delete schema from hash
        delete @__schemas[name] if @__schemas[name]?
        # invokes callback if defined
        callback e,s
  ## toJSON(pretty)
  #> returns a JSON parsed string encoded hash
  #> if param pretty is set, will indent and linebreak JSON output
  toJSON:(pretty)->
    JSON.parse @toString pretty
  ## toString(pretty)
  #> returns a string encoded object representation
  #> if param pretty is set, will indent and linebreak JSON output
  toString:(pretty)->
    s = {}
    _.each _.keys(@__schemas), (key)=> s[key] = if (schema = @__schemas[key].__data).toClientSchema then schema.toClientSchema() else schema
    JSON.stringify {__meta__:@__meta, __schemas__:s}, Schema.replacer, if pretty then 2 else undefined
# declares exports
module.exports = SchemaManager