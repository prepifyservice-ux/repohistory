import { discordClient, robloxClient } from '../../main';
import { CommandContext } from '../../structures/addons/CommandAddons';
import { Command } from '../../structures/Command';
import { config } from '../../config';
import axios from 'axios';
import { CommandInteraction } from 'discord.js';
import crypto from 'crypto';

class PlankaChangeCommand extends Command {
    constructor() {
        super({
            trigger: 'plankachange',
            description: 'Change a Planka user\'s username or password.',
            type: 'ChatInput',
            module: 'admin',
            args: [
                {
                    trigger: 'original-username',
                    description: 'The current Planka username to modify.',
                    required: true,
                    type: 'String',
                },
                {
                    trigger: 'change-type',
                    description: 'What to change: username or password.',
                    required: true,
                    type: 'String',
                    autocomplete: true,
                },
                {
                    trigger: 'new-value',
                    description: 'The new username or password.',
                    required: true,
                    type: 'String',
                }
            ],
            permissions: [
                {
                    type: 'role',
                    ids: config.permissions.admin,
                    value: true,
                }
            ]
        });
    }

    async autocomplete(interaction: any) {
        const focusedOption = interaction.options.getFocused(true);
        if (focusedOption.name === 'change-type') {
            const choices = [
                { name: 'Username', value: 'username' },
                { name: 'Password', value: 'password' }
            ];
            await interaction.respond(
                choices.filter(choice => choice.name.toLowerCase().includes(focusedOption.value.toLowerCase()))
            );
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
            throw new Error('Failed to authenticate with Planka API');
        }
    }

    private async findPlankaUser(authToken: string, username: string): Promise<any> {
        try {
            const usersResponse = await axios.get(`${config.planka.url}/api/users`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                },
            });

            const user = usersResponse.data.items.find((user: any) => user.username === username);
            return user || null;
        } catch (error) {
            console.error('Failed to find Planka user:', error);
            throw new Error('Failed to find Planka user');
        }
    }

    private async updatePlankaUser(authToken: string, userId: string, updates: any): Promise<any> {
        try {
            const response = await axios.patch(`${config.planka.url}/api/users/${userId}`, updates, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
            });
            return response.data.item;
        } catch (error) {
            console.error('Failed to update Planka user:', error);
            throw new Error('Failed to update Planka user');
        }
    }

    private async deletePlankaUser(authToken: string, userId: string): Promise<void> {
        try {
            await axios.delete(`${config.planka.url}/api/users/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                },
            });
        } catch (error) {
            console.error('Failed to delete Planka user:', error);
            throw new Error('Failed to delete Planka user');
        }
    }

    private async createPlankaUser(authToken: string, email: string, username: string, password: string, name: string): Promise<any> {
        try {
            const response = await axios.post(`${config.planka.url}/api/users`, {
                email: email,
                password: password,
                role: 'boardUser',
                name: name,
                username: username,
                subscribeToOwnCards: false,
                subscribeToCardWhenCommenting: true,
                turnOffRecentCardHighlighting: false,
            }, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
            });
            return response.data.item;
        } catch (error: any) {
            console.error('Failed to create Planka user:', error.response?.data || error.message);
            if (error.response?.data?.problems) {
                console.error('Validation problems:', JSON.stringify(error.response.data.problems, null, 2));
            }
            throw new Error('Failed to create Planka user');
        }
    }

    async run(ctx: CommandContext) {
        try {
            const originalUsername = ctx.args['original-username'] as string;
            const changeType = ctx.args['change-type'] as string;
            const newValue = ctx.args['new-value'] as string;

            // Validate change type
            if (changeType !== 'username' && changeType !== 'password') {
                if (ctx.subject instanceof CommandInteraction) {
                    return ctx.subject.editReply({
                        content: '❌ **Invalid Change Type**\n\nPlease select either "username" or "password".'
                    });
                }
                return;
            }

            // Get Planka auth token
            const authToken = await this.getPlankaAuthToken();

            // Find the user
            const user = await this.findPlankaUser(authToken, originalUsername);
            if (!user) {
                if (ctx.subject instanceof CommandInteraction) {
                    return ctx.subject.editReply({
                        content: `❌ **User Not Found**\n\nNo Planka user found with username: ${originalUsername}`
                    });
                }
                return;
            }

            // Handle username vs password change differently
            if (changeType === 'username') {
                // Username can be updated via PATCH
                await this.updatePlankaUser(authToken, user.id, { username: newValue });
                
                let successMessage = `✅ **Planka Username Updated**\n\n`;
                successMessage += `**Original Username:** ${originalUsername}\n`;
                successMessage += `**New Username:** ${newValue}\n`;
                successMessage += `\n**Planka URL:** ${config.planka.url}`;

                if (ctx.subject instanceof CommandInteraction) {
                    return ctx.subject.editReply({
                        content: successMessage
                    });
                }
            } else if (changeType === 'password') {
                // Password changes require deleting and recreating the user
                // Store user details before deletion
                const userEmail = user.email;
                const userName = user.name;
                const userUsername = user.username;
                
                // Delete the old user
                await this.deletePlankaUser(authToken, user.id);
                
                // Create new user with same details but new password
                await this.createPlankaUser(authToken, userEmail, userUsername, newValue, userName);
                
                let successMessage = `✅ **Planka Password Updated**\n\n`;
                successMessage += `**Username:** ${userUsername}\n`;
                successMessage += `**New Password:** ||${newValue}||\n`;
                successMessage += `\n**Note:** User was recreated with new password.\n`;
                successMessage += `**Planka URL:** ${config.planka.url}`;

                if (ctx.subject instanceof CommandInteraction) {
                    return ctx.subject.editReply({
                        content: successMessage
                    });
                }
            }

        } catch (error) {
            console.error('Planka change command error:', error);
            
            if (ctx.subject instanceof CommandInteraction) {
                return ctx.subject.editReply({
                    content: '❌ **Error**\n\nThere was an error updating the Planka account. Please contact an administrator.'
                });
            }
        }
    }
}

export default PlankaChangeCommand;
