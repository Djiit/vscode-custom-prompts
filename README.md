# Custom Prompts for Github Copilot Chat

Share custom prompts for Github Copilot Chat.

## Usage

Use `@customPrompts` to invoke the assistant, then select the desired command.

Add custom prompts in `settings.json` as follows:

```json
{
  "customPrompts.prompts": {
    "<Your Prompt name>": "<Your prompt content>."
  }
}
```

Then, in the chat, enter `@customPrompts /custom /<Your Prompt name>` to invoke the custom command.

## Credits

Inspirations:

- https://github.com/microsoft/vscode-extension-samples/tree/main/chat-sample
- https://github.com/wolfsilver/friday
