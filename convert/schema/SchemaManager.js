//### SchemaManager
//> Manages Schema Life Cycle
//> requires: lodash
import { _ } from 'lodash';
//> requires: fs
import fs from 'fs';
//> requires: path
import path from 'path';
import Util from '../utils';
import Singleton from '../base_class/Singleton';
import APIOptions from '../config/APIOptions';
// requires: SchemaLoader
import SchemaLoader from './SchemaLoader';
import Schema from './Schema';
// defines `SchemaManager` as sub-class of `Singleton`
class SchemaManager extends Singleton {
  static initClass() {
    this.prototype.__meta ={};
    // holder for `schemas`
    this.prototype.__schemas ={};
  }
  //# `class` constructor
  constructor() {
    this.load = this.load.bind(this);
    SchemaManager.__super__.constructor.call(this);
    // defines `__path`
    Util.File.ensureDirExists(this.__path = APIOptions.get('schema_path'));
    // invokes `load`
    this.load();
  }
  //# load()
  //> Shallowly Traverses Schema Directory and loads found Schemas that are not marked as hidden with a prepended `_` or `.`
  load() {
    try {
      // attempts to get stats on the file
      var stat = fs.statSync(this.__path);
    } catch (e) {
      this.emit.apply(this, ['error', e]);
    }
    // tests for directory
    if (__guard__(stat, x => x.isDirectory())) {
      // walk this directory
      return (() => {
        let result = [];
        for (let file of fs.readdirSync(this.__path)) {
        // skip files that are declared as hidden
          let n;
          if (file.match(/^(_|\.)+/)) { continue; }
          // creates new SchemaLoader and assign to __schemas hash
          result.push((this.__schemas[n = Util.File.name(file)] = new SchemaLoader(`${this.__path}${path.sep}${n}`))
          .on('error', e=> {
            if (e != null) { return this.emit('error', e); }
          }
          ));
        }
        return result;
      })();
    }
  }
  //# createSchema(name, [data], callback)
  //> retrieves loaded schema by name if exists
  createSchema(name, data={}, callback){
    // tests for missing data param
    if (typeof data === 'function') {
      // assigns args param to callback
      callback = arguments[1];
      // defines data as empty object
      data = {};
    }
    // attempts to get existing schema
    return this.getSchema(name, (e,schema)=> {
      // tests if schema was not found
      if (schema == null) {
        // attempts to create a new schema
        return (this.__schemas[name] = new SchemaLoader).create(`${name}`, data, callback);
      } else {
        // invokes callback if schema was found
        return __guardFunc__(callback, f => f(null, schema));
      }
    }
    );
  }
  //# getSchema(name, callback)
  //> retrieves loaded schema by name if exists
  getSchema(name, callback){
    let schema;
    if (this.__schemas == null) { this.__schemas = {}; }
    // attempts to assign schema from hash to var
    if ((schema = this.__schemas[name]) != null) {
      // invokes callback with schema if defined
      return __guardFunc__(callback, f => f(null, schema));
    } else {
      // invokes callback with error if schema not found
      return __guardFunc__(callback, f1 => f1(`Schema '${name}' was not found`, null));
    }
  }
  reloadSchema(name,callback){
    return this.getSchema(name, (e,schema)=> {
      if (!schema) {
        return __guardFunc__(callback, f => f(e, null));
      } else {
        return schema.reload(callback);
      }
    }
    );
  }
  //# listSchemas(callback)
  //> retrieves list of all loaded schema names
  listSchemas(callback){
    // invokes callback with keys from schema hash
    return __guardFunc__(callback, f => f(null, _.keys(this.__schemas)));
  }
  //# saveSchema(name, callback)
  //> saves individual schema data to file
  saveSchema(name, callback){
    // attempts to get existing schema
    return this.getSchema(name, (e,schema)=> {
      // invokes callback and returns if schema does not exist
      if (e != null) { return __guardFunc__(callback, f => f(e, null)); }
      if (!schema) { return __guardFunc__(callback, f1 => f1(`Schema '${name} was not found`, null)); }
      // attempts to save schema
      return schema.save(callback);
    }
    );
  }
  //# renameSchema(name, newName, callback)
  //> renames schema in hash and attempts to rename file
  renameSchema(name, newName, callback){
    console.log(`SchemaManager.renameSchema: ${name} -> ${newName}`);
    // attempts to get existing schema
    return this.getSchema(name, (e,schema)=> {
      // invokes callback if schema not found
      if (e != null) { return __guardFunc__(callback, f => f(e, null)); }
      // creates copy of schema at new hash key
      (this.__schemas[newName] = schema).name = newName;
      // deletes schema from hash
      delete this.__schemas[name];
      // attempts to rename schema
      return schema.rename(newName, callback);
    }
    );
  }
  //# saveSchema(name, callback)
  //> saves all loaded schemas to files
  saveAll(callback){
    // holder for error output
    let eOut = [];
    // loops on all Schema elements
    _.each(this.__schemas, (v,k)=> 
      // attempts to save schema
      v.save(e=> { if (e) { return eOut.push(e); } })
    );
    // invokes callback if defined
    return __guardFunc__(callback, f => f((eOut.length ? eOut : null), null));
  }
  //# destroySchema(name, callback)
  //> removes schema from hash and attempts to rename/remove file
  destroySchema(name, callback){
    // attempts to get existing schema
    return this.getSchema(name, (e,schema)=> {
      // attempts to invoke callback if error is defined
      if (e != null) { return __guardFunc__(callback, f => f(e, null)); }
      // attemps to destroy the schema file
      return schema.destroy((e,s)=> {
        // delete schema from hash
        if (this.__schemas[name] != null) { delete this.__schemas[name]; }
        // invokes callback if defined
        return callback(e,s);
      }
      );
    }
    );
  }
  //# toJSON(pretty)
  //> returns a JSON parsed string encoded hash
  //> if param pretty is set, will indent and linebreak JSON output
  toJSON(pretty){
    return JSON.parse(this.toString(pretty));
  }
  //# toString(pretty)
  //> returns a string encoded object representation
  //> if param pretty is set, will indent and linebreak JSON output
  toString(pretty){
    let schema;
    let s = {};
    _.each(_.keys(this.__schemas), key=> s[key] = (schema = this.__schemas[key].__data).toClientSchema ? schema.toClientSchema() : schema);
    return JSON.stringify({__meta__:this.__meta, __schemas__:s}, Schema.replacer, pretty ? 2 : undefined);
  }
}
SchemaManager.initClass();
// declares exports
export default SchemaManager;
function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
function __guardFunc__(func, transform) {
  return typeof func === 'function' ? transform(func) : undefined;
}