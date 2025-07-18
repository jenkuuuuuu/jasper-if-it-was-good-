import { ApplicationCommandOptionType } from '@antibot/interactions';
import {
    ButtonStyle,
    ChatInputCommandInteraction,
    ComponentType,
    ContainerBuilder,
    MessageFlags,
    SectionBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    TextDisplayBuilder,
    ThumbnailBuilder,
} from 'discord.js';

import { chunk } from '../../../array';
import { Context } from '../../../classes/context';
import { defineSubCommand } from '../../../define';
import { Options } from '../../../services/settingsService';

export const ViewTopicsSubCommand = defineSubCommand({
    handler: async (ctx: Context, interaction: ChatInputCommandInteraction) => {
        const guildId = interaction.guildId!;
        await ctx.services.settings.configure<Options>({ guildId });
        const topicsExistInDB = await ctx.services.settings.getText<string>(guildId, 'Topics');

        const pages = chunk(topicsExistInDB, 10);
        const initialState = { addTopicPages: { page: 0, pages } };

        ctx.pagination.set(interaction.user.id, initialState);
        const state = ctx.pagination.get(interaction.user.id);

        if (!state || !state.addTopicPages) {
            await interaction.reply({
                content: 'Failed to initialize pagination state',
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        let components = [];

        if (topicsExistInDB.length !== 0) {
            components = [
                {
                    components: [
                        {
                            customId: `add_topic_subcommand_button_previous_${interaction.user.id}`,
                            disabled: state.addTopicPages.page === 0,
                            label: 'Previous',
                            style: ButtonStyle.Primary as const,
                            type: ComponentType.Button as const,
                        },
                        {
                            customId: `add_topic_subcommand_button_home_${interaction.user.id}`,
                            label: 'Home',
                            style: ButtonStyle.Secondary as const,
                            type: ComponentType.Button as const,
                        },
                        {
                            customId: `add_topic_subcommand_button_next_${interaction.user.id}`,
                            disabled:
                                state.addTopicPages.page === state.addTopicPages.pages.length - 1,
                            label: 'Next',
                            style: ButtonStyle.Primary as const,
                            type: ComponentType.Button as const,
                        },
                    ],
                    type: ComponentType.ActionRow as const,
                },
            ];
        }

        const viewTopicsComponents = [
            new ContainerBuilder()
                .setAccentColor(global.embedColor)
                .addSectionComponents(
                    new SectionBuilder()
                        .setThumbnailAccessory(
                            new ThumbnailBuilder().setURL(interaction.guild?.iconURL()),
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                '## Current Topics in Configuration',
                            ),
                        ),
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        (state.addTopicPages.pages[state.addTopicPages.page] || [])
                            .map(
                                (string, i) =>
                                    `**${state.addTopicPages.page * 10 + i + 1}.** *${string}*`,
                            )
                            .join('\n') || 'There are no topics configured.',
                    ),
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `-# Page: ${state.addTopicPages.page + 1}/${state.addTopicPages.pages.length} • Total Topics: ${topicsExistInDB.length}`,
                    ),
                ),
        ];

        await interaction.reply({
            components:
                components.length > 0
                    ? [...viewTopicsComponents, ...components]
                    : viewTopicsComponents,
            flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
        });
    },
    name: 'view_topics',
});

export const commandOptions = {
    description: 'View the current topics in the configuration',
    name: 'view_topics',
    options: [],
    type: ApplicationCommandOptionType.SUB_COMMAND,
};
