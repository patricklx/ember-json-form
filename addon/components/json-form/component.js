import Ember from 'ember';
import {
  validator, buildValidations
} from 'ember-cp-validations';
import template from './template';

var Form = Ember.Object.extend({
  isFormInvalid: Ember.computed.not('validations.isValid'),
  fieldsets: null,
  fieldPaths: null,
  rootPath: null,
  __data: null,
  form: null,

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

  _globalOptions: Ember.computed('globalOptions', function () {
    var opts = this.get('globalOptions');
    opts.disabled = function disabled(model, attribute) {
      return !model.get(attribute+'__enabled');
    };
    return opts;
  }),
  rootPath: '__data',

  form: Ember.computed('fieldsets' ,'fieldsets.[]', function () {
    var validations, fieldsets, data, fieldPaths, form, iniData;
    validations = Ember.Object.create();
    fieldsets = this.get('fieldsets');
    if(!fieldsets) return null;
    validations = {};
    data = {};
    fieldPaths = [];

    fieldsets.forEach((fieldset) => {
      var setname;
      setname = fieldset.id;
      data[setname] = {};

      fieldset.fields.forEach((field) => {
        var vName, part, i, nameParts, fieldname;
        fieldname = field.id;
        part = data[setname];

        nameParts = fieldname.split('.');
        for (let partName of nameParts) {
          if (partName == nameParts[nameParts.length-1]) {
            continue;
          }
          part[partName] = part[partName] || {};
          part = part[partName];
        }

        vName = [this.rootPath,setname,fieldname].join('.');
        fieldPaths.push(vName);

        validations[vName] = Ember.get(field, 'validation_options') || {};
        validations[vName].validators = [];
        validations[vName].dependentKeys = [this.rootPath + '.' + setname + '.' + fieldname + '__enabled'];

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
      })
    },

    onChange(value) {
      if (this.attrs.onChange) {
        this.attrs.onChange(value, this.get('form.data'));
      }
    }
  }
});
