FROM grafana/k6
COPY test-script.js /test-script.js
ENTRYPOINT ["k6", "run", "/test-script.js"]
