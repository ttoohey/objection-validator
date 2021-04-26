import { createValidator } from "validator-creator";
import {
  DBErrors,
  NotNullViolationError,
  UniqueViolationError
} from "objection-db-errors";
import ValidatorError from "./ValidatorError";

export default function Validator(Model) {
  const BaseModel = DBErrors(Model);
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

    async $beforeInsert(queryContext) {
      await super.$beforeInsert(queryContext);
      if (this.constructor.defaultAttributes) {
        this.$setJson({
          ...this.constructor.defaultAttributes,
          ...this.$toJson()
        });
      }
      await this.$validatorValidate(this.$toJson(), null, queryContext);
    }

    async $beforeUpdate(opt, queryContext) {
      await super.$beforeUpdate(opt, queryContext);
      await this.$validatorValidate(this.$toJson(), opt, queryContext);
    }

    async $validatorValidate(json, opt, queryContext) {
      const rules =
        this.$beforeValidatorValidate(
          this.constructor.rules,
          json,
          opt,
          queryContext
        ) || this.constructor.rules;
      const validate = createValidator(rules);
      json = this.$toJson();
      const jsonFormatted = this.$formatJson(json);
      const [validation] = await validate(jsonFormatted);
      if (validation.length > 0) {
        throw new ValidatorError(
          validation,
          `Did not satisfy validator rules for ${this.constructor.name}`
        );
      }
      this.$afterValidatorValidate(json, opt, queryContext);
    }

    $beforeValidatorValidate() {}
    $afterValidatorValidate() {}
  };
}
