// TODO: rewrite with Supabase
export const membersService = {
  async listMembers() {
    return [];
  },
  async countActiveMembers() {
    return 0;
  },
  async listMemberOptions() {
    return [];
  },
  async findMemberById(_memberId: string) {
    return null;
  },
  async getMemberDetail(_memberId: string) {
    return null;
  },
  async createMember(_input: unknown, _actorId: string) {
    return { ok: true };
  },
};
