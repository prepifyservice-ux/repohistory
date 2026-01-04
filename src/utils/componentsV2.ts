import { TextChannel, User } from 'discord.js';
import axios from 'axios';

/**
 * Send a message using Discord Components V2 format
 * @param channel The channel to send the message to
 * @param components Array of component objects
 * @returns Promise<any>
 */
export async function sendComponentsV2Message(channel: TextChannel, components: any[]): Promise<any> {
    const token = channel.client.token;
    const channelId = channel.id;
    
    try {
        const response = await axios.post(
            `https://discord.com/api/v10/channels/${channelId}/messages`,
            {
                flags: 32768, // IS_COMPONENTS_V2 flag
                components: components
            },
            {
                headers: {
                    'Authorization': `Bot ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error sending Components V2 message:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Reply to an interaction using Discord Components V2 format
 * @param interactionToken The interaction token
 * @param interactionId The interaction ID
 * @param components Array of component objects
 * @param ephemeral Whether the reply should be ephemeral
 * @returns Promise<any>
 */
export async function replyComponentsV2(
    interactionToken: string,
    interactionId: string,
    components: any[],
    ephemeral: boolean = false
): Promise<any> {
    try {
        const response = await axios.post(
            `https://discord.com/api/v10/interactions/${interactionId}/${interactionToken}/callback`,
            {
                type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
                data: {
                    flags: ephemeral ? 32768 | 64 : 32768, // IS_COMPONENTS_V2 + EPHEMERAL if needed
                    components: components
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error replying with Components V2:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Edit a deferred reply using Discord Components V2 format
 * @param applicationId The application ID
 * @param interactionToken The interaction token
 * @param components Array of component objects
 * @returns Promise<any>
 */
export async function editComponentsV2Reply(
    applicationId: string,
    interactionToken: string,
    components: any[]
): Promise<any> {
    try {
        const response = await axios.patch(
            `https://discord.com/api/v10/webhooks/${applicationId}/${interactionToken}/messages/@original`,
            {
                flags: 32768, // IS_COMPONENTS_V2 flag
                components: components
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error editing Components V2 reply:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Create a Text Display component (type 10)
 */
export function createTextDisplay(content: string) {
    return {
        type: 10,
        content: content
    };
}

/**
 * Create a Container component (type 17) with optional accent color
 * @param components Child components
 * @param accentColor Optional color as integer (e.g., 0x00FF00 for green)
 */
export function createContainer(components: any[], accentColor?: number) {
    const container: any = {
        type: 17,
        components: components
    };
    if (accentColor !== undefined) {
        container.accent_color = accentColor;
    }
    return container;
}

/**
 * Create a Separator component (type 14)
 * @param spacing Optional spacing: 1 for small, 2 for large
 * @param divider Whether to show a divider line
 */
export function createSeparator(spacing?: number, divider: boolean = true) {
    return {
        type: 14,
        spacing: spacing || 1,
        divider: divider
    };
}

/**
 * Create a Section component (type 9) with text and optional accessory
 * @param components Child components (Text Display)
 * @param accessory Optional accessory component (Button, Thumbnail)
 */
export function createSection(components: any[], accessory?: any) {
    const section: any = {
        type: 9,
        components: components
    };
    if (accessory) {
        section.accessory = accessory;
    }
    return section;
}

/**
 * Create an Action Row component (type 1) with buttons
 */
export function createActionRow(components: any[]) {
    return {
        type: 1,
        components: components
    };
}

/**
 * Create a Button component (type 2)
 */
export function createButton(label: string, customId: string, style: number = 1) {
    return {
        type: 2,
        style: style, // 1=Primary, 2=Secondary, 3=Success, 4=Danger, 5=Link
        label: label,
        custom_id: customId
    };
}

/**
 * Create a Media Gallery component (type 13)
 * @param items Array of media items with url
 */
export function createMediaGallery(items: { url: string }[]) {
    return {
        type: 13,
        items: items.map(item => ({ media: { url: item.url } }))
    };
}
