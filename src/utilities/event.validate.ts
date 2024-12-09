import Joi from "joi";

export const eventValidationSchema = Joi.object({
  title: Joi.string().min(3).max(255).required(),
  description: Joi.string().min(10).required(),
  date: Joi.date().iso().required(),
  location: Joi.string().min(3).max(255).required(),
  price: Joi.number().min(0).precision(2).required(),
  ticketType: Joi.string().valid("BASIC", "VIP").required(),
});
