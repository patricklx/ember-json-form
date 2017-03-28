import Ember from 'ember';

export function getOperators() {
  let operators = [];
  /*jshint undef: false, eqeqeq:false */
  operators['eq'] = function (a,b) {return String(a)==b; };
  operators['has'] = function (a,b) {return a && Ember.isArray(a) && (a.contains(b) || a.isAny('id', b));};
  operators['in'] = function (a,b) {return b && b.split && b.split(',').contains(String(a));};
  operators['not'] = function(a, b) {return a != b;};
  operators['has_not'] = function(a, b) {return a && Ember.isArray(a) && (!a.contains(b) && !a.isAny('id', b));};
  return operators;
}
