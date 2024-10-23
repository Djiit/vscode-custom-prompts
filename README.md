# Custom Prompts for Github Copilot Chat

Share custom prompts for Github Copilot Chat with your team.

## Usage

Use `@customPrompts` to invoke the assistant, then select the desired command.

### Configuration

Add your custom prompts in `.vscode/settings.json` as follow:

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

Then, in the chat, enter `@customPrompts /load /<command>` to invoke the custom command; e.g. with the example config above: `@customPrompts /load /prefixwithlegacy`

### Available Commands

- `/load`: Use `@customPrompts /load /<command>` to invoke a custom command.

## Credits

Inspirations:

- https://github.com/microsoft/vscode-extension-samples/tree/main/chat-sample
- https://github.com/wolfsilver/friday
