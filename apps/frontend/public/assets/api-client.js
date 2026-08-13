window.EffortApi = {
  async request(path, options = {}) {
    const baseUrl = window.APP_CONFIG?.API_BASE_URL || "";
    const accessToken = sessionStorage.getItem("effortAccessToken") || "";
    const response = await fetch(`${baseUrl}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
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
    return this.request("/api/login", { method: "POST", body: JSON.stringify(payload) })
      .then(user => {
        if (user.access_token) sessionStorage.setItem("effortAccessToken", user.access_token);
        return user;
      });
  },
  me() {
    return this.request("/api/me");
  },
  logout() {
    sessionStorage.removeItem("effortAccessToken");
  },
  register(payload) {
    return this.request("/api/register", { method: "POST", body: JSON.stringify(payload) });
  },
  changePassword(currentPassword, newPassword) {
    return this.request("/api/account/password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword })
    });
  },
  translate(texts, targetLang = "EN-US", sourceLang = "TR") {
    return this.request("/api/translate", {
      method: "POST",
      body: JSON.stringify({ texts, targetLang, sourceLang })
    });
  },
  listOffers() {
    return this.request("/api/offers");
  },
  getOffer(id) {
    return this.request(`/api/offers/${encodeURIComponent(id)}`);
  },
  saveOffer(payload) {
    return this.request("/api/offers", { method: "POST", body: JSON.stringify(payload) });
  },
  updateOffer(id, payload) {
    const expectedUpdatedAt = payload?.expectedUpdatedAt || "";
    return this.request(`/api/offers/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: expectedUpdatedAt ? { "If-Match": expectedUpdatedAt } : {},
      body: JSON.stringify(payload)
    });
  },
  submitOffer(id) {
    return this.request(`/api/offers/${encodeURIComponent(id)}/submit`, {
      method: "POST"
    });
  },
  pendingApprovalOffers() {
    return this.request("/api/offers/pending-approval");
  },
  approveOffer(id) {
    return this.request(`/api/offers/${encodeURIComponent(id)}/approve`, {
      method: "POST"
    });
  },
  deleteOffer(id, expectedUpdatedAt = "") {
    const query = expectedUpdatedAt ? `?expectedUpdatedAt=${encodeURIComponent(expectedUpdatedAt)}` : "";
    return this.request(`/api/offers/${encodeURIComponent(id)}${query}`, { method: "DELETE" });
  },
  adminData() {
    return this.request("/api/admin");
  },
  saveAdminEntity(entity, payload, expectedUpdatedAt = "") {
    return this.request(`/api/admin/${encodeURIComponent(entity)}`, {
      method: "PUT",
      headers: expectedUpdatedAt ? { "If-Match": expectedUpdatedAt } : {},
      body: JSON.stringify(payload)
    });
  },
  saveAdminConfig(config, versions = {}) {
    const payload = config?.__meta ? config : { ...config, __meta: { versions } };
    const requestPayload = body => this.request("/api/admin/config", {
      method: "PUT",
      body: JSON.stringify(body)
    });
    return requestPayload(payload).catch(error => {
      if (!String(error.message || "").includes("unsupported entity") || !payload.questionFieldOptions) throw error;
      const compatibleEntities = [
        "projectDefinitions", "moduleCatalog", "scopeQuestions", "developmentQuestions",
        "libraryItems", "questionFieldOptions", "restrictions", "fixedDays",
        "sizeRanges", "scopeSizeImpacts", "effortPhases", "localizationEfforts", "variableModulePhase", "approvalSettings"
      ].filter(entity => Object.prototype.hasOwnProperty.call(payload, entity));
      return Promise.all(compatibleEntities.map(entity => {
        const expectedVersion = payload.__meta?.versions?.[entity] || "";
        return this.saveAdminEntity(entity, payload[entity], expectedVersion);
      }));
    });
  },
  pendingUsers() {
    return this.request("/api/admin/users/pending");
  },
  adminUsers() {
    return this.request("/api/admin/users");
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
