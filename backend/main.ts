import { SystemMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { END, MemorySaver, MessagesAnnotation, START, StateGraph } from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

const getWeather = tool(
  async ({ location }) => ({
    city: location,
    temperature: 68,
    humidity: 55,
    wind_speed: 10,
    conditions: "Sunny",
  }),
  {
    name: "getWeather",
    description: "Get the current weather for a given location.",
    schema: z.object({
      location: z.string().describe("The location to get the weather for"),
    }),
  }
);

const tools = [getWeather];

async function mock_llm(state: typeof MessagesAnnotation.State) {
  const model = new ChatOpenAI({ model: "gpt-4.1-mini" }).bindTools(tools);
  const systemMessage = new SystemMessage("You are a helpful assistant.");
  const response = await model.invoke([systemMessage, ...state.messages]);
  return { messages: [response] };
}

export const graph = new StateGraph(MessagesAnnotation)
  .addNode("mock_llm", mock_llm)
  .addNode("tools", new ToolNode(tools))
  .addEdge(START, "mock_llm")
  .addConditionalEdges("mock_llm", toolsCondition, { tools: "tools", [END]: END })
  .addEdge("tools", "mock_llm")
  // The LangGraph dev server supplies its own persistence; this keeps the graph
  // usable when imported and invoked directly.
  .compile({ checkpointer: new MemorySaver() });
