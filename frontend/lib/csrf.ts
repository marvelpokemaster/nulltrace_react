const API = ""; // Proxy handles routing

// Fetches the CSRF token from Flask and stores it in sessionStorage
export async function fetchCSRFToken() {
  try {
    const res = await fetch(`${API}/api/csrf-token`, {
      credentials: "include" // Important to establish the session cookie
    });
    if (res.ok) {
      const data = await res.json();
      if (data.csrf_token) {
        sessionStorage.setItem("csrf_token", data.csrf_token);
      }
    }
  } catch (error) {
    console.error("Failed to fetch CSRF token:", error);
  }
}

// A fetch wrapper that automatically includes the CSRF token in headers
// and ensures credentials (cookies) are sent with every request
export async function fetchWithCSRF(url: string, options: RequestInit = {}) {
  const opts: RequestInit = {
    ...options,
    credentials: "include",
    headers: { ...options.headers } as Record<string, string>,
  };

  // Attach JWT token if available
  const jwt = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (jwt) {
    (opts.headers as Record<string, string>)["Authorization"] = `Bearer ${jwt}`;
  }

  const method = opts.method?.toUpperCase() || "GET";
  if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    let token = sessionStorage.getItem("csrf_token");
    
    if (!token) {
      await fetchCSRFToken();
      token = sessionStorage.getItem("csrf_token");
    }

    (opts.headers as Record<string, string>)["X-CSRFToken"] = token || "";
  }

  return fetch(url, opts);
}
