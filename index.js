import {SlashCommandParser} from "../../../slash-commands/SlashCommandParser.js";
import {SlashCommand} from "../../../slash-commands/SlashCommand.js";

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
    }
});
