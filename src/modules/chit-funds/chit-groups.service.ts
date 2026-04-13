// TODO: rewrite with Supabase
export const chitGroupsService = {
  async listChitGroups() {
    return [];
  },
  async countActiveGroups() {
    return 0;
  },
  async listOpenGroupsForEnrollment() {
    return [];
  },
  async getChitGroupDetail(_chitId: string) {
    return null;
  },
  async createChitGroup(_input: unknown, _actorId: string) {
    return { ok: true };
  },
  async enrollMember(_input: unknown, _actorId: string) {
    return { ok: true };
  },
};
