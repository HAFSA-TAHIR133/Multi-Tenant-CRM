import Joi from 'joi';

const UserValidator = {
  signup: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.empty': 'Name is required',
        'string.min': 'Name must be at least 2 characters long'
      }),

    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'string.empty': 'Email is required'
      }),

    password: Joi.string()
      .min(6)
      .max(128)
      .required()
      .messages({
        'string.min': 'Password must be at least 6 characters long',
        'string.empty': 'Password is required'
      }),

    role: Joi.string()
      .valid('admin', 'user')
      .default('user')
  }),

  // You can add login schema later
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required()
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(6).max(128).required()
  })
};

export default UserValidator;