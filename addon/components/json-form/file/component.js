import Ember from 'ember';
import template from './template';

export default Ember.Component.extend({
  layout: template,
  ajax: Ember.inject.service(),
  tagName: '',

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
