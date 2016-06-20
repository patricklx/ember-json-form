import Ember from 'ember';
import template from './template';

export default Ember.Component.extend({
  layout: template,
  fieldsComponent: 'json-form-fields'
});

