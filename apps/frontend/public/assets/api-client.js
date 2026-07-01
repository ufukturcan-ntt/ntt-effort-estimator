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
      let parsedMessage = message;
      try {
        parsedMessage = JSON.parse(message).error || message;
      } catch (_error) {}
      throw new Error(parsedMessage || `API error ${response.status}`);
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
  submitOffer(id, userId) {
    return this.request(`/api/offers/${encodeURIComponent(id)}/submit`, {
      method: "POST",
      body: JSON.stringify({ userId })
    });
  },
  pendingApprovalOffers(approverUserId) {
    return this.request(`/api/offers/pending-approval?approverUserId=${encodeURIComponent(approverUserId)}`);
  },
  approveOffer(id, approverUserId) {
    return this.request(`/api/offers/${encodeURIComponent(id)}/approve`, {
      method: "POST",
      body: JSON.stringify({ approverUserId })
    });
  },
  deleteOffer(id) {
    return this.request(`/api/offers/${encodeURIComponent(id)}`, { method: "DELETE" });
  },
  adminData(userId) {
    return this.request(`/api/admin?userId=${encodeURIComponent(userId || "")}`);
  },
  saveAdminEntity(entity, payload, adminUserId) {
    return this.request(`/api/admin/${encodeURIComponent(entity)}?adminUserId=${encodeURIComponent(adminUserId || "")}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  },
  pendingUsers(adminUserId) {
    return this.request(`/api/admin/users/pending?adminUserId=${encodeURIComponent(adminUserId)}`);
  },
  adminUsers(adminUserId) {
    return this.request(`/api/admin/users?adminUserId=${encodeURIComponent(adminUserId)}`);
  },
  updateUserRole(id, role, adminUserId) {
    return this.request(`/api/admin/users/${encodeURIComponent(id)}/role`, {
      method: "PUT",
      body: JSON.stringify({ role, adminUserId })
    });
  },
  approveUser(id, adminUserId) {
    return this.request(`/api/admin/users/${encodeURIComponent(id)}/approve`, {
      method: "POST",
      body: JSON.stringify({ adminUserId })
    });
  }
};
