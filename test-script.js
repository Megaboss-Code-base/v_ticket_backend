import http from "k6/http";
import { sleep } from "k6";

export let options = {
  stages: [
    { duration: "2m", target: 1000 }, // Ramp-up to 1000 users in 2 minutes
    { duration: "3m", target: 3000 }, // Increase to 3000 users in 3 minutes
    { duration: "5m", target: 7000 }, // Peak at 7000 users for 5 minutes
    { duration: "3m", target: 3000 }, // Decrease to 3000 users in 3 minutes
    { duration: "2m", target: 0 }, // Cooldown to 0 users in 2 minutes
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests should complete within 500ms
    http_req_failed: ["rate<0.01"], // Less than 1% of requests should fail
  },
};

export default function () {
  let res = http.get("http://host.docker.internal:8768/api/v1/events/all-events");
  sleep(1); // Simulate user wait time before next request
}