import Joi, { ObjectSchema } from "joi";

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

export const validate = <T>(
  data: T,
  schema: ObjectSchema
): { value: T; error?: string } => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return { value, error: error.details.map((err:any) => err.message).join(", ") };
  }

  return { value };
};

export const eventValidationSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  date: Joi.date().required(),
  location: Joi.string().required(),
  time: Joi.string().required(),
  venue: Joi.string().required(),
  ticketType: Joi.string().required(), 
  socialMediaLinks: Joi.alternatives().try(
    Joi.object().optional(),
    Joi.string().optional()
  ),
  });

  export const updateEventValidationSchema = Joi.object({
    title: Joi.string().optional(),
    description: Joi.string().optional(),
    date: Joi.date().optional(),
    location: Joi.string().optional(),
    time: Joi.string().optional(),
    venue: Joi.string().optional(),
    image: Joi.string().optional(),
    gallery: Joi.array().items(Joi.string()).optional(),
    socialMediaLinks: Joi.alternatives()
      .try(Joi.object().optional(), Joi.string().optional())
      .optional(),
    ticketType: Joi.string().optional(),
  });


