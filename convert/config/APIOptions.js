import { _ } from 'lodash';
import Hash from 'strictly-hash';
import fs from 'fs';
import path from 'path';
import Singleton from '../base_class/Singleton';
let config_path = `${process.cwd()}${path.sep}server${path.sep}api-hero.json`;
//### APIOptions
class APIOptions extends Hash {
  constructor() { 
    let o;
    let params = fs.existsSync( config_path ) ? require(config_path) : {};
    // invokes `Hash` with extended API Option Defaults
    APIOptions.__super__.constructor.call(this, o = _.extend(({
      // defines `api_basepath`: the base path for the REST route
      api_basepath : '/api',
      // defines `api_version`: the version for the REST route
      api_version : '',
      api_path:'',
      // defines `api_namespace`: the published API NameSpace
      api_namespace : '',
      // defines `schema_path`: the schema directory path
      schema_path  : `${process.cwd()}${path.sep}schemas`,
      // defines `require_path`: the path to require npm modules from
      schema_api_require_path  : `${process.cwd()}${path.sep}.api-hero`,
      // defines `data_path`: the location of the rikki-tikki's hidden file cache
      data_path : `${process.cwd()}${path.sep}.api-hero`,
      // defines `trees_path`: the location of the rikki-tikki's cache file for schema trees file
      trees_path : `${process.cwd()}${path.sep}.api-hero${path.sep}trees`,
      // defines `destructive`: destroy orrenamedeleteted collection schemas
      destructive : false,
      // defines `wrap_schema_exports`: wrap schema exports in Model
      wrap_schema_exports : true,
      // defines `debug`: debug mode on/off
      debug : process.NODE_ENV === undefined || process.NODE_ENV === 'development',
      // defines `default_datasource`: name of datasource to use by default
      default_datasource : 'mongo',
      server_dir: './server',
      monitor_requests: true,
      monitoring_enabled: true,
      // configs for individual modules
      moduleOptions: {}
      }), params),
      // passes array of keys to restrict Hash access
      _.keys(o));
    this.set('api_path', `${this.get('api_basepath')}/${this.get('api_version')}/`);
  }
}
class ReturnValue extends Singleton {
  constructor() {
    this.__opts = new APIOptions;
  }
  getOpts() {
    return this.__opts;
  }
}
export default ReturnValue.getInstance().getOpts();
