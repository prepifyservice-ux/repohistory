import { GroupMember, User } from 'bloxy/dist/structures';
import { robloxGroup, robloxClient } from '../main';
import { config } from '../config';
import axios from 'axios';

const checkActionEligibility = async (discordId: string, guildId: string, targetMember: GroupMember, rankingTo: number): Promise<boolean>  => {
    let robloxUser: User;
    try {
        // Use Bloxlink API to get Roblox user
        const response = await axios.get(`https://api.blox.link/v4/public/guilds/${config.bloxlinkGuildId}/discord-to-roblox/${discordId}`, {
            headers: {
                'Authorization': process.env.BLOXLINK_API_KEY,
            },
        });

        if (!response.data || !response.data.robloxID) {
            return false;
        }

        const robloxId = response.data.robloxID;
        robloxUser = await robloxClient.getUser(parseInt(robloxId));
    } catch (err) {
        console.error('Verification check failed - Bloxlink API error:', err);
        return false;
    }

    let robloxMember: GroupMember;
    try {
        robloxMember = await robloxGroup.getMember(robloxUser.id);
        if(!robloxMember) throw new Error();
    } catch (err) {
        return false;
    }

    if(robloxMember.role.rank <= targetMember.role.rank) return false;
    if(robloxMember.role.rank <= rankingTo) return false;
    if(robloxMember.id === targetMember.id) return false;
    return true;
}

export { checkActionEligibility };