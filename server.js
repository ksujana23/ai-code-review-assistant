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

    // Extract GitHub details
    const match = prUrl.match(
      /github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/
    );

    if (!match) {
      return res.status(400).json({
        error: "Invalid PR URL",
      });
    }

    const owner = match[1];
    const repo = match[2];
    const pullNumber = match[3];

    // GitHub API URL
    const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/files`;

    // Fetch PR files
    const githubResponse = await axios.get(githubApiUrl, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      },
    });

    const files = githubResponse.data;

    let codeChanges = "";

    files.forEach((file) => {
      codeChanges += `
File: ${file.filename}

Patch:
${file.patch}
`;
    });

    // AI Prompt
    const prompt = `
You are a senior software engineer reviewing a pull request.

Analyze this code and provide:
1. Bugs
2. Improvements
3. Edge cases
4. Optimizations
5. Clean code suggestions

Code:
${codeChanges}
`;

    // OpenRouter AI Request
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a senior software engineer reviewing pull requests.",
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
    console.error(error);

    res.status(500).json({
      error: "Something went wrong",
    });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});