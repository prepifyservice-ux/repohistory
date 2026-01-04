import { TextChannel, User as DiscordUser } from 'discord.js';
import { GroupMember, PartialUser, User as RobloxUser } from 'bloxy/dist/structures';
import { discordClient } from '../main';
import { config } from '../config';
import { recordAction } from './abuseDetection';
import { sendComponentsV2Message, createTextDisplay, createContainer, createSeparator } from '../utils/componentsV2';

let componentsV2LogChannel: TextChannel;

const getLogChannels = async () => {
    // Components V2 log channel
    if(config.logChannels.componentsV2) {
        try {
            componentsV2LogChannel = await discordClient.channels.fetch(config.logChannels.componentsV2) as TextChannel;
        } catch (error) {
            console.error('Failed to fetch Components V2 log channel:', error);
        }
    }
}

const logAction = async (action: string, moderator: DiscordUser | RobloxUser | GroupMember | any, reason?: string, target?: RobloxUser | PartialUser, rankChange?: string, endDate?: Date, body?: string, xpChange?: string) => {
    if(moderator.id !== discordClient.user.id) recordAction(moderator);
    
    // Send to Components V2 log channel
    if(componentsV2LogChannel) {
        try {
            const moderatorName = moderator.username || moderator.tag || moderator.name || 'Unknown';
            const targetName = target ? (target.name || 'Unknown') : 'N/A';
            
            // Build inner components for the container
            const innerComponents = [];
            
            // Header
            innerComponents.push(createTextDisplay(`## 📋 ${action}`));
            
            // Separator
            innerComponents.push(createSeparator(1, true));
            
            // Content fields
            let contentText = `**Moderator:** ${moderatorName}`;
            if(target) contentText += `\n**Target:** ${targetName}`;
            if(reason) contentText += `\n**Reason:** ${reason}`;
            if(rankChange) contentText += `\n**Rank Change:** ${rankChange}`;
            if(xpChange) contentText += `\n**XP Change:** ${xpChange}`;
            if(endDate) contentText += `\n**End Date:** ${endDate.toLocaleString()}`;
            if(body) contentText += `\n**Details:** ${body}`;
            
            innerComponents.push(createTextDisplay(contentText));
            
            // Separator before timestamp
            innerComponents.push(createSeparator(1, true));
            
            // Timestamp
            innerComponents.push(createTextDisplay(`-# <t:${Math.floor(Date.now() / 1000)}:F>`));
            
            // Wrap in Container (no accent color)
            const container = createContainer(innerComponents);
            
            await sendComponentsV2Message(componentsV2LogChannel, [container]);
        } catch (error) {
            console.error('Failed to send Components V2 log:', error);
        }
    }
}

export { logAction, getLogChannels };