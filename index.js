import {SlashCommandParser} from "../../../slash-commands/SlashCommandParser.js";
import {SlashCommand} from "../../../slash-commands/SlashCommand.js";
import {getMaxPromptTokens} from "../../../../script.js";
import {getWorldInfoPrompt} from "../../../world-info.js";

$(function () {
    if (typeof SlashCommandParser !== 'undefined' && SlashCommandParser.addCommandObject) {
        if (!SlashCommandParser.commands['enerccio-misc-with-previous-user-message']) {
            SlashCommandParser.addCommandObject(SlashCommand.fromProps({
                name: 'enerccio-misc-with-previous-user-message',
                callback: (msgId, value) => {
                    const context = SillyTavern.getContext();
                    if (!context.chat || context.chat.length === 0) {
                        return "";
                    }

                    let rawId = msgId;
                    if (typeof msgId === 'object' && msgId !== null) {
                        rawId = value;
                    }

                    const index = parseInt(rawId, 10);
                    if (isNaN(index)) {
                        return "";
                    }
                    const targetIndex = index - 1;
                    if (targetIndex >= 0 && targetIndex < context.chat.length) {
                        const targetMessage = context.chat[targetIndex];
                        if (targetMessage && targetMessage.is_user && targetMessage.mes) {
                            return targetMessage.mes + "\n\n";
                        }
                    }

                    return "";
                },
                returns: 'An empty string or text of user message if it is above.',
                helpString: 'Returns the text of the user message directly above the specified message ID index.'
            }));
        }

        if (!SlashCommandParser.commands['enerccio-misc-qvink-history']) {
            SlashCommandParser.addCommandObject(SlashCommand.fromProps({
                name: 'enerccio-misc-qvink-history',
                callback: (namedArgs, unnamedArgs) => {
                    const context = SillyTavern.getContext();
                    if (!context.chat || context.chat.length === 0) {
                        return "";
                    }

                    let targetMsgId = null;
                    let targetNumHistory = null;

                    // Handle Named Arguments (e.g. msgId=10 numHistory=5)
                    if (namedArgs && typeof namedArgs === 'object') {
                        if (namedArgs.msgId !== undefined) {
                            targetMsgId = parseInt(namedArgs.msgId, 10);
                        }
                        if (namedArgs.numHistory !== undefined) {
                            targetNumHistory = parseInt(namedArgs.numHistory, 10);
                        }
                    }

                    // Handle Positional Arguments (e.g. 10 5)
                    let rawInput = "";
                    if (typeof namedArgs === 'string' || typeof namedArgs === 'number') {
                        rawInput = String(namedArgs);
                        if (unnamedArgs) {
                            rawInput += " " + String(unnamedArgs);
                        }
                    } else if (typeof unnamedArgs === 'string') {
                        rawInput = unnamedArgs;
                    }

                    const parts = rawInput.trim().split(/\s+/).filter(p => p.length > 0);

                    if (parts.length > 0) {
                        if (parts.length === 1) {
                            // If only 1 argument is passed, treat it as numHistory
                            // and default msgId to the end of the chat.
                            if (targetNumHistory === null) {
                                targetNumHistory = parseInt(parts[0], 10);
                            }
                        } else {
                            // If 2 arguments are passed, treat them as [msgId, numHistory]
                            if (targetMsgId === null) {
                                targetMsgId = parseInt(parts[0], 10);
                            }
                            if (targetNumHistory === null) {
                                targetNumHistory = parseInt(parts[1], 10);
                            }
                        }
                    }

                    // Establish defaults if undefined/null
                    const chatLength = context.chat.length;
                    if (targetMsgId === null || isNaN(targetMsgId)) {
                        targetMsgId = chatLength; // Defaults to pointing to the end of the chat
                    }
                    if (targetNumHistory === null || isNaN(targetNumHistory)) {
                        targetNumHistory = 1; // Default to gathering 1 message
                    }

                    // Clamp targetMsgId within safe boundaries [0, chatLength]
                    targetMsgId = Math.max(0, Math.min(targetMsgId, chatLength));

                    const selectedMessages = [];
                    let i = targetMsgId - 1;

                    // RULE: Skip the message directly above if it is a user message
                    if (i >= 0 && i < chatLength) {
                        const directAbove = context.chat[i];
                        if (directAbove && directAbove.is_user) {
                            i--; // Skip this message index
                        }
                    }

                    // Collect the specified amount of history scanning backwards
                    while (i >= 0 && selectedMessages.length < targetNumHistory) {
                        const msg = context.chat[i];
                        if (msg) {
                            selectedMessages.push(msg);
                        }
                        i--;
                    }

                    // Reverse selected messages to preserve chronological order (oldest to newest)
                    selectedMessages.reverse();

                    // Handle configurable separator (supports custom delimiter or escaped \n)
                    const rawSeparator = (namedArgs && (namedArgs.join || namedArgs.separator)) || "\n\n";
                    const separator = rawSeparator
                        .replace(/\\n/g, '\n')
                        .replace(/\\r/g, '\r')
                        .replace(/\\t/g, '\t');

                    // Map to message content and concatenate
                    return selectedMessages.map(msg => msg.mes || "").join(separator);
                },
                returns: 'Concatenated history of messages.',
                helpString: 'Returns "numHistory" messages concatenated backwards from "msgId". Ignores the message directly above if it is a user message.'
            }));
        }

        if (!SlashCommandParser.commands['enerccio-misc-qvink-lorebook']) {
            SlashCommandParser.addCommandObject(SlashCommand.fromProps({
                name: 'enerccio-misc-qvink-lorebook',
                callback: async (namedArgs, unnamedArgs) => {
                    const context = SillyTavern.getContext();
                    if (!context.chat || context.chat.length === 0) {
                        return "";
                    }

                    let targetMsgId = null;
                    let targetNumHistory = null;
                    let trigger = null;

                    // Handle Named Arguments (e.g. msgId=10 numHistory=5)
                    if (namedArgs && typeof namedArgs === 'object') {
                        if (namedArgs.msgId !== undefined) {
                            targetMsgId = parseInt(namedArgs.msgId, 10);
                        }
                        if (namedArgs.numHistory !== undefined) {
                            targetNumHistory = parseInt(namedArgs.numHistory, 10);
                        }
                        if (namedArgs.trigger !== undefined) {
                            trigger = namedArgs.trigger;
                        }
                    }

                    // Handle Positional Arguments (e.g. 10 5)
                    let rawInput = "";
                    if (typeof namedArgs === 'string' || typeof namedArgs === 'number') {
                        rawInput = String(namedArgs);
                        if (unnamedArgs) {
                            rawInput += " " + String(unnamedArgs);
                        }
                    } else if (typeof unnamedArgs === 'string') {
                        rawInput = unnamedArgs;
                    }

                    const parts = rawInput.trim().split(/\s+/).filter(p => p.length > 0);

                    if (parts.length > 0) {
                        if (parts.length === 1) {
                            if (targetMsgId === null) {
                                targetMsgId = parseInt(parts[0], 10);
                            }
                        } else if (parts.length === 2) {
                            if (targetMsgId === null) {
                                targetMsgId = parseInt(parts[0], 10);
                            }
                            if (targetNumHistory === null) {
                                targetNumHistory = parseInt(parts[1], 10);
                            }
                        } else {
                            if (targetMsgId === null) {
                                targetMsgId = parseInt(parts[0], 10);
                            }
                            if (targetNumHistory === null) {
                                targetNumHistory = parseInt(parts[1], 10);
                            }
                            if (trigger === null) {
                                trigger = parts[2];
                            }
                        }
                    }

                    const chatLength = context.chat.length;
                    if (targetMsgId === null || isNaN(targetMsgId)) {
                        targetMsgId = chatLength;
                    }
                    if (targetNumHistory === null || isNaN(targetNumHistory)) {
                        targetNumHistory = 1; // Default to gathering 1 message
                    }
                    if (trigger === null) {
                        trigger = "qvink";
                    }

                    targetMsgId = Math.max(0, Math.min(targetMsgId, chatLength));

                    const selectedMessages = [];
                    let i = targetMsgId;

                    while (i >= 0 && selectedMessages.length < targetNumHistory) {
                        const msg = context.chat[i];
                        if (msg) {
                            selectedMessages.push(msg);
                        }
                        i--;
                    }

                    selectedMessages.reverse();

                    const rawSeparator = (namedArgs && (namedArgs.join || namedArgs.separator)) || "\n\n";
                    const separator = rawSeparator
                        .replace(/\\n/g, '\n')
                        .replace(/\\r/g, '\r')
                        .replace(/\\t/g, '\t');

                    const text = selectedMessages.map(msg => msg.mes || "").join(separator);

                    const globalScanData = {
                        personaDescription: '',
                        characterDescription: '',
                        characterPersonality: '',
                        characterDepthQuery: '',
                        scenario: '',
                        creatorNotes: '',
                        trigger: trigger,
                    };
                    let this_max_context = getMaxPromptTokens();
                    const {
                        worldInfoString,
                        worldInfoBefore,
                        worldInfoAfter,
                        worldInfoExamples,
                        worldInfoDepth,
                        outletEntries
                    } = await getWorldInfoPrompt([ text ], this_max_context, false, globalScanData);

                    return ((worldInfoBefore || '') + (worldInfoAfter + ''));
                },
                returns: 'Generated lorebook.',
                helpString: 'Returns "numHistory" messages concatenated backwards from "msgId". Ignores the message directly above if it is a user message.'
            }));
        }

        if (!SlashCommandParser.commands['enerccio-misc-qvink-processed-message']) {
            SlashCommandParser.addCommandObject(SlashCommand.fromProps({
                name: 'enerccio-misc-qvink-processed-message',
                callback: async (namedArgs, unnamedArgs) => {
                    const context = SillyTavern.getContext();
                    if (!context.chat || context.chat.length === 0) return "";

                    // Parse out target message ID matching your established conventions
                    let rawId = (namedArgs && typeof namedArgs === 'object') ? namedArgs.msgId : namedArgs;
                    if (!rawId && unnamedArgs) rawId = unnamedArgs;

                    const index = parseInt(rawId || context.chat.length - 1, 10);
                    if (isNaN(index) || index < 0 || index >= context.chat.length) return "";

                    const targetMessage = context.chat[index];
                    if (!targetMessage || !targetMessage.mes) return "";

                    // Dispatch through the compat pipe to run cleanBulkText/cleanSingleMessage
                    if (window.enerccio_compat?.textProcessor) {
                        const result = await window.enerccio_compat.textProcessor(targetMessage.mes, { imprint: false });
                        return Array.isArray(result) ? result[0] : targetMessage.mes;
                    }

                    return targetMessage.mes;
                },
                returns: 'Scrubbed text of the designated message index run through the compat pipeline.',
                helpString: 'Retrieves a chat message by index and purges language footprints using enerccio_compat.'
            }));
        }
    }
});
