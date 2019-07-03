import { createValidator } from "validator-creator";
import {
  DBErrors,
  NotNullViolationError,
  UniqueViolationError
} from "objection-db-errors";
import ValidatorError from "./ValidatorError";

export default function Validator(Model) {
  const BaseModel = DBErrors(Model)
  return class extends BaseModel {
    static defaultAttributes = {};
    static rules = {};

    static query() {
      return super.query.apply(this, arguments).onError(error => {
        return Promise.reject(this.validatorErrorHandler(error));
      });
    }

    static validatorErrorHandler(error) {
      if (error instanceof NotNullViolationError) {
        const type = error.constructor.name;
        const prop = error.column;
        const validation = [{ type, prop }];
        return new ValidatorError(validation, `Not null violation error`);
      } else if (error instanceof UniqueViolationError) {
        const type = error.constructor.name;
        const validation = error.columns.map(prop => ({ type, prop }));
        return new ValidatorError(validation, `Unique violation error`);
      } else {
        return error;
      }
    }

    async $beforeInsert(opts) {
      await super.$beforeInsert(arguments);
      if (this.constructor.defaultAttributes) {
        this.$setJson({
          ...this.constructor.defaultAttributes,
          ...this.$toJson()
        });
      }
      await this.$validatorValidate(this.$toJson(), opts);
    }

    async $beforeUpdate(opts) {
      await super.$beforeUpdate(arguments);
      await this.$validatorValidate(this.$toJson(), opts);
    }

    async $validatorValidate(json, opts) {
      const rules =
        this.$beforeValidatorValidate(this.constructor.rules, json, opts) ||
        this.constructor.rules;
      const validate = createValidator(rules);
      const [validation] = await validate(this.$toJson());
      if (validation.length > 0) {
        throw new ValidatorError(
          validation,
          `Did not satisfy validator rules for ${this.constructor.name}`
        );
      }
      this.$afterValidatorValidate(json, opts);
    }

    $beforeValidatorValidate() {}
    $afterValidatorValidate() {}
  };
}
