import Ember from 'ember';
import template from './template';

export default Ember.Component.extend({
  layout: template,
  tagName: '',
  normalTypes: ['text', 'number', 'email'],

  field: null,
  fieldsetName: null,

  name: Ember.computed.alias('field.id'),

  init() {
    let path;
    this._super();
    path = this.get('formPath');
    Ember.defineProperty(this, "validation", Ember.computed.oneWay("form.validations.attrs." + path));
    Ember.defineProperty(this, "hasContent", Ember.computed(`form.${this.formPath}`, function () {
      if (!this._hadContent) {
        this._hadContent = this.get(`form.${this.formPath}`) !== undefined;
      }
      return this._hadContent;
    }));
  },

  tmpValue: Ember.computed('form.tmpData', {
    get() {
      let path = this.get('formPath');
      path = path.replace(/\./g, '_');
      return this.get('form.tmpData.' + path);
    },
    set(key, val) {
      let path = this.get('formPath');
      path = path.replace(/\./g, '_');
      this.set('form.tmpData.' + path, val);
      return val;
    }
  }),

  form: Ember.computed({
    set(key, val, cache) {
      if (val !== cache && cache) {
        this.set('tmpValue', undefined);
      }
      return val;
    },
    get() {
      return null;
    }
  }),

  iniData: Ember.computed('form.iniData', {
    get() {
      if (this.get('tmpValue') !== undefined) {
        return this.get('tmpValue');
      }
      return this.get('form.iniData.' + this.get('formPath'));
    },
    set() {}
  }),

  formPath: Ember.computed('fieldsetName', 'name', function () {
    return [this.get('form.rootPath'),this.get('fieldsetName'),this.get('name')].join('.');
  }),

  showMessage: Ember.computed('hasContent', 'validation.isInvalid', function(){
    return this.validation.isInvalid && this.hasContent;
  }),

  isGroup: Ember.computed('field.addon.prefix', 'field.addon.suffix', function () {
    return Boolean(this.get('field.addon.prefix') || this.get('field.addon.suffix'));
  }),

  isNormalInput: Ember.computed('field.type', function () {
    return this.normalTypes.indexOf(this.get('field.type')) >= 0;
  }),

  fieldComponent: Ember.computed('field.type', function () {
    if (this.get('isNormalInput')) {
      return 'json-form/input';
    }
    return 'json-form/' + this.get('field.type');
  }),

  createPath(data, path) {
    let parts;
    parts = path.split('.').slice(0, -1);
    parts.forEach(function (item) {
      if (!Ember.get(data, item)) {
        Ember.set(data, item, {});
      }
      data = Ember.get(data, item);
    });
  },

  setValue(value) {
    if (this.get('isDestroyed')) {
      return;
    }
    // this.createPath(this.get('form.iniData'), this.get('formPath'));
    // this.set('form.iniData.'+this.get('formPath'), value);

    this.set('form.'+this.get('formPath'), value);
    if (this.onChange) {
      this.onChange(value, this.get('formPath').replace('__data', ''));
    }
  },

  didInsertElement() {
    this._super();
    let validation;
    validation = this.get('validation');
    if (!validation) {
      return;
    }
    Ember.run.next(this, function () {
      if (this.get('form.' + validation.attribute) === '') {
        this.set('form.' + validation.attribute, undefined);
      }
      this.set('form.' + validation.attribute + '__enabled', true);
    });
  },

  willDestroyElement() {
    this._super();
    let form = this.get('form');
    let validation = this.get('validation');
    if (!validation) {
      return;
    }
    this.set('tmpValue', this.get('form.'+this.get('formPath')));
    Ember.run.next(this, function () {
      form.set(validation.attribute + '__enabled', false);
    });
  },

  actions: {
    onChange(value) {
      if (value instanceof Ember.$.Event) {
        value = value.target.value;
      }
      //had some issues when I wanted to click somewhere the controls jumped to other positions
      //and the the click went nowhere, this fixes it
      Ember.run.debounce(this, this.setValue, value, 100);
    }
  }
});
