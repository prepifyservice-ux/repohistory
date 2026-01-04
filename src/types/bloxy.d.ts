declare module 'bloxy' {
  export class Client {
    constructor(options?: any);
    user: any;
    apis: any;
    login(cookie?: string): Promise<any>;
    getUser(userId: number): Promise<any>;
    getGroup(groupId: number): Promise<any>;
    getUsersByUsernames(usernames: string[]): Promise<any>;
  }
}

declare module 'bloxy/dist/structures' {
  export class User {
    id: number;
    name: string;
    username?: string;
    getJoinRequestInGroup(groupId: number): Promise<any>;
    getPrimaryGroup(): Promise<any>;
  }

  export class PartialUser {
    id?: number;
    name?: string;
    getJoinRequestInGroup?(groupId: number): Promise<any>;
    getPrimaryGroup?(): Promise<any>;
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
    kickFromGroup(): Promise<any>;
  }

  export class GroupRole {
    id: number;
    name: string;
    rank: number;
  }

  export class GroupJoinRequest {
    requester: {
      userId: number;
      username: string;
    };
  }

  export class Group {
    id: number;
    name: string;
    updateMember(userId: number, roleId: number): Promise<any>;
    getJoinRequests(options?: any): Promise<any>;
    acceptJoinRequest(userId: number): Promise<any>;
    declineJoinRequest(userId: number): Promise<any>;
    getMember(userId: number): Promise<any>;
    getRoles(): Promise<any>;
    kickMember(userId: number): Promise<any>;
    updateShout(message: string): Promise<any>;
  }
}
