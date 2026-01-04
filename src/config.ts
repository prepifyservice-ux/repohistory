import { ActivityType } from 'discord.js';
import { BotConfig } from './structures/types'; 

export const config: BotConfig = {
    groupId: 116443775, // Replace with your Roblox group ID
    slashCommands: true,
    legacyCommands: {
        enabled: true,
        prefixes: ['q!'],
    },
    permissions: {
        all: ['1451735840811384973'],
        ranking: [''],
        users: [''],
        shout: [''],
        join: [''],
        signal: [''],
        admin: [''],
    },
    logChannels: {
        actions: '1451736001029341257',
        shout: '1451736001029341257',
        componentsV2: '1451736001029341257',
    },
    api: false,
    maximumRank: 255,
    verificationChecks: true,
    bloxlinkGuildId: '1426119038282502226',
    firedRank: 1,
    suspendedRank: 1,
    recordManualActions: true,
    memberCount: {
        enabled: false,
        channelId: '',
        milestone: 100,
        onlyMilestones: false,
    },
    xpSystem: {
        enabled: false,
        autoRankup: false,
        roles: [],
    },
    antiAbuse: {
        enabled: false,
        clearDuration: 1 * 60,
        threshold: 10,
        demotionRank: 1,
    },
    activity: {
        enabled: false,
        type: ActivityType.Watching,
        value: 'for commands.',
    },
    status: 'online',
    deleteWallURLs: false,
    planka: {
        url: process.env.PLANKA_URL || 'http://localhost:1337',
        adminUsername: process.env.PLANKA_ADMIN_USERNAME || 'admin',
        adminPassword: process.env.PLANKA_ADMIN_PASSWORD || 'admin',
    },
}
