import Ember from 'ember';
import template from './template';

export default Ember.Component.extend({
  layout: template,
  tagName: '',

  _value: Ember.computed('value', function () {
    return this.get('value');
  }),

  actions: {

    onChange(value) {
      if (value === '') {
        value = undefined;
      }
      this.attrs.onChange(value);
    }
  }
});
