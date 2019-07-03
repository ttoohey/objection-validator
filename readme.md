# validator-creator plugin for Objection.js

This is an [Objection.js](https://vincit.github.io/objection.js/) model mixin
plugin that provides an alternate system for validation.

Validation is configured using rule collections from
[validator-creator](https://github.com/ttoohey/validator-creator).

## class Validator:

Validator is a [class mixin](https://vincit.github.io/objection.js/guide/plugins.html#_3rd-party-plugins)

```js
// Person.js
import { Model } from "objection";
import { Validator } from "objection-validator";
import { required, email } from "./rules";

class Person extends Validator(Model) {
  static tablename = "person";

  static rules = {
    name: [required],
    email: [required, email]
  };

  static defaultAttributes = {
    // force 'required' rule to apply during insert() even if not provided
    name: ""
  };
}
```

## API

#### `static rules`

A [validator-creator](https://github.com/ttoohey/validator-creator) _rules collection_ that lists the validation rules to
apply to each field.

#### `static defaultAttributes`

Set default values for model attributes during an insert. This is a useful way
to ensure the attribute is validated even if not supplied.

#### `$beforeValidatorValidate(rules, json, opts)`

Before validation hook. Allows modifying the `rules` object before processing.

Return `rules` or `undefined` to make no change.

Return a new rule collection object to alter the rules.

#### `$afterValidatorValidate(json, opts)`

After validation hook

#### `$validatorValidate(json, opts)`

Called automatically from `Model.$beforeInsert()` and `Model.$beforeUpdate()`

## class ValidatorError

If validation fails a ValidatorError exception is thrown.

```js
import { ValidatorError } from "objection-validator";
try {
  await Person.query().insert({ name: "" });
} catch (error) {
  if (error instanceof ValidatorError) {
    // --> error.validation: [ {type: "required", prop: "title" }]
  }
}
```
