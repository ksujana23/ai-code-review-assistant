require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const OpenAI = require("openai");

const app = express();

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

app.post("/review", async (req, res) => {
  try {
    const { prUrl } = req.body;

    // Validate PR URL
    const prUrlPattern =
      /github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/;

    const match = prUrl.match(prUrlPattern);

    if (!match) {
      return res.status(400).json({
        error: "Invalid GitHub PR URL",
      });
    }

    const owner = match[1];
    const repo = match[2];
    const pullNumber = match[3];

    console.log("Owner:", owner);
    console.log("Repo:", repo);
    console.log("PR Number:", pullNumber);

    // Fetch PR diff directly
    const diffResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`,
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3.diff",
        },
      }
    );

    const diff = diffResponse.data;

    // Prevent huge payloads
    const trimmedDiff = diff.substring(0, 12000);

    console.log(trimmedDiff.substring(0, 1000));

    // AI Prompt
    const prompt = `
You are a senior software engineer reviewing a GitHub pull request.

Analyze this PR diff and provide:

1. Bugs
2. Improvements
3. Edge cases
4. Optimizations
5. Clean code suggestions

PR Diff:
${trimmedDiff}
`;

    // OpenRouter Request
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an expert senior software engineer reviewing pull requests.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const review =
      completion.choices[0].message.content;

    res.json({
      review,
    });

  } catch (error) {
    console.error(
      error.response?.data || error.message
    );

    res.status(500).json({
      error: "Something went wrong",
    });
  }
});

app.get("/", (req, res) => {
  res.send("AI Code Review Backend Running");
});

app.listen(process.env.PORT || 5000, () => {
  console.log("Server running");
});