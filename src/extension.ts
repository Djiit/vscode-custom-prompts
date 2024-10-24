import { renderPrompt } from "@vscode/prompt-tsx";
import * as vscode from "vscode";
import {
  getCustomPrompts,
  getCustomPromptContent,
  Prompt,
  PromptProps,
} from "./play.js";
import { VsCodeFS } from "./utils.js";

const CUSTOM_PROMPTS_PARTICIPANT_ID = "copilot.customPrompts";

interface ICustomPromptsChatResult extends vscode.ChatResult {
  metadata: {
    command: string;
  };
}

// Use gpt-4o since it is fast and high quality. gpt-3.5-turbo and gpt-4 are also available.
const MODEL_SELECTOR: vscode.LanguageModelChatSelector = {
  vendor: "copilot",
  family: "gpt-4o",
};

export function activate(context: vscode.ExtensionContext) {
  const handler: vscode.ChatRequestHandler = async (
    request: vscode.ChatRequest,
    _context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
  ): Promise<ICustomPromptsChatResult> => {
    // To talk to an LLM in your subcommand handler implementation, your
    // extension can use VS Code's `requestChatAccess` API to access the Copilot API.
    // The GitHub Copilot Chat extension implements this provider.
    if (request.command) {
      const references: PromptProps["references"] = [];
      if (request.references?.length > 0) {
        for (const reference of request.references) {
          if (reference.value instanceof vscode.Uri) {
            stream.reference(reference.value);

            const languageId = await VsCodeFS.getLanguageId(
              reference.value.fsPath,
            );
            const content = await VsCodeFS.readFileOrOpenDocumentContent(
              reference.value.fsPath,
              "utf-8",
            );
            references.push({
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
              fileName: (reference as any).name,
              languageId,
              content,
            });
          }
        }
      } else {
        // get current editor content
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          const languageId = editor.document.languageId;
          const content = editor.document.getText();
          const fileNameWithoutPath = editor.document.fileName
            .split(/\/|\\/)
            .pop();
          references.push({
            fileName: fileNameWithoutPath!,
            languageId,
            content,
          });
        }
      }

      if (request.command === "load") {
        stream.progress("Thinking ...");
        const prompts = getCustomPrompts();
        const command = request.prompt.match(/(?<=\/)\w+/)?.[0] || "";

        if (command === "") {
          stream.markdown(
            "Empty prompt name. Please provide a prompt to load.",
          );
          return { metadata: { command: "" } };
        }

        const prompt = getCustomPromptContent(prompts, command);
        if (prompt === undefined) {
          stream.markdown(
            "Unknown prompt command. Please provide a prompt to load.",
          );
          return { metadata: { command: "" } };
        }

        try {
          // To get a list of all available models, do not pass any selector to the selectChatModels.
          const [model] = await vscode.lm.selectChatModels(MODEL_SELECTOR);
          if (model) {
            const { messages } = await renderPrompt(
              Prompt,
              {
                command: command,
                userQuery: request.prompt.replace(`/${command}`, "").trim(),
                references: references,
              },
              { modelMaxPromptTokens: model.maxInputTokens },
              model,
            );

            const chatResponse = await model.sendRequest(messages, {}, token);
            for await (const fragment of chatResponse.text) {
              stream.markdown(fragment);
            }
          }
        } catch (err) {
          handleError(logger, err, stream);
        }

        logger.logUsage("request", { kind: command });
        return { metadata: { command: command } };
      }

      stream.progress("Refactoring the code ...");

      try {
        const [model] = await vscode.lm.selectChatModels(MODEL_SELECTOR);
        if (model) {
          // Here's an example of how to use the prompt-tsx library to build a prompt
          const { messages } = await renderPrompt(
            Prompt,
            {
              command: request.command,
              userQuery: request.prompt,
              references: references,
            },
            { modelMaxPromptTokens: model.maxInputTokens },
            model,
          );

          const chatResponse = await model.sendRequest(messages, {}, token);
          for await (const fragment of chatResponse.text) {
            stream.markdown(fragment);
          }
        }
      } catch (err) {
        handleError(logger, err, stream);
      }

      logger.logUsage("request", { kind: request.command });
      return { metadata: { command: request.command } };
    } else {
      try {
        const [model] = await vscode.lm.selectChatModels(MODEL_SELECTOR);
        if (model) {
          const messages = [
            vscode.LanguageModelChatMessage.User(request.prompt),
          ];

          const chatResponse = await model.sendRequest(messages, {}, token);
          for await (const fragment of chatResponse.text) {
            // Process the output from the language model
            stream.markdown(fragment);
          }
        }
      } catch (err) {
        handleError(logger, err, stream);
      }

      logger.logUsage("request", { kind: "" });
      return { metadata: { command: "" } };
    }
  };

  // Chat participants appear as top-level options in the chat input
  // when you type `@`, and can contribute sub-commands in the chat input
  // that appear when you type `/`.
  const customPrompts = vscode.chat.createChatParticipant(
    CUSTOM_PROMPTS_PARTICIPANT_ID,
    handler,
  );
  // customPrompts.iconPath = vscode.Uri.joinPath(
  //   context.extensionUri,
  //   "icon.jpg"
  // );
  const logger = vscode.env.createTelemetryLogger({
    sendEventData(eventName, data) {
      // Capture event telemetry
      console.log(`Event: ${eventName}`);
      console.log(`Data: ${JSON.stringify(data)}`);
    },
    sendErrorData(error, data) {
      // Capture error telemetry
      console.error(`Error: ${error}`);
      console.error(`Data: ${JSON.stringify(data)}`);
    },
  });

  context.subscriptions.push(
    customPrompts.onDidReceiveFeedback(
      (feedback: vscode.ChatResultFeedback) => {
        // Log chat result feedback to be able to compute the success matric of the participant
        // unhelpful / totalRequests is a good success metric
        logger.logUsage("chatResultFeedback", {
          kind: feedback.kind,
        });
      },
    ),
  );

  context.subscriptions.push(customPrompts);
}

function handleError(
  logger: vscode.TelemetryLogger,
  err: unknown,
  stream: vscode.ChatResponseStream,
): void {
  // making the chat request might fail because
  // - model does not exist
  // - user consent not given
  // - quote limits exceeded
  if (err instanceof vscode.LanguageModelError) {
    console.log(err.message, err.code, err.cause);
    if (err.cause instanceof Error && err.cause.message.includes("off_topic")) {
      stream.markdown(
        vscode.l10n.t(
          "I'm sorry, I can only explain computer science concepts.",
        ),
      );
    }
  } else {
    // re-throw other errors so they show up in the UI
    if (err instanceof Error) {
      logger.logError(err.name, err);
    }
    throw err;
  }
}

export function deactivate() {}
