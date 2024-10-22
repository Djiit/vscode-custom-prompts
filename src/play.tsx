import {
  BasePromptElementProps,
  PromptElement,
  UserMessage,
} from "@vscode/prompt-tsx";
import * as vscode from "vscode";

export interface PromptProps extends BasePromptElementProps {
  command: string;
  userQuery: string;
  references?: {
    fileName: string;
    languageId: string;
    content: string;
  }[];
}

export type customPrompt = {
  command: string;
  content: string;
  name?: string;
  description?: string;
};

export const getCustomPrompts = (): customPrompt[] => {
  const extensionConfig = vscode.workspace.getConfiguration("customPrompts");
  const customPrompts = extensionConfig.get("prompts") || [];
  return customPrompts as customPrompt[];
};

export const getCustomPromptContent = (
  customPrompts: customPrompt[],
  command: string,
): string | undefined => {
  return customPrompts.find(
    (prompt) => prompt.command.toLowerCase() === command.toLowerCase(),
  )?.content;
};

export class Prompt extends PromptElement<PromptProps, void> {
  private customPrompts: customPrompt[] = [];

  constructor(props: PromptProps) {
    super(props);
    this.customPrompts = getCustomPrompts();
  }

  getPrompt(command: string) {
    return getCustomPromptContent(this.customPrompts, command);
  }

  render() {
    const { command, userQuery, references } = this.props;
    const customPrompt = getCustomPromptContent(this.customPrompts, command);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return (
      <>
        {customPrompt ? <UserMessage>{customPrompt}</UserMessage> : undefined}
        {userQuery ? <UserMessage>{userQuery}</UserMessage> : undefined}
        {references && references?.length > 0
          ? references?.map((reference) => (
              // eslint-disable-next-line @typescript-eslint/no-unsafe-return
              <UserMessage>
                # {reference.fileName.toUpperCase()} CONTEXT
                <br />
                ```{reference.languageId}
                <br />
                {reference.content}```
              </UserMessage>
            ))
          : undefined}
      </>
    );
  }
}
