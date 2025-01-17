const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function decodeBase64(base64String) {
  try {
    return Buffer.from(base64String, "base64").toString("utf-8");
  } catch (error) {
    console.error("Error decoding base64:", error);
    return null;
  }
}

function loadExamples() {
  try {
    const base64Examples = process.env.EXAMPLES_BASE64;
    if (!base64Examples) {
      console.warn("EXAMPLES_BASE64 environment variable is not set");
      return [];
    }

    const decodedExamples = decodeBase64(base64Examples);
    if (!decodedExamples) {
      console.error("Failed to decode EXAMPLES_BASE64");
      return [];
    }

    return JSON.parse(decodedExamples);
  } catch (error) {
    console.error("Error parsing EXAMPLES:", error);
    return [];
  }
}

function formatExample(input, output) {
  return `Input: ${JSON.stringify(input, null, 2)}
Output: ${JSON.stringify({ results: output }, null, 2)}`;
}

function constructUserPrompt(messageData) {
  const examples = loadExamples();
  const examplesText = examples
    .map((ex) => formatExample(ex.input, ex.output))
    .join("\n\n");

  return `Analyze the following message and extract time-off information:
${JSON.stringify(messageData, null, 2)}

Examples for reference:
${examplesText}`;
}

async function analyzeMessage(messageData) {
  try {
    let retries = 3;
    let lastError = null;

    while (retries > 0) {
      let response = 0;
      try {
        const systemPrompt = decodeBase64(process.env.SYSTEM_PROMPT_BASE64);
        if (!systemPrompt) {
          throw new Error("Failed to decode SYSTEM_PROMPT_BASE64");
        }

        response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: constructUserPrompt(messageData),
            },
          ],
          temperature: 0,
        });

        const content = JSON.parse(response.choices[0].message.content);
        const usage = response.usage;

        if (!content || typeof content !== "object") {
          throw new Error("Invalid response format");
        }

        let results;
        if (content.results && Array.isArray(content.results)) {
          results = content.results;
        } else if (!Array.isArray(content) && content.date) {
          results = [content];
        } else if (Array.isArray(content)) {
          results = content;
        } else {
          results = [];
        }

        return {
          results,
          usage: {
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens,
          },
        };
      } catch (error) {
        console.log(JSON.stringify(response, null, 2), "responseresponse");
        lastError = error;
        retries--;
        if (retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
      }
    }

    throw lastError;
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw error;
  }
}

module.exports = { analyzeMessage };
