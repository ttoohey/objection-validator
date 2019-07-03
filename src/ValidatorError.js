class ValidatorError extends Error {
  constructor(validation, ...params) {
    super(...params)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidatorError);
    }
    this.name = this.constructor.name;
    this.validation = validation;
  }
}

export default ValidatorError
