# Example MCP Server Usage

This file demonstrates how to use the Snowstorm MCP server with example commands.

## Testing the Server

You can test the server using the included test script:

```bash
cd mcp-server
node src/test.js
```

## Example Tool Calls

### 1. List Available Particle Examples

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "list_particle_examples",
    "arguments": {}
  }
}
```

**Response:**
```json
{
  "examples": [
    "billboard", "drop_splash", "drops", "fire", 
    "loading", "magic", "rain", "rainbow", "snow", "trail"
  ],
  "count": 10,
  "description": "Available particle effect examples in Snowstorm"
}
```

### 2. Read a Particle File

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "read_particle_file",
    "arguments": {
      "filename": "fire"
    }
  }
}
```

### 3. Validate a Particle Configuration

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "validate_particle_file",
    "arguments": {
      "content": "{\"format_version\":\"1.10.0\",\"particle_effect\":{\"description\":{\"identifier\":\"test:particle\"},\"components\":{}}}"
    }
  }
}
```

**Response:**
```json
{
  "valid": true,
  "errors": [],
  "message": "Particle file is valid"
}
```

### 4. Create a Particle Template

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "create_particle_template",
    "arguments": {
      "identifier": "mypack:explosion",
      "emitter_type": "instant"
    }
  }
}
```

**Response includes:**
```json
{
  "success": true,
  "message": "Created instant particle template",
  "template": {
    "format_version": "1.10.0",
    "particle_effect": {
      "description": {
        "identifier": "mypack:explosion",
        "basic_render_parameters": {
          "material": "particles_alpha",
          "texture": "textures/particle/particles"
        }
      },
      "components": {
        "minecraft:emitter_rate_instant": {
          "num_particles": 10
        },
        ...
      }
    }
  }
}
```

### 5. Get Particle Component Information

List all components:
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tools/call",
  "params": {
    "name": "get_particle_components",
    "arguments": {}
  }
}
```

Get specific component details:
```json
{
  "jsonrpc": "2.0",
  "id": 6,
  "method": "tools/call",
  "params": {
    "name": "get_particle_components",
    "arguments": {
      "component_name": "minecraft:emitter_rate_steady"
    }
  }
}
```

**Response:**
```json
{
  "component_name": "minecraft:emitter_rate_steady",
  "description": "Emits particles at a steady rate",
  "properties": {
    "spawn_rate": "Number of particles to spawn per second",
    "max_particles": "Maximum number of particles that can exist at once"
  }
}
```

## Using with AI Assistants

Once configured in your MCP client (like Claude Desktop), you can ask natural language questions:

- "List all particle examples"
- "Show me the fire particle configuration"
- "Create a new particle effect called 'mypack:sparkle' with instant emission"
- "What components are available for particle motion?"
- "Validate this particle file: {...}"

The AI assistant will use these tools to help you work with Minecraft particle effects!
