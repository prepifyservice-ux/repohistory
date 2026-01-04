import { CommandContext } from '../../structures/addons/CommandAddons';
import { Command } from '../../structures/Command';
import { config } from '../../config';
import { TextChannel, ChannelType, CommandInteraction } from 'discord.js';
import { sendComponentsV2Message, editComponentsV2Reply, createTextDisplay } from '../../utils/componentsV2';

class AnnounceCommand extends Command {
    constructor() {
        super({
            trigger: 'announce',
            description: 'Announces a message to a channel.',
            type: 'ChatInput',
            module: 'admin',
            args: [
                {
                    trigger: 'title',
                    description: 'The title of the announcement.',
                    required: true,
                    type: 'String',
                },
                {
                    trigger: 'text',
                    description: 'The text content of the announcement.',
                    required: true,
                    type: 'String',
                },
                {
                    trigger: 'channel',
                    description: 'The channel to send the announcement to.',
                    required: true,
                    type: 'DiscordChannel',
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

    async run(ctx: CommandContext) {
        const title = ctx.args['title'] as string;
        const text = ctx.args['text'] as string;
        
        // Get the channel - ctx.args['channel'] might be an ID or channel object
        let channel: TextChannel;
        if (ctx.subject instanceof CommandInteraction) {
            channel = ctx.subject.options.get('channel')?.channel as TextChannel;
        } else {
            // For legacy commands, fetch the channel by ID
            const channelId = ctx.args['channel'] as string;
            channel = await ctx.guild.channels.fetch(channelId) as TextChannel;
        }

        // Validate channel type
        if (!channel || (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement)) {
            if (ctx.subject instanceof CommandInteraction) {
                await editComponentsV2Reply(
                    ctx.subject.applicationId,
                    ctx.subject.token,
                    [createTextDisplay('❌ **Invalid Channel**\n\nPlease select a valid text or announcement channel.')]
                );
            }
            return;
        }

        // Check bot permissions
        if (!channel.permissionsFor(ctx.guild.members.me).has(['SendMessages', 'EmbedLinks'])) {
            if (ctx.subject instanceof CommandInteraction) {
                await editComponentsV2Reply(
                    ctx.subject.applicationId,
                    ctx.subject.token,
                    [createTextDisplay('❌ **Missing Permissions**\n\nI don\'t have permission to send messages or embeds in that channel.')]
                );
            }
            return;
        }

        try {
            // Send announcement using Components V2
            await sendComponentsV2Message(channel, [
                createTextDisplay(`# ${title}\n\n${text}`)
            ]);

            // Send confirmation
            if (ctx.subject instanceof CommandInteraction) {
                await editComponentsV2Reply(
                    ctx.subject.applicationId,
                    ctx.subject.token,
                    [createTextDisplay(`✅ **Announcement Sent**\n\nYour announcement has been sent to ${channel}.`)]
                );
            }
        } catch (error) {
            console.error('Announce command error:', error);
            
            if (ctx.subject instanceof CommandInteraction) {
                await editComponentsV2Reply(
                    ctx.subject.applicationId,
                    ctx.subject.token,
                    [createTextDisplay('❌ **Error**\n\nThere was an error sending the announcement. Please try again.')]
                );
            }
        }
    }
}

export default AnnounceCommand;
