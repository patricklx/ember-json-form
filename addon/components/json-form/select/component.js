import Ember from 'ember';
import template from './template';

export default Ember.Component.extend({
  layout: template,
  ajax: Ember.inject.service(),
  tagName: '',
  searchDelay: 500,
  allowClear: true,
  isInitialized: false,
  isInitializing: false,
  options: Ember.computed.alias('field.options'),
  addPrefixText: 'Add... ',

  init() {
    this._super();
    this.updateIniSelected();
  },

  updateIniSelected: Ember.observer('value', 'options.[]', 'form.iniData', function () {
    this.set('selected', this.getSelectedOptionsById());
  }),

  selectClassNames: Ember.computed('classNames.[]', function () {
    if (Ember.isArray(this.get('classNames'))) {
      return this.get('classNames').join(' ');
    }
    return this.get('classNames');
  }),


  hasIds: Ember.computed('options.firstObject.id', 'selected.firstObject.id', 'selected.id', function() {
    return this.get('options.firstObject.id') !== undefined ||
      this.get('selected.firstObject.id') !== undefined ||
      this.get('selected.id') !== undefined;
  }),

  searchEnabled: Ember.computed('field.search_enabled', 'options.length', function () {
    var initialize = this.get('field.initialize');
    var hasUrl = this.get('field.ask_server.url');
    var optionslen = this.get('options.length');
    var allow_add = this.get('field.allow_add');
    if ((!initialize && hasUrl) || (optionslen > 6) || allow_add) {
      return true;
    } else {
      return false;
    }
  }),

  getSelectedOptionsById() {
    var selected, value, options;
    value = this.get('value');
    if (value === undefined || value == null) {
      return null;
    }
    selected = value;
    options = this.get('field.options');
    if (!options || options.then) {
      return selected;
    }
    if( this.get('field.multiple') ){
      if (value && Ember.isArray(value)) {
        if (options) {
          if (this.get('hasIds')) {
            selected = value.map(function (item) {
              return options.findBy('id', item.id) || item;
            });
          }
        }
      }
    } else if (options) {
      if (this.get('hasIds')) {
        selected = options.findBy('id', Ember.get(value, 'id')) || selected;
      }
    }
    return selected;
  },

  runSearch: function (term, resolve, reject) {
    var data, params, key, url;
    if (Ember.isBlank(term)) { return []; }
    url = this.get('field.ask_server.url');
    data = {
      search: term
    };
    params = this.get('field.ask_server.params') || {};
    for(key of Object.keys(params)) {
      let value;
      value = params[key];
      data[key] = this.get('form').get(value) || value;
    }
    url = url.replace('{term}', term);
    params = this.get('field.ask_server.url_params') || {};
    for(key of Object.keys(params)) {
      url = url.replace(`{${key}}`, params[key]);
    }
    return this.get('ajax').request(url, {data:data}).then((json) => {
      let options = this.get('options') || [];
      var items = [];
      Array.prototype.push.apply(items, options);
      Array.prototype.push.apply(items, Ember.A(json.items));
      if (this.get('field.search_results_mapping')) {
        let mapping = this.get('field.search_results_mapping');
        items = items.map(function (item) {
          let newItem = {};
          for(let key of Object.keys(mapping)) {
            let newKey = mapping[key];
            newItem[newKey] = item[key];
          }
          return newItem;
        });
      }
      if (this.get('hasIds') && this.get('selected')) {
        if( this.get('field.multiple') ) {
          this.get('selected').forEach((item) => {
            var id = Ember.get(item, 'id');
            var obj = items.findBy('id', id);
            if (obj) {
              var i = items.indexOf(obj);
              items[i] = item;
            }
          });
        } else {
          var id = Ember.get(this.get('selected'), 'id');
          var obj = items.findBy('id', id);
          if (obj) {
            var i = items.indexOf(obj);
            items[i] = this.get('selected');
          }
        }
      }
      if (resolve) {
        resolve(items);
      }
      return items;
    });
  },

  actions: {
    onSelected(item) {
      var value;
      this.set('selected', item);
      if( this.get('field.multiple') && this.get('hasIds')){
        value = item.mapBy('id');
      } else if (item) {
        value = Ember.get(item, 'id') || item;
      }
      if (!value || value.length == 0) {
        item = undefined;
      }
      if (this.attrs.onChange) this.attrs.onChange(item);
    },

    onclose() {
      var item = this.get('selected');
      var value;
      if( item && this.get('field.multiple') && this.get('hasIds')){
        value = item.mapBy('id');
      } else if (item) {
        value = Ember.get(item, 'id') || item;
      }
      if (!value || value.length == 0) {
        item = undefined;
      }
      if (this.attrs.onChange) this.attrs.onChange(item);
    },

    searchUrl(term) {
      term = String(term).toLowerCase();
      let url = this.get('field.ask_server.url');
      if (!url || this.get('field.initialize')) {
        let options = this.get('options');
        return options.filter(function(item) {
          if (item.label) {
            return String(item.label).toLowerCase().indexOf(term) !== -1;
          }
          return String(item).toLowerCase().indexOf(term) !== -1;
        });
      }
      return new Ember.RSVP.Promise((resolve, reject) => {
        Ember.run.debounce(this, this.runSearch, term, resolve, reject, this.get('searchDelay'));
      });
    },

    handleFocus(select, e) {
      if (this.get('field.initialize') && !this.get('isInitialized') && !this.get('isInitializing')) {
        var p = this.runSearch('initialize');

        this.set('isInitializing', true);
        p.then((result) => {
          this.set('options', result);
          this.set('isInitialized', true);
        });
        p.finally(() => {
          this.set('isInitializing', false);
        });
      }
      //select.actions.open();
    },

    addOption(text) {
      if (this.get('field.allow_add')) {
        let options = this.get('options') || [];
        let index = options.indexOf(this.get('oldSearchTerm'));
        this.set('oldSearchTerm', text);
        if (index !== 0) {
          options.splice(0, 0, text);
        } else {
          options[0] = text;
        }
        this.set('options', options);
      }
    }
  }
});
