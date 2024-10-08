#!/usr/bin/env node

const commander = require('commander');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
require('dotenv').config();

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const program = new commander.Command();

// Helper function to get emoji suggestions using Gemini
async function getProjectEmoji(projectName, description) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `Suggest 1-2 relevant emojis for a project named "${projectName}" with description: "${description}". Only return the emojis, nothing else.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.warn('Failed to generate emojis:', error);
    return '';
  }
}

// Helper function to generate a relevant GIF search query using Gemini
async function generateGifSearchQuery(projectName, description) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `Given a project named "${projectName}" with description: "${description}", 
    generate a short, specific phrase (2-4 words) that would make a good search query for finding a relevant GIF.
    The phrase should capture the main concept or action of the project.
    For example:
    - For a "Task Manager App": "productivity organization"
    - For a "Weather App": "weather forecast"
    - For a "Chat Application": "real time chat"
    Only return the search phrase, nothing else.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.warn('Failed to generate GIF search query:', error);
    return projectName; // Fallback to project name if AI fails
  }
}

// Helper function to get a relevant GIF using Giphy API
async function getProjectGif(projectName, description) {
  try {
    // Get an AI-generated search query
    const searchQuery = await generateGifSearchQuery(projectName, description);
    console.log('🎯 Using search query for GIF:', searchQuery);

    const response = await axios.get(
      `https://api.giphy.com/v1/gifs/search?api_key=${process.env.GIPHY_API_KEY}&q=${encodeURIComponent(searchQuery)}&limit=1&rating=g`
    );
    if (response.data.data && response.data.data[0]) {
      return response.data.data[0].images.original.url;
    }
    return '';
  } catch (error) {
    console.warn('Failed to fetch GIF:', error);
    return '';
  }
}

// Helper function to get project type description using Gemini
async function getProjectTypeDescription(projectName, description) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `Based on the project name "${projectName}" and description "${description}", provide a brief (2-3 sentences) technical explanation of what type of project this is and its main purpose. Be concise and professional.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.warn('Failed to generate project type description:', error);
    return description;
  }
}

program
  .version('1.0.0')
  .description('CLI tool to generate a README.md file with AI-enhanced features');

program
  .command('init <projectName> <description>')
  .description('Initialize a new README with AI-enhanced content')
  .option('--template <type>', 'Choose a README template', 'simple')
  .option('--license <type>', 'Specify the license type', 'MIT')
  .option('--install <commands>', 'Installation commands', 'npm install')
  .option('--usage <example>', 'Usage example', 'npm start')
  .option('--contributing <guidelines>', 'Contributing guidelines', 'Feel free to submit a pull request!')
  .option('--badges <badgeList>', 'Comma-separated list of badges', 'BuildStatus')
  .option('--table-of-contents', 'Include a table of contents')
  .action(async (projectName, description, options) => {
    const { license, install, usage, contributing, badges, tableOfContents } = options;

    console.log('🤖 Generating AI-enhanced README...');

    // Get AI-generated content
    const [emojis, gifUrl, aiDescription] = await Promise.all([
      getProjectEmoji(projectName, description),
      getProjectGif(projectName, description),
      getProjectTypeDescription(projectName, description)
    ]);

    // Generate Table of Contents if the option is provided
    let toc = '';
    if (tableOfContents) {
      toc = `## Table of Contents\n\n- [Overview](#overview)\n- [Features](#features)\n- [License](#license)\n- [Installation](#installation)\n- [Usage](#usage)\n- [Contributing](#contributing)\n\n`;
    }

    // Generate badge section from badge list
    const badgeSection = badges
      .split(',')
      .map(badge => `![${badge}](https://img.shields.io/badge/${badge}-blue)`)
      .join(' ');

    // Construct the README content with AI-enhanced features
    const readmeContent = `# ${emojis} ${projectName}\n\n${badgeSection}\n\n${toc}## Overview\n\n${aiDescription}\n\n${
      gifUrl ? `![Project Demo](${gifUrl})\n\n` : ''
    }## Features\n\n${description}\n\n## License\n\nThis project is licensed under the ${license} License.\n\n## Installation\n\n\`\`\`bash\n${install}\n\`\`\`\n\n## Usage\n\n\`\`\`bash\n${usage}\n\`\`\`\n\n## Contributing\n\n${contributing}\n`;

    // Write the README content to a file
    fs.writeFileSync(path.join(process.cwd(), 'README.md'), readmeContent);
    console.log('✨ AI-enhanced README.md has been generated successfully!');
  });

program.parse(process.argv);