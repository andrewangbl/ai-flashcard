import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";
import { LLMChain } from "langchain/chains";
import { SequentialChain } from "langchain/chains";

const model = new OpenAI({ temperature: 0 });

const fileSummaryPrompt = new PromptTemplate({
  template: "Summarize the following code file, focusing on classes, functions, and important variables:\n\n{fileContent}",
  inputVariables: ["fileContent"],
});

const fileSummaryChain = new LLMChain({
  llm: model,
  prompt: fileSummaryPrompt,
  outputKey: "fileSummary",
});

const repoMapPrompt = new PromptTemplate({
  template: "Create a repository map from the following file summaries:\n\n{fileSummaries}",
  inputVariables: ["fileSummaries"],
});

const repoMapChain = new LLMChain({
  llm: model,
  prompt: repoMapPrompt,
  outputKey: "repoMap",
});

const overallChain = new SequentialChain({
  chains: [fileSummaryChain, repoMapChain],
  inputVariables: ["fileContent", "fileSummaries"],
  outputVariables: ["fileSummary", "repoMap"],
});

export async function summarizeFile(fileContent) {
  const result = await fileSummaryChain.call({ fileContent });
  return result.fileSummary;
}

export async function createRepoMap(fileSummaries) {
  const result = await repoMapChain.call({ fileSummaries });
  return result.repoMap;
}
