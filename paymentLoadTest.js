// import http from "k6/http";
// import { check, sleep } from "k6";

// export const options = {
//   stages: [
//     { duration: "10s", target: 2000 }, // Ramp up to 2000 users in 10s
//     { duration: "20s", target: 8000 }, // Stay at 8000 users for 20s
//     { duration: "10s", target: 0 }, // Ramp down to 0 users in 10s
//   ],
//   thresholds: {
//     http_req_duration: ["p(95)<500"], // 95% of requests should be < 500ms
//   },
// };

// export default function () {
//   const BASE_URL = "https://v-ticket.onrender.com/api/v1"; // Change to your backend URL
//   // const BASE_URL = "http://127.0.0.1:8768/api/v1";

//   // Ensure FLUTTERWAVE_SECRET_KEY is set as an environment variable
//   if (!process.env.FLUTTERWAVE_SECRET_KEY) {
//     console.error("Error: FLUTTERWAVE_SECRET_KEY is not set");
//     throw new Error("FLUTTERWAVE_SECRET_KEY is required");
//   }

//   const payload = JSON.stringify({
//     ticketType: "VIP",
//     currency: "NGN",
//     email: "Jabu@example.com",
//     phone: "9234567890",
//     fullName: "Jabu Ticket",
//     quantity: 3,
//     attendees: [
//       { name: "ff Adau", email: "ff@example.com" },
//       { name: "cut visit", email: "visit@example.com" },
//     ],
//   });

//   const params = {
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`, // Use environment variable
//     },
//   };

//   const res = http.post(`${BASE_URL}/payment/create-payment-link/1a11b1b1-c20e-46f1-bb2e-bf53ae85a276`, payload, params);

//   check(res, {
//     "Payment processed successfully": (r) => r.status === 201,
//     "Response time < 500ms": (r) => r.timings.duration < 500,
//   });

//   sleep(1); // Simulate real user behavior
// }

import http from "k6/http";
import { check, sleep } from "k6";

// Load test configuration
export const options = {
  stages: [
  //   { duration: "20s", target: 2500 }, // Ramp up to 10 users over 10 seconds
  //   { duration: "30s", target: 5000 }, // Stay at 50 users for 30 seconds
  //   { duration: "20s", target: 2500 }, // Stay at 50 users for 30 seconds
  //   { duration: "20s", target: 0 },// Ramp down to 0 users over 10 seconds
  // ],
  { duration: "30s", target: 2500 }, // Ramp up to 10 users over 10 seconds
  { duration: "40s", target: 5000 }, // Stay at 50 users for 30 seconds
  { duration: "30s", target: 0 }, // Ramp down to 0 users over 10 seconds
],
};

export default function () {
  // const BASE_URL = "http://127.0.0.1:8768/api/v1";
  const BASE_URL = "https://v-ticket-backend.onrender.com/api/v1";

  // Example of testing event listing API
  const res = http.get(`${BASE_URL}/events/all-events`);

  check(res, {
    "status is 200": (r) => r.status === 200,
    "response time is below 1s": (r) => r.timings.duration < 1000,
  });

  sleep(1); // Wait 1 second before the next request
}

