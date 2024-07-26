self.addEventListener("install", (event) => {
  console.log("Service Worker installing.");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activating.");
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  if (event.data === "navigate") {
    console.log("Service Worker received navigate message.");
    self.clients.matchAll({ type: "window" }).then((clients) => {
      clients.forEach((client) => {
        if ("navigate" in client) {
          client
            .navigate("/security/badware/phishing.html")
            .then(() => {
              console.log("Navigation attempt to phishing page.");
            })
            .catch((error) => {
              console.error("Navigation failed:", error);
            });
        }
      });
    });
  } else if (event.data === "fetch") {
    console.log("Service Worker received fetch message.");
    fetch("https://bad.third-party.site/security/badware/phishing.html")
      .then((response) => {
        if (response.ok) {
          console.log("Phishing page fetched successfully.");
        } else {
          console.log("Failed to fetch phishing page.");
        }
      })
      .catch((error) => {
        console.error("Error fetching phishing page:", error);
      });
  } else {
    console.log("Service Worker received unknown message:", event.data);
  }
});