import {_} from 'lodash';
import Schema from 'schemaroller';
import fs from 'fs';
import path from 'path';
console.log(`process.cwd: ${process.cwd()}${path.sep}`);
let configPath = `${ process.cwd() }${ path.sep }server${ path.sep }api-hero.json`;
const params = fs.existsSync(configPath) ? require(configPath) : {};
/**
 *
 */
class APIOptions {
  constructor() {
    this.__opts = new Schema();
    let _ = _.extend({}, {
    	// defines `api_basepath`: the base path for the REST route
        apiBasePath : '/api',
        // defines `api_version`: the version for the REST route
        apiVersion : '',
        apiPath: '',
        // defines `api_namespace`: the published API NameSpace
        apiNamespace : '',
        // defines `schema_path`: the schema directory path
        schemaPath  : `${process.cwd()}${path.sep}schemas`,
        // defines `require_path`: the path to require npm modules from
        schemaApiRequirePath  : `${process.cwd()}${path.sep}.api-hero`,
        // defines `data_path`: the location of the rikki-tikki's hidden file cache
        dataPath : `${process.cwd()}${path.sep}.api-hero`,
        // defines `trees_path`: the location of the rikki-tikki's cache file for schema trees file
        treesPath : `${process.cwd()}${path.sep}.api-hero${path.sep}trees`,
        // defines `destructive`: destroy orrenamedeleteted collection schemas
        destructive : false,
        // defines `debug`: debug mode on/off
        debug : process.NODE_ENV === undefined || process.NODE_ENV === 'development',
        // defines `default_datasource`: name of datasource to use by default
        defaultDatasource : 'mongo',
        serverDir: './server',
        // -- wy are there two options -- perhaps a sub-object or combine
        monitorRequests: true,
        monitoringEnabled: true,
        // configs for individual modules
        moduleOptions: {}
	}, params);
    _.apiPath = `${_.get('apiBasePath')}/${_.get('apiVersion')}/`
	this.__opts.set( _ );
  }
  /**
   * returns options
   */
  getOpts() {
    return this.__opts;
  }
  
  static getInstance() {
	  return new this;
  }
}
export default APIOptions.getInstance().getOpts();
