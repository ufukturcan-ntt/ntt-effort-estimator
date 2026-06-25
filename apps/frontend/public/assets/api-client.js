window.EffortApi = {
  async request(path, options = {}) {
    const baseUrl = window.APP_CONFIG?.API_BASE_URL || "";
    const response = await fetch(`${baseUrl}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      ...options
    });
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `API error ${response.status}`);
    }
    return response.status === 204 ? null : response.json();
  },
  login(payload) {
    return this.request("/api/login", { method: "POST", body: JSON.stringify(payload) });
  },
  register(payload) {
    return this.request("/api/register", { method: "POST", body: JSON.stringify(payload) });
  },
  listOffers(userId) {
    return this.request(`/api/offers?userId=${encodeURIComponent(userId)}`);
  },
  getOffer(id) {
    return this.request(`/api/offers/${encodeURIComponent(id)}`);
  },
  saveOffer(payload) {
    return this.request("/api/offers", { method: "POST", body: JSON.stringify(payload) });
  },
  updateOffer(id, payload) {
    return this.request(`/api/offers/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(payload) });
  },
  deleteOffer(id) {
    return this.request(`/api/offers/${encodeURIComponent(id)}`, { method: "DELETE" });
  },
  adminData() {
    return this.request("/api/admin");
  },
  pendingUsers(adminUserId) {
    return this.request(`/api/admin/users/pending?adminUserId=${encodeURIComponent(adminUserId)}`);
  },
  approveUser(id, adminUserId) {
    return this.request(`/api/admin/users/${encodeURIComponent(id)}/approve`, {
      method: "POST",
      body: JSON.stringify({ adminUserId })
    });
  }
};
