import Joi,{ ObjectSchema } from "joi";

export const userRegistrationSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^\+?\d{10,15}$/)
    .required()
    .messages({
      "string.empty": "Phone number is required",
      "string.pattern.base": "Phone number must be 10-15 digits",
    }),
  fullName: Joi.string().min(3).max(50).required().messages({
    "string.empty": "Name is required",
    "string.min": "Name must be at least 3 characters",
    "string.max": "Name must be at most 50 characters",
  }),
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Email must be a valid email address",
  }),
  password: Joi.string().min(5).max(30).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 5 characters",
    "string.max": "Password must be at most 30 characters",
  }),
  profilePic: Joi.string().uri().allow(null).optional().messages({
    "string.uri": "Profile picture must be a valid URL",
  }),
  businessName: Joi.string().allow(null).optional().messages({
    "string.empty": "Business name cannot be empty",
  }),
  companyWebsite: Joi.string().uri().allow(null).optional().messages({
    "string.uri": "Company website must be a valid URL",
  }),
  address: Joi.string().allow(null).optional().messages({
    "string.empty": "Address cannot be empty",
  }),
  timezone: Joi.string().allow(null).optional().messages({
    "string.empty": "Timezone cannot be empty",
  }),
});

export const eventValidationSchema = Joi.object({
  title: Joi.string().min(3).max(255).required(),
  description: Joi.string().min(10).required(),
  date: Joi.date().iso().required(),
  location: Joi.string().min(3).max(255).required(),
  price: Joi.number().min(0).precision(2).required(),
  ticketType: Joi.string().valid("BASIC", "VIP").required(),
});

export const validate = <T>(data: T, schema: ObjectSchema): { value: T; error?: string } => {
  const { error, value } = schema.validate(data, { abortEarly: false, stripUnknown: true });
  
  if (error) {
    return { value, error: error.details.map((err) => err.message).join(", ") };
  }

  return { value };
};
