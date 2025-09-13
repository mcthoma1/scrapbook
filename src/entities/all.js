// Central exports for all entity helpers used throughout the app.
// These helpers use localStorage as a simple mock backend so the UI can
// operate without a real API. Each entity exposes basic CRUD methods and
// an optional `filter` helper that accepts a criteria object.

function createEntityStore(storageKey) {
  const load = () => {
    if (typeof localStorage === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  };

  const save = (data) => {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(storageKey, JSON.stringify(data));
  };

  const sortData = (data, sortBy) => {
    if (!sortBy) return data;
    const direction = sortBy.startsWith("-") ? -1 : 1;
    const key = sortBy.replace(/^[-+]/, "");
    return [...data].sort((a, b) => {
      if (a[key] < b[key]) return -1 * direction;
      if (a[key] > b[key]) return 1 * direction;
      return 0;
    });
  };

  return {
    async list(sortBy) {
      const data = load();
      return sortData(data, sortBy);
    },

    async filter(criteria = {}, sortBy) {
      const data = load().filter((item) =>
        Object.entries(criteria).every(([k, v]) => item[k] === v)
      );
      return sortData(data, sortBy);
    },

    async create(data) {
      const record = {
        id: globalThis.crypto?.randomUUID
          ? globalThis.crypto.randomUUID()
          : String(Date.now()),
        created_date: new Date().toISOString(),
        ...data,
      };
      const items = load();
      items.push(record);
      save(items);
      return record;
    },

    async update(id, updates) {
      const items = load();
      const index = items.findIndex((i) => i.id === id);
      if (index === -1) return null;
      items[index] = { ...items[index], ...updates };
      save(items);
      return items[index];
    },

    async delete(id) {
      const items = load().filter((i) => i.id !== id);
      save(items);
    },
  };
}

const Album = createEntityStore("albums");
const AlbumMembership = createEntityStore("albumMemberships");
const Memory = createEntityStore("memories");
const Comment = createEntityStore("comments");
const Reaction = createEntityStore("reactions");

const userStore = createEntityStore("users");
const User = {
  ...userStore,

  async me() {
    const stored =
      typeof localStorage !== "undefined" &&
      localStorage.getItem("currentUser");
    if (stored) return JSON.parse(stored);

    // If no user is stored, create a demo user
    const demoUser = await userStore.create({
      email: "demo@example.com",
      full_name: "Demo User",
    });
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("currentUser", JSON.stringify(demoUser));
    }
    return demoUser;
  },

  async updateMyUserData(data) {
    const current = await this.me();
    const updated = await this.update(current.id, data);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("currentUser", JSON.stringify(updated));
    }
    return updated;
  },

  async login() {
    return this.me();
  },

  async logout() {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("currentUser");
    }
  },
};

export { Album, AlbumMembership, Memory, Comment, Reaction, User };
export default { Album, AlbumMembership, Memory, Comment, Reaction, User };

