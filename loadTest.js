import http from "k6/http";
import { check, sleep } from "k6";

// Load test configuration
export const options = {
  stages: [
    { duration: "30s", target: 1000 }, // Ramp up to 10 users over 10 seconds
    { duration: "40s", target: 2500 }, // Stay at 50 users for 30 seconds
    { duration: "30s", target: 0 }, // Ramp down to 0 users over 10 seconds
  ],
};

export default function () {
  // const BASE_URL = "http://127.0.0.1:8768/api/v1";
  const BASE_URL = "https://v-ticket.onrender.com/api/v1"; // Change to your backend URL

  // Example of testing event listing API
  const res = http.get(`${BASE_URL}/events/all-events`);
  //   const res = http.get(`${BASE_URL}/events`);

  // Check if the response status is 200
  // check(res, {
  //   "is status 200": (r) => r.status === 200,
  // });
  check(res, {
    "status is 200": (r) => r.status === 200,
    "response time is below 1s": (r) => r.timings.duration < 1000,
  });

  sleep(1); // Wait 1 second before the next request
}
// import { check } from "k6";
// import http from "k6/http";

// export default function () {
//   const res = http.get("https://v-ticket.onrender.com/api/v1/events/all-events");

//   check(res, {
//     "status is 200": (r) => r.status === 200,
//     "response time is below 1s": (r) => r.timings.duration < 1000,
//   });
// }
