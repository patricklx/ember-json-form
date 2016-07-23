import Ember from 'ember';
import template from './template';

export default Ember.Component.extend({
  layout: template,
  ajax: Ember.inject.service(),
  tagName: '',

  stringValue: Ember.computed('value', function () {
    if (this.get('value') === 'string') {
      return this.get('value');
    }
    return null;
  }),

  init() {
    this._super();
    if (this.get('field.type') == 'file') {
      this.set('form.'+this.get('formPath'), '');
    }
  },

  actions: {
    onChange(value) {
      var file;
      if (value instanceof Ember.$.Event) {
        file = value ? value.target.files[0] : null;
        this.attrs.onChange(file);
      }
    }
  }
});
