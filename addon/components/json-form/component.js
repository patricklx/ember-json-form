import Ember from 'ember';
import {
  validator, buildValidations
} from 'ember-cp-validations';
import template from './template';

Ember.TextField.reopen({
  _elementValueDidChange() {
    let r = this._super(...arguments);
    if (this.attrs.changed) {
      this.attrs.changed(this.element.value);
    }
    return r;
  }
});

Ember.TextArea.reopen({
  _elementValueDidChange() {
    let r = this._super(...arguments);
    if (this.attrs.changed) {
      this.attrs.changed(this.element.value);
    }
    return r;
  }
});

var Form = Ember.Object.extend({
  isFormInvalid: Ember.computed.not('validations.isValid'),
  fieldsets: null,
  fieldPaths: null,
  rootPath: null,
  __data: null,
  form: null,

  setIniData: Ember.observer('iniData', function () {
    var path, iniData;
    iniData = this.get('iniData');

    for (path of this.fieldPaths) {
      if (this.get(path.split('.').slice(0,-1).join('.'))) {
        Ember.set(this, path, Ember.get(iniData, path));
      }
    }
  }),

  iniData: Ember.computed('form.iniData', function () {
    return {
      __data: this.get('form.iniData')
    };
  }),

  data: Ember.computed(function () {
    var data, serialized, path;
    data = this.get(this.rootPath);
    serialized = {};

    for (path of this.fieldPaths) {
      var part, pathObject;

      //create the paths
      pathObject = serialized;
      for (part of path.split('.')) {
        if (!pathObject[part]) {
          pathObject[part] = {};
        }
        pathObject = pathObject[part];
      }
      //set the data
      Ember.set(serialized, path, this.get(path));
    }
    return serialized[this.rootPath];
  }).volatile()
});

export default Ember.Component.extend({
  layout: template,

  iniData: null,
  fieldsets: [],
  globalOptions: {},
  fieldsetsComponent: 'json-form-fieldsets',

  operators: {},
  _operators: Ember.computed(function () {
    var operators = this.get('operators');
    operators['eq'] = function (a,b) {return a==b; };
    operators['has'] = function (a,b) {return a && (a.contains(b) || a.isAny('id', b));};
    operators['in'] = function (a,b) {return b.split(',').contains(String(a));};
    operators['not'] = function(a, b) {return a != b;};
    operators['has_not'] = function(a, b) {return a && (!a.contains(b) && !a.isAny('id', b));};
    return operators;
  }),

  _globalOptions: Ember.computed('globalOptions', function () {
    var opts = this.get('globalOptions');
    var operators = this.get('_operators');
    opts.disabled = function disabled(model, attribute) {
      let findField = function (attr) {
        let parts = attribute.split('.');
        for(let i=0,l=model.fieldsets.length; i < l; i++) {
          let fs = model.fieldsets[i];
          if (fs.id !== parts[1]) {
            continue;
          }
          for(let j=0, l2=fs.fields.length; j < l2; j++) {
            let f = fs.fields[j];
            if (f.id !== parts[2]) {
              continue;
            }
            return [fs, f];
          }
        }
      };
      let [fieldset, field] = findField();
      let onlyIf = field['only_if'] || fieldset['only_if'];
      if (!onlyIf) {
        return false;
      }
      //get the paths for computed dependency
      let args = [];
      for (let path of Object.keys(onlyIf)) {
        args.push('form.'+'__data'+'.'+path);
      }

      //define the computed function
      let allPas = true;
      for (let path of Object.keys(onlyIf)) {
        let rule, operator, value, op;
        rule = onlyIf[path];
        [operator, value] = rule.split(':');

        path = '__data'+'.'+path;
        op = operators[operator];
        allPas = allPas && op(Ember.get(model, path), value);
      }
      return !allPas;
      //return !model.get(attribute+'__enabled');
    };
    return opts;
  }),
  rootPath: '__data',

  form: Ember.computed('fieldsets' ,'fieldsets.[]', function () {
    var validations, fieldsets, data, fieldPaths, form, iniData;
    validations = Ember.Object.create();
    fieldsets = this.get('fieldsets');
    if(!fieldsets) {
      return null;
    }
    validations = {};
    data = {};
    fieldPaths = [];

    fieldsets.forEach((fieldset) => {
      var setname;
      setname = fieldset.id;
      data[setname] = {};

      fieldset.fields.forEach((field) => {
        var vName, part, nameParts, fieldname;
        fieldname = field.id;
        part = data[setname];

        nameParts = fieldname.split('.');
        for (let partName of nameParts) {
          if (partName === nameParts[nameParts.length-1]) {
            continue;
          }
          part[partName] = part[partName] || {};
          part = part[partName];
        }

        vName = [this.rootPath,setname,fieldname].join('.');
        fieldPaths.push(vName);

        validations[vName] = Ember.get(field, 'validation_options') || {};
        validations[vName].validators = [];
        let paths = [];
        if (fieldset['only_if']) {
          for (let path of Object.keys(fieldset['only_if'])) {
            paths.push(this.rootPath+'.'+path);
          }
        }

        if (field['only_if']) {
          for (let path of Object.keys(field['only_if'])) {
            paths.push(this.rootPath+'.'+path);
          }
        }
        validations[vName].dependentKeys = paths;
        //validations[vName].dependentKeys = [this.rootPath + '.' + setname + '.' + fieldname + '__enabled'];

        for (let valid of Object.keys(field.validations || {})) {
          let v = validator(valid, field.validations[valid]);
          validations[vName].validators.push(v);
        }
      });
    });

    let ValidationsMixin = buildValidations(validations, this.get('_globalOptions'));

    iniData = this.get('iniData') || {};
    Ember.$.extend(true, data, iniData);
    var MyForm = Form.extend(ValidationsMixin, {
      fieldsets: fieldsets,
      fieldPaths: fieldPaths,
      rootPath: this.rootPath,
      form: this,
      __data: Ember.Object.create(data)
    });

    form = MyForm.create(Ember.getOwner(this).ownerInjection(), {});
    return form;
  }),

  actions: {
    onSubmit() {
      this.get('form').validate().then((m) => {
        if (Ember.get(m,'validations.isValid')) {
          this.attrs.onSubmit(this.get('form.data'));
        }
        this.set('form.didValidate', true);
      });
    },

    onChange(value, attrPath) {
      if (this.attrs.onChange) {
        this.attrs.onChange(this.get('form.data'), value, attrPath);
      }
    }
  }
});
