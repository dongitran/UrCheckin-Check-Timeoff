const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function loadExamples() {
  const examples = [];
  const envVars = Object.keys(process.env);
  
  envVars.forEach(key => {
    if (key.startsWith('EXAMPLE_')) {
      try {
        const example = JSON.parse(process.env[key]);
        examples.push(example);
      } catch (error) {
        console.error(`Error parsing example ${key}:`, error);
      }
    }
  });
  
  return examples;
}

function formatExample(input, output) {
  return `Input: ${JSON.stringify(input, null, 2)}
Output: ${JSON.stringify({ results: output }, null, 2)}`;
}

function constructUserPrompt(messageData) {
  const examples = loadExamples();
  const examplesText = examples.map((ex) =>
    formatExample(ex.input, ex.output)
  ).join("\n\n");

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
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: process.env.SYSTEM_PROMPT,
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
            totalTokens: usage.total_tokens
          }
        };

      } catch (error) {
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