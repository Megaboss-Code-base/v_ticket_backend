import { ObjectSchema } from "joi";

export const validate = <T>(data: T, schema: ObjectSchema): { value: T; error?: string } => {
  const { error, value } = schema.validate(data, { abortEarly: false, stripUnknown: true });
  
  if (error) {
    return { value, error: error.details.map((err) => err.message).join(", ") };
  }

  return { value };
};
