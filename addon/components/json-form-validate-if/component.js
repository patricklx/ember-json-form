import Ember from 'ember';
import template from './template';

export default Ember.Component.extend({
  layout: template,
  form: null,
  object: null,
  tagName: '',
  operators: {},

  _operators: Ember.computed(function () {
    var operators = this.get('operators');
    operators['eq'] = function (a,b) {return a==b; };
    operators['has'] = function (a,b) {return a && (a.contains(b) || a.isAny('id', b));};
    operators['in'] = function (a,b) {return b.split(',').contains(a);};
    return operators;
  }),

  init() {
    this._super();
    var root, onlyIf, path, form, object, args;
    form = this.get('form');
    object = this.get('object');

    root = form.rootPath;
    onlyIf = Ember.get(object, 'only_if');
    if (!onlyIf) {
      this.set('ifIsTrue', true);
      return;
    }

    //get the paths for computed dependency
    args = [];
    for (path of Object.keys(onlyIf)) {
      args.push('form.'+root+'.'+path);
    }

    //define the computed function
    args.push(function () {
      var root, onlyIf, path, form, object, allPas;
      form = this.get('form');
      object = this.get('object');
      root = form.rootPath;
      onlyIf = Ember.get(object, 'only_if');
      if (!onlyIf) return true;

      allPas = true;
      for (path of Object.keys(onlyIf)) {
        var rule, operator, value, op;
        rule = onlyIf[path];
        [operator, value] = rule.split(':');

        path = root+'.'+path;
        op = this.get('_operators.' + operator);
        allPas = allPas && op(Ember.get(form, path), value);
      }
      return allPas;
    });
    Ember.defineProperty(this, 'ifIsTrue', Ember.computed.apply(null, args))
  }
});
