declare module 'bloxy' {
  export class Client {
    constructor(options?: any);
    login(cookie: string): Promise<any>;
    getUser(userId: number): Promise<any>;
    getGroup(groupId: number): Promise<any>;
  }
}

declare module 'bloxy/dist/structures' {
  export class User {
    id: number;
    name: string;
    username?: string;
  }

  export class PartialUser {
    id?: number;
    name?: string;
  }

  export class GroupMember {
    id: number;
    username: string;
    name?: string;
    role: {
      id: number;
      name: string;
      rank: number;
    };
  }

  export class Group {
    id: number;
    name: string;
    updateMember(userId: number, roleId: number): Promise<any>;
    getJoinRequests(): Promise<any>;
    acceptJoinRequest(userId: number): Promise<any>;
    declineJoinRequest(userId: number): Promise<any>;
  }
}
