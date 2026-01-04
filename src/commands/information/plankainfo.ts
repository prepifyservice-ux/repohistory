import { discordClient, robloxClient } from '../../main';
import { CommandContext } from '../../structures/addons/CommandAddons';
import { Command } from '../../structures/Command';
import { config } from '../../config';
import axios from 'axios';
import { InteractionReplyOptions, CommandInteraction } from 'discord.js';
import crypto from 'crypto';

class PlankaInfoCommand extends Command {
    constructor() {
        super({
            trigger: 'plankainfo',
            description: 'Get your Planka account credentials or create a new one.',
            type: 'ChatInput',
            module: 'information',
            permissions: [
                {
                    type: 'role',
                    ids: config.permissions.admin,
                    value: true,
                }
            ]
        });
    }

    private async getRobloxUserFromBloxlink(discordId: string): Promise<{ id: number; name: string } | null> {
        try {
            // First get the Roblox ID
            const response = await axios.get(`https://api.blox.link/v4/public/guilds/${config.bloxlinkGuildId}/discord-to-roblox/${discordId}`, {
                headers: {
                    'Authorization': process.env.BLOXLINK_API_KEY,
                },
            });

            if (response.data && response.data.robloxID) {
                const robloxId = response.data.robloxID;
                
                // Get the Roblox username using the ID
                try {
                    const robloxUser = await robloxClient.getUser(parseInt(robloxId));
                    return {
                        id: robloxUser.id,
                        name: robloxUser.name,
                    };
                } catch (robloxError) {
                    console.error('Failed to fetch Roblox user details:', robloxError);
                    // Return just the ID if we can't get the name
                    return {
                        id: parseInt(robloxId),
                        name: `User_${robloxId}`,
                    };
                }
            }
            return null;
        } catch (error) {
            console.error('Bloxlink API error:', error);
            return null;
        }
    }

    private generateRandomPassword(length: number = 12): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

    private async getPlankaAuthToken(): Promise<string> {
        try {
            const response = await axios.post(`${config.planka.url}/api/access-tokens`, {
                emailOrUsername: config.planka.adminUsername,
                password: config.planka.adminPassword,
            });
            
            // The token is directly in the 'item' field for this Planka version
            const token = response.data.item;
            
            if (!token) {
                console.error('No access token found in response:', response.data);
                throw new Error('No access token in Planka response');
            }
            
            return token;
        } catch (error: any) {
            console.error('Failed to authenticate with Planka:', error.response?.data || error.message);
            if (error.response?.status === 400) {
                console.error('Planka auth error details:', JSON.stringify(error.response.data, null, 2));
            }
            throw new Error('Failed to authenticate with Planka API');
        }
    }

    private async findOrCreatePlankaUser(authToken: string, robloxUsername: string, email: string): Promise<{ user: any; password: string; isNew: boolean }> {
        try {
            // First, try to find existing user by username
            try {
                const usersResponse = await axios.get(`${config.planka.url}/api/users`, {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                    },
                });

                const existingUser = usersResponse.data.items.find((user: any) => user.username === robloxUsername);
                if (existingUser) {
                    return { user: existingUser, password: '', isNew: false };
                }
            } catch (error) {
                // User doesn't exist, continue to creation
            }

            // Generate random password for new user
            const password = this.generateRandomPassword();

            // Create new user
            const createUserResponse = await axios.post(`${config.planka.url}/api/users`, {
                email: email,
                password: password,
                role: 'boardUser',
                name: robloxUsername,
                username: robloxUsername,
                subscribeToOwnCards: false,
                subscribeToCardWhenCommenting: true,
                turnOffRecentCardHighlighting: false,
            }, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
            });

            return { user: createUserResponse.data.item, password, isNew: true };
        } catch (error) {
            console.error('Failed to find or create Planka user:', error);
            throw new Error('Failed to create/find Planka user');
        }
    }

    async run(ctx: CommandContext) {
        try {
            // Get the user's Roblox account via Bloxlink
            const robloxUser = await this.getRobloxUserFromBloxlink(ctx.user.id);
            if (!robloxUser) {
                const noAccountMessage = '❌ No Verified Roblox Account\n\nYou need to verify your Roblox account with Bloxlink first. Please use the verification process in your server.';
                if (ctx.subject instanceof CommandInteraction) {
                    return await ctx.subject.editReply({ content: noAccountMessage });
                } else {
                    return await ctx.reply(noAccountMessage);
                }
            }

            // Get Planka auth token
            const authToken = await this.getPlankaAuthToken();

            // Create email from Roblox username
            const email = `${robloxUser.name}@roblox.local`;

            // Find or create Planka user
            const { user, password, isNew } = await this.findOrCreatePlankaUser(authToken, robloxUser.name, email);

            // Create response message
            let message = '**Planka Login**\n\n';
            message += `Username: ${user.username}\n`;
            
            if (isNew) {
                message += `Password: ${password}\n`;
            } else {
                message += '-# For security reasons, please contact the Leadership Team to reset your password.';
            }
        

            // Send as DM
            try {
                await ctx.user.send(message);
                
                // Send confirmation in the channel (already deferred as ephemeral)
                const confirmMessage = '✅ Your Planka account information has been sent to your DMs.';
                
                if (ctx.subject instanceof CommandInteraction) {
                    return await ctx.subject.editReply({ content: confirmMessage });
                } else {
                    return await ctx.reply(confirmMessage);
                }
            } catch (dmError) {
                // If DM fails, send in channel (already deferred as ephemeral)
                if (ctx.subject instanceof CommandInteraction) {
                    return await ctx.subject.editReply({ content: message });
                } else {
                    return await ctx.reply(message);
                }
            }

        } catch (error) {
            console.error('Planka info command error:', error);
            
            const errorMessage = '❌ There was an error processing your request. Please contact an administrator.';
            
            if (ctx.subject instanceof CommandInteraction) {
                return await ctx.subject.editReply({ content: errorMessage });
            } else {
                return await ctx.reply(errorMessage);
            }
        }
    }
}

export default PlankaInfoCommand;
