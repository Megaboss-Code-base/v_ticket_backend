import axios from "axios";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const BASE_URL2 = "https://api.paystack.co";

export const initializePayment = async (payload: {
  amount: number;
  email: string;
  reference: string;
  callback_url: string;
}) => {
  try {
    const response = await axios.post(
      `${BASE_URL2}/transaction/initialize`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Payment initialization failed");
  }
};

export const verifyPayment = async (reference: string) => {
  try {
    const response = await axios.get(`${BASE_URL2}/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Payment verification failed");
  }
};

