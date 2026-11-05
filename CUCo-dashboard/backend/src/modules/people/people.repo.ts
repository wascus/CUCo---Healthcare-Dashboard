import type { Person, Edge } from "./people.model";

const PEOPLE = new Map<string, Person>();
const EDGES: Edge[] = [];

(function seed() {
  if (PEOPLE.size) return;

  const a: Person = { id: "u1", fullName: "Alex Cohen", role: "individual", email: "alex@example.com", tags: ["pilot"] };
  const b: Person = { id: "u2", fullName: "Maya Levi", role: "friend", email: "maya@example.com" };
  const c: Person = { id: "u3", fullName: "Dr. Amir Ben-David", role: "doctor", email: "amir@example.com" };
  const d: Person = { id: "u4", fullName: "Noa Shapiro", role: "acquaintance" };

  [a, b, c, d].forEach((p) => PEOPLE.set(p.id, p));

  EDGES.push(
    { from: "u1", to: "u2", type: "friend", strength: 0.9 },
    { from: "u1", to: "u3", type: "doctor", strength: 0.8 },
    { from: "u1", to: "u4", type: "acquaintance", strength: 0.4 },
  );
})();

export const peopleRepo = {
  async list(params?: { search?: string; limit?: number; offset?: number }) {
    const search = params?.search?.toLowerCase().trim();
    let rows = Array.from(PEOPLE.values());
    if (search) {
      rows = rows.filter((p) =>
        p.fullName.toLowerCase().includes(search) ||
        p.email?.toLowerCase().includes(search) ||
        p.tags?.some((t) => t.toLowerCase().includes(search))
      );
    }
    const total = rows.length;
    const offset = Math.max(0, params?.offset ?? 0);
    const limit = Math.min(100, Math.max(1, params?.limit ?? 20));
    const items = rows.slice(offset, offset + limit);
    return { items, total, limit, offset };
  },

  async getById(id: string) {
    return PEOPLE.get(id) ?? null;
  },

  async getRelationsOf(id: string) {
    // ego network: edges where 'from' or 'to' is this user
    const edges = EDGES.filter((e) => e.from === id || e.to === id);
    const nodeIds = new Set<string>([id]);
    edges.forEach((e) => { nodeIds.add(e.from); nodeIds.add(e.to); });
    const nodes = Array.from(nodeIds)
      .map((nid) => PEOPLE.get(nid))
      .filter((p): p is Person => !!p);
    return { personId: id, nodes, edges };
  },
};
