#!/usr/bin/env node

const { Command } = require('commander');
const fs = require('fs');
const path = require('path');

const program = new Command();

program
  .version('1.0.0')
  .description('CLI tool to generate a README.md file');

program
  .command('init <projectName> <description>')
  .description('Initialize a new README')
  .option('--template <type>', 'Choose a README template', 'simple')
  .option('--license <type>', 'Specify the license type', 'MIT')
  .option('--install <commands>', 'Installation commands', 'npm install')
  .option('--usage <example>', 'Usage example', 'npm start')
  .option('--contributing <guidelines>', 'Contributing guidelines', 'Feel free to submit a pull request!')
  .option('--badges <badgeList>', 'Comma-separated list of badges', 'Build Status')
  .option('--table-of-contents', 'Include a table of contents')
  .action((projectName, description, options) => {
    const { license, install, usage, contributing, badges, tableOfContents } = options;

    // Generate Table of Contents if the option is provided
    let toc = '';
    if (tableOfContents) {
      toc = '## Table of Contents\n\n- [License](#license)\n- [Installation](#installation)\n- [Usage](#usage)\n- [Contributing](#contributing)\n\n';
    }

    // Generate badge section from badge list
    const badgeSection = badges.split(',').map(badge => `![${badge}](https://img.shields.io/badge/${badge}-blue)`).join(' ');

    // Construct the README content
    const readmeContent = `# ${projectName}\n\n${badgeSection}\n\n${toc}${description}\n\n## License\n\nThis project is licensed under the ${license} License.\n\n## Installation\n\n\`\`\`\n${install}\n\`\`\`\n\n## Usage\n\n\`\`\`\n${usage}\n\`\`\`\n\n## Contributing\n\n${contributing}\n`;

    // Write the README content to a file
    fs.writeFileSync(path.join(process.cwd(), 'README.md'), readmeContent);
    console.log('README.md has been generated!');
  });

program.parse(process.argv);
