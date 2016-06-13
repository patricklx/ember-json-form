import Ember from 'ember';
import template from './template'

export default Ember.Component.extend({
  layout: template,
  normalTypes: ['text', 'number', 'email'],
  field: null,

  isGroup: Ember.computed('field.prefix', 'field.suffix', function () {
    return Boolean(this.get('field.prefix') || this.get('field.suffix'))
  }),

  isNormalInput: Ember.computed('field.type', function () {
    return this.normalTypes.indexOf(this.get('field.type')) >= 0;
  }),

  fieldComponent: Ember.computed('field.type', function () {
    return 'json-form/' + this.get('field.type');
  })
});
