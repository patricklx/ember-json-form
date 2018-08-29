import Ember from 'ember';
import {
  validator, buildValidations
} from 'ember-cp-validations';
import template from './template';
import {getOperators} from 'ember-json-form/utils/functions';

let ValidationMixin = Ember.Mixin.create({
  operators: {},
  _operators: Ember.computed(function () {
    let operators = this.get('operators');
    let defaultOps = getOperators();

    for (let k in Object.keys(operators)) {
      defaultOps[k] = operators[k];
    }
    return defaultOps;
  }),

  _validator: Ember.computed('_operators', function () {
    let operators = this.get('_operators');
    return function(model, attribute)  {
      if (!model) return;
      let findFields = function () {
        let foundFields = [];

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
            foundFields.push([fs, f]);
          }
        }
        return foundFields;
      };
      let fields = findFields();
      for (let i=0; i<fields.length; i++) {
        let [fieldset, field] = fields[i];
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
        if (allPas) {
          return !allPas;
        }
      }
      return true;
    };
  })
});

var Form = Ember.Object.extend(ValidationMixin, {
  isFormInvalid: Ember.computed.not('validations.isValid'),
  fieldsets: null,
  fieldPaths: null,
  rootPath: null,
  __data: null,
  form: null,
  tmpData: null,

  init() {
    this._super(...arguments);
    this.set('tmpData', {});
  },

  setIniData: Ember.observer('iniData', function () {
    var path, iniData;
    iniData = this.get('iniData');
    this.set('tmpData', {});

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
    var data, serialized, path, validator;
    validator = this.get('_validator');
    data = this.get(this.rootPath);
    serialized = {};

    for (path of this.fieldPaths) {
      var part, pathObject;

      //create the paths
      pathObject = serialized;
      let parts = path.split('.');
      for (part of parts) {
        if (part === parts[parts.length-1]) {
          break;
        }
        if (!pathObject[part]) {
          pathObject[part] = {};
        }
        pathObject = pathObject[part];
      }
      //set the data
      if (!validator(this, path)) {
        Ember.set(serialized, path, this.get(path));
      }
    }
    return serialized[this.rootPath];
  }).volatile()
});

export default Ember.Component.extend(ValidationMixin, {
  layout: template,

  iniData: null,
  fieldsets: [],
  globalOptions: {},
  fieldsetsComponent: 'json-form-fieldsets',

  _globalOptions: Ember.computed('globalOptions', function () {
    var opts = this.get('globalOptions');
    return opts;
  }),
  rootPath: '__data',

  form: Ember.computed('fieldsets' ,'fieldsets.[]', function () {
    var validations, fieldsets, data, fieldPaths, form, iniData;
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

        const func = this.get('_validator');
        for (let valid of Object.keys(field.validations || {})) {
          if (typeof field.validations[valid] !== 'object') {
            field.validations[valid] = {[valid]: field.validations[valid]};
          }
          field.validations[valid].disabled = Ember.computed(function() {return func(this.model, vName)}).volatile();
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
