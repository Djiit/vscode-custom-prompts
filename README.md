# Custom Prompts for Github Copilot Chat

Share custom prompts for Github Copilot Chat.

## Usage

Use `@customPrompts` to invoke the assistant, then select the desired command.

Add custom prompts in `settings.json` as follows:

```jsonc
{
  "customPrompts": {
    "prompts": [
      {
        "command": "prefixwithlegacy",
        "content": "Rename functions with the 'legacy_' prefix.",
        "name": "Refactor: prefix with 'legacy_'", // optional
        "description": "Use this to rename functions with the 'legacy_' prefix.", // optional
      },
    ],
  },
}
```

Then, in the chat, enter `@customPrompts /custom /<Your Prompt name>` to invoke the custom command.

## Credits

Inspirations:

- https://github.com/microsoft/vscode-extension-samples/tree/main/chat-sample
- https://github.com/wolfsilver/friday
