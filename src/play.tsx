import {
  BasePromptElementProps,
  PromptElement,
  PromptSizing,
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

export const getCustomConfigMap = () => {
  const map: Record<string, string> = {};
  const ignoreKey = ["has", "get", "update", "inspect"];
  const config = vscode.workspace.getConfiguration("customPrompts.prompts");
  for (const key in config) {
    if (
      Object.prototype.hasOwnProperty.call(config, key) &&
      !ignoreKey.includes(key)
    ) {
      const prompt = config[key];
      map[key] = prompt;
    }
  }
  return map;
};

export class Prompt extends PromptElement<PromptProps, void> {
  private customConfigMap: Record<string, string> = {};

  constructor(props: PromptProps) {
    super(props);
    this.customConfigMap = getCustomConfigMap();
  }

  render(state: void, sizing: PromptSizing) {
    const { command, userQuery, references } = this.props;
    const preDefinedPrompts = this.customConfigMap[command];
    return (
      <>
        {preDefinedPrompts ? (
          <UserMessage>{preDefinedPrompts}</UserMessage>
        ) : undefined}

        {userQuery ? <UserMessage>{userQuery}</UserMessage> : undefined}

        {references && references?.length > 0
          ? references?.map((reference, index) => (
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
