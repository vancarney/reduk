//### SchemaLoader
//> Loads a Schema File
//> requires: lodash
import { _ } from 'lodash';
//> requires: path
import path from 'path';
// derives objects from module parent
import Util from '../utils';
import APIOptions from '../config/APIOptions';
import AbstractLoader from '../base_class/AbstractLoader';
// defines `SchemaLoader` as sub-class of `AbstractLoader`
class SchemaLoader extends AbstractLoader {
  static initClass() {
    // holder for Schema Data
    this.prototype.__data ={};
  }
  constructor(name){
    this.name = name;
    let _path = this.name ? SchemaLoader.createPath(this.name) : null;
    // invokes `AbstractLoader` with path if passed
    try {
      SchemaLoader.__super__.constructor.call(this, _path);
    } catch (e) {
      this.emit.apply(this, ['error',e]);
    }
  }
  // set(tree, opts, callback)
  //> adds 'tree' to loaded schema data
  set(tree, opts, callback){
    // tests if opts is callback
    if (typeof opts === 'function') {
      // defines callback from arguments
      callback = arguments[1];
      // defines opts with empty object
      opts = {};
    }
    // applies tree to `__data`
    _.extend(this.__data, tree); //if typeof tree == 'string' then (o={})[tree] = opts else tree
    // invokes `save` with callback
    return this.save(callback);
  }
  // unset(attr, callback)
  //> removes 'attr' from loaded schema data
  unset(attr, callback){
    //  applies `delete` to __data
    if (this.__data.hasOwnProperty(attr)) { delete this.__data[attr]; }
    // invokes `save` with callback
    return this.save(callback);
  }
  // load(path, callback)
  //> loads Schema 
  load(_path, callback){
    // tests if path is callback
    if (typeof _path === 'function') {
      // defines callback from arguments
      callback = arguments[0];
      // defines path as null
      _path = null;
    } else {
      // defines __path from path param if __path null
      if (this.__path == null) { this.__path = _path; }
    }
    // tests if __path exists
    if (this.pathExists(this.__path)) {
      // invoke load on `super`
      return SchemaLoader.__super__.load.call(this, e => {
        if (e != null) { return __guardFunc__(callback, f => f(e)); }
        return __guardFunc__(callback, f1 => f1(null, this.__data));
      }
      );
    } else {
      // defines __data with empty object
      this.__data = {};
      // invokes callback if defined
      return __guardFunc__(callback, f => f(null, this.__data));
    }
  }
  // reload(callback)
  //> reloads Schema file
  reload(callback){
    console.log('SchemaLoader.reload');
    // deletes loaded schema from `module cache`
    delete require.cache[this.__path];
    return this.load(this.__path, callback);
  }
  // create(name, tree={}, callback)
  //> creates new Schema and associated files
  create(name, tree={}, callback){
    this.name = name;
    if (this.name == null) { return __guardFunc__(callback, f => f("Name is required", null)); }
    this.__path = SchemaLoader.createPath(this.name);
    return this.save(callback);
  }
    // attempts to create new Schema file
    // SchemaLoader.__super__.create.call @, _path, tree, (e,s)=>
      // invokes callback if defined
      // callback? (if e? then "Could not create Schema #{_path}\r\t#{e}" else null), s
  // renameSchema(name, newName, callback)
  //> renames Schema file on filesystem
  rename(newName, callback){
    console.log(SchemaLoader.createPath(this.name = newName));
    // invokes rename on __super__
    return SchemaLoader.__super__.rename.call(this, SchemaLoader.createPath(this.name = newName), (e,s)=> {
      // invokes callback if defined
      return __guardFunc__(callback, f => f(((e != null) ? `Could not rename Schema ${this.name}\r\t${e}` : null),s));
    }
    );
  }
  // create(callback)
  //> destroys Schema and associated files 
  destroy(callback){
    // tests for destructiveness
    if (!APIOptions.get('destructive')) {
      // attempts to rename file instead of deleting it. FileName.js becomes _FileName.js
      return this.rename(`_${this.name}`, (e,s) => {
        // invokes callback if present
        return __guardFunc__(callback, f => f(((e != null) ? `Schema.destroy failed\r\t${e}` : null),s));
      }
      );
    // attempts to delete Schema file when APIOptions.destructive tests `true`
    } else {
      // invokes `destroy` on `super`
      return SchemaLoader.__super__.destroy.call(this, (e,s)=> {
        // invokes callback if defined
        return __guardFunc__(callback, f => f(((e != null) ? `Schema.destroy failed\r\t${e}` : null),s));
      }
      );
    }
  }
  save(callback){
    if (this.__path == null) { return __guardFunc__(callback, f => f("path was not defined")); }
    let ApiHero = require('../..');
    let model = ApiHero.model(this.name, new Schema(this.__data));
    return Util.File.writeFile(this.__path, model.toAPISchema().toSource(), null, callback);
  }
}
SchemaLoader.initClass();
SchemaLoader.createPath = name=> `${APIOptions.get('schema_path')}${path.sep}${name}.js`;
// declares exports
export default SchemaLoader;

import Schema from './Schema';
function __guardFunc__(func, transform) {
  return typeof func === 'function' ? transform(func) : undefined;
}