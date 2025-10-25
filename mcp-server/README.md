# Snowstorm MCP Server

MCP (Model Context Protocol) server for the Snowstorm Minecraft Bedrock Edition particle editor. This server allows AI assistants to interact with particle files, validate them, and generate templates.

## Features

The Snowstorm MCP server provides the following tools:

### 1. list_particle_examples
Lists all available particle effect examples in the Snowstorm project.

**Returns:** Array of example particle names that can be used as templates.

### 2. read_particle_file
Reads and parses a particle effect file.

**Parameters:**
- `filename` (string): Name of the example particle (e.g., "fire", "snow") or full path to a particle file

**Returns:** Parsed JSON content of the particle file.

### 3. validate_particle_file
Validates a particle effect configuration.

**Parameters:**
- `content` (string): JSON string of the particle effect to validate

**Returns:** Validation result with any errors found.

### 4. create_particle_template
Generates a basic particle effect template.

**Parameters:**
- `identifier` (string): Identifier for the particle effect (e.g., "myproject:custom_particle")
- `emitter_type` (string, optional): Type of emitter - "steady", "instant", or "looping" (default: "steady")

**Returns:** A minimal valid particle configuration that can be customized.

### 5. get_particle_components
Gets information about available Minecraft particle components.

**Parameters:**
- `component_name` (string, optional): Specific component name to get details for

**Returns:** Information about particle components and their properties.

## Installation

### Local Development

1. Navigate to the mcp-server directory:
```bash
cd mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Build the server:
```bash
npm run build
```

### Using with Claude Desktop

Add this configuration to your Claude Desktop config file:

**MacOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "snowstorm": {
      "command": "node",
      "args": [
        "/absolute/path/to/snowstorm/mcp-server/dist/index.js"
      ]
    }
  }
}
```

Replace `/absolute/path/to/snowstorm` with the actual path to your Snowstorm repository.

### Using with Other MCP Clients

The server uses stdio transport and can be used with any MCP client that supports stdio:

```bash
node /path/to/snowstorm/mcp-server/dist/index.js
```

## Example Usage

Once connected, you can ask your AI assistant to:

- "List all particle examples"
- "Read the fire particle file"
- "Validate this particle configuration: {...}"
- "Create a particle template with identifier 'mypack:explosion' using instant emitter"
- "What components are available for particle effects?"
- "Show me details about the minecraft:emitter_rate_steady component"

## Development

To watch for changes and rebuild automatically:

```bash
npm run dev
```

## About Snowstorm

Snowstorm is a custom editor for Minecraft Bedrock Edition particle files. It's available as:
- **Web App:** [snowstorm.app](https://snowstorm.app/)
- **VSCode Extension:** [Snowstorm - Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=JannisX11.snowstorm)

## License

GPL-3.0-or-later (same as the main Snowstorm project)
