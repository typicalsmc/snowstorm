# Snowstorm

Custom editor for Minecraft Bedrock Edition particle files. Available as a web app, VSCode Extension, and MCP Server:
* **Web App:** [snowstorm.app](https://snowstorm.app/)
* **VSCode Extension:** [Snowstorm - Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=JannisX11.snowstorm)
* **MCP Server:** AI-powered particle editing via Model Context Protocol (see [mcp-server/README.md](mcp-server/README.md))


## Interface

![Snowstorm interface screenshot](https://snowstorm.app/content/interface.png)


## Development

1. Install node and run `npm install` to install all dependencies

2. Run `npm run watch` to run the bundler and update whenever you change anything

3. Open the app

	#### Web app:

	Use your preferred local server to host the app (npx serve, xampp, etc.), and open it in your browser

	#### VS Code Extension:

	Press F5 to run the Extension Development Host in a new VS Code instance

## MCP Server

Snowstorm includes an MCP (Model Context Protocol) server that allows AI assistants to interact with particle files. See the [MCP Server documentation](mcp-server/README.md) for setup and usage instructions.
