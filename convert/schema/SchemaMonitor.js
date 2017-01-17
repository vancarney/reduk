import { _ } from 'lodash';
import fs from 'fs';
import path from 'path';
import Util from '../utils';
import APIOptions from '../config/APIOptions';
import SchemaManager from '../schema/SchemaManager';
import AbstractMonitor from '../base_class/AbstractMonitor';
class SchemaMonitor extends AbstractMonitor {
  static initClass() {
    this.prototype.__exclude =[/^(_+.*|\.+\.?)$/];
  }
  constructor() {
    Util.File.ensureDirExists(this.__path = APIOptions.get('schema_path'));
    SchemaMonitor.__super__.constructor.call(this);
    if (!APIOptions.get('monitoring_enabled')) { return; }
    setTimeout((() => {
      if (!_initialized) {
        var _initialized = true;
        return this.emit('init', {'0': {'added':this.getCollection()
      }});
      }
    }
    ), 600);
  }
  refresh(callback){
    let ex = [];
    return SchemaManager.getInstance().listSchemas((e, names)=> {
      let list = _.compact(_.map(names, v=> {
        let _path;
        let stats;
        if (!fs.existsSync(_path = `${this.__path}${path.sep}${v}.js`)) {
          this.__collection.removeItemAt(this.getNames().indexOf(v));
          return null;
        }
        if ((this.filter(v)) && ((stats = fs.statSync(_path)) != null)) {
          return {name:v, updated:new Date(stats.mtime).getTime()};
        }
      }));
      if (list.length > 0) {
        _.each(list, value=> {
          let idx;
          if (0 <= (idx = this.getNames().indexOf(value.name))) {
            ex.push(value);
            if (this.__collection.getItemAt( idx ).updated !== value.updated) {
              return this.__collection.setItemAt(value, idx);
            }
          }
        }
        );
        if ((list = _.difference(list, ex)).length) { this.__collection.addAll(list); }
      }
      return __guardFunc__(callback, f => f(e, list));
    }
    );
  }
  startPolling() {
    return this.__iVal != null ? this.__iVal : (this.__iVal = fs.watch(this.__path, (event, filename) => {
      try {
        return SchemaManager.getInstance().load();
      } catch (e) {
        return console.log(e);
      }
      finally {
        this.refresh();
      }
    }
    ));
  }
  stopPolling() {
    if (this.__iVal) {
      this.__iVal.close();
      return this.__iVal = null;
    }
  }
}
SchemaMonitor.initClass();
export default SchemaMonitor;

function __guardFunc__(func, transform) {
  return typeof func === 'function' ? transform(func) : undefined;
}