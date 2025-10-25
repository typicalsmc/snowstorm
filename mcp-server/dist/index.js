#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Get the examples directory path (relative to the built dist folder)
const EXAMPLES_DIR = path.join(__dirname, '../../examples');
// Particle validation schema - basic structure
function validateParticleFile(data) {
    const errors = [];
    if (!data.format_version) {
        errors.push('Missing required field: format_version');
    }
    if (!data.particle_effect) {
        errors.push('Missing required field: particle_effect');
        return { valid: false, errors };
    }
    if (!data.particle_effect.description) {
        errors.push('Missing required field: particle_effect.description');
    }
    else {
        if (!data.particle_effect.description.identifier) {
            errors.push('Missing required field: particle_effect.description.identifier');
        }
    }
    if (!data.particle_effect.components) {
        errors.push('Missing required field: particle_effect.components');
    }
    return { valid: errors.length === 0, errors };
}
// Available tools definition
const TOOLS = [
    {
        name: 'list_particle_examples',
        description: 'List all available particle effect examples in the Snowstorm project. Returns the names of example particle files that can be used as templates.',
        inputSchema: {
            type: 'object',
            properties: {},
            required: [],
        },
    },
    {
        name: 'read_particle_file',
        description: 'Read and parse a particle effect file. Accepts either an example name (e.g., "fire") or a full file path. Returns the parsed JSON content of the particle file.',
        inputSchema: {
            type: 'object',
            properties: {
                filename: {
                    type: 'string',
                    description: 'Name of the example particle (e.g., "fire", "snow") or full path to a particle file',
                },
            },
            required: ['filename'],
        },
    },
    {
        name: 'validate_particle_file',
        description: 'Validate a particle effect configuration. Checks if the provided JSON contains all required fields for a valid Minecraft Bedrock Edition particle effect.',
        inputSchema: {
            type: 'object',
            properties: {
                content: {
                    type: 'string',
                    description: 'JSON string of the particle effect to validate',
                },
            },
            required: ['content'],
        },
    },
    {
        name: 'create_particle_template',
        description: 'Generate a basic particle effect template with the specified identifier. Creates a minimal valid particle configuration that can be customized.',
        inputSchema: {
            type: 'object',
            properties: {
                identifier: {
                    type: 'string',
                    description: 'Identifier for the particle effect (e.g., "myproject:custom_particle")',
                },
                emitter_type: {
                    type: 'string',
                    description: 'Type of emitter (steady, instant, or looping)',
                    enum: ['steady', 'instant', 'looping'],
                },
            },
            required: ['identifier'],
        },
    },
    {
        name: 'get_particle_components',
        description: 'Get information about available Minecraft particle components and their properties. Helps understand what components can be used in particle effects.',
        inputSchema: {
            type: 'object',
            properties: {
                component_name: {
                    type: 'string',
                    description: 'Optional: specific component name to get details for',
                },
            },
            required: [],
        },
    },
];
// Component information
const PARTICLE_COMPONENTS = {
    'minecraft:emitter_rate_steady': {
        description: 'Emits particles at a steady rate',
        properties: {
            spawn_rate: 'Number of particles to spawn per second',
            max_particles: 'Maximum number of particles that can exist at once',
        },
    },
    'minecraft:emitter_rate_instant': {
        description: 'Emits all particles instantly',
        properties: {
            num_particles: 'Number of particles to emit',
        },
    },
    'minecraft:emitter_lifetime_looping': {
        description: 'Emitter loops continuously',
        properties: {
            active_time: 'Time the emitter is active',
            sleep_time: 'Time the emitter sleeps between loops',
        },
    },
    'minecraft:emitter_lifetime_once': {
        description: 'Emitter runs once then stops',
        properties: {
            active_time: 'Time the emitter is active',
        },
    },
    'minecraft:emitter_lifetime_expression': {
        description: 'Emitter lifetime controlled by expression',
        properties: {
            activation_expression: 'Expression to activate emitter',
            expiration_expression: 'Expression to deactivate emitter',
        },
    },
    'minecraft:emitter_shape_point': {
        description: 'Emits particles from a single point',
        properties: {
            offset: 'Offset from emitter position [x, y, z]',
            direction: 'Direction particles are emitted',
        },
    },
    'minecraft:emitter_shape_sphere': {
        description: 'Emits particles from a sphere',
        properties: {
            offset: 'Offset from emitter position [x, y, z]',
            radius: 'Radius of the sphere',
            surface_only: 'Whether particles emit only from surface',
        },
    },
    'minecraft:emitter_shape_box': {
        description: 'Emits particles from a box',
        properties: {
            offset: 'Offset from emitter position [x, y, z]',
            half_dimensions: 'Half dimensions of the box [x, y, z]',
            surface_only: 'Whether particles emit only from surface',
        },
    },
    'minecraft:emitter_shape_disc': {
        description: 'Emits particles from a disc',
        properties: {
            offset: 'Offset from emitter position [x, y, z]',
            radius: 'Radius of the disc',
            plane_normal: 'Normal vector of the disc plane',
            surface_only: 'Whether particles emit only from surface',
        },
    },
    'minecraft:particle_lifetime_expression': {
        description: 'Particle lifetime controlled by expression',
        properties: {
            max_lifetime: 'Maximum lifetime in seconds',
            expiration_expression: 'Expression for when particle expires',
        },
    },
    'minecraft:particle_initial_speed': {
        description: 'Initial speed of particles',
        properties: {
            value: 'Speed value or expression',
        },
    },
    'minecraft:particle_initial_spin': {
        description: 'Initial rotation of particles',
        properties: {
            rotation: 'Initial rotation angle',
            rotation_rate: 'Rate of rotation',
        },
    },
    'minecraft:particle_motion_dynamic': {
        description: 'Dynamic motion for particles',
        properties: {
            linear_acceleration: 'Linear acceleration [x, y, z]',
            linear_drag_coefficient: 'Air resistance coefficient',
        },
    },
    'minecraft:particle_motion_parametric': {
        description: 'Parametric motion for particles',
        properties: {
            relative_position: 'Position expression [x, y, z]',
            direction: 'Direction expression [x, y, z]',
        },
    },
    'minecraft:particle_appearance_billboard': {
        description: 'Billboard rendering (faces camera)',
        properties: {
            size: 'Size of particle [width, height]',
            facing_camera_mode: 'How particle faces camera',
            uv: 'UV mapping for texture',
        },
    },
    'minecraft:particle_appearance_tinting': {
        description: 'Color tinting for particles',
        properties: {
            color: 'Color tint [r, g, b, a] or expression',
        },
    },
    'minecraft:particle_appearance_lighting': {
        description: 'Lighting for particles',
        properties: {},
    },
};
const server = new Server({
    name: 'snowstorm-mcp-server',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: TOOLS,
    };
});
// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case 'list_particle_examples': {
                try {
                    const files = await fs.readdir(EXAMPLES_DIR);
                    const particleFiles = files.filter((f) => f.endsWith('.particle.json'));
                    const examples = particleFiles.map((f) => f.replace('.particle.json', ''));
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
                                    examples,
                                    count: examples.length,
                                    description: 'Available particle effect examples in Snowstorm',
                                }, null, 2),
                            },
                        ],
                    };
                }
                catch (error) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
                                    error: `Failed to list examples: ${error}`,
                                }),
                            },
                        ],
                        isError: true,
                    };
                }
            }
            case 'read_particle_file': {
                const filename = args?.filename;
                if (!filename) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({ error: 'filename parameter is required' }),
                            },
                        ],
                        isError: true,
                    };
                }
                try {
                    let filePath;
                    // Check if it's an example name or full path
                    if (!filename.includes('/') && !filename.endsWith('.json')) {
                        filePath = path.join(EXAMPLES_DIR, `${filename}.particle.json`);
                    }
                    else {
                        filePath = filename;
                    }
                    const content = await fs.readFile(filePath, 'utf-8');
                    const particleData = JSON.parse(content);
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
                                    success: true,
                                    filename: path.basename(filePath),
                                    data: particleData,
                                }, null, 2),
                            },
                        ],
                    };
                }
                catch (error) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
                                    error: `Failed to read particle file: ${error}`,
                                }),
                            },
                        ],
                        isError: true,
                    };
                }
            }
            case 'validate_particle_file': {
                const content = args?.content;
                if (!content) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({ error: 'content parameter is required' }),
                            },
                        ],
                        isError: true,
                    };
                }
                try {
                    const particleData = JSON.parse(content);
                    const validation = validateParticleFile(particleData);
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
                                    valid: validation.valid,
                                    errors: validation.errors,
                                    message: validation.valid
                                        ? 'Particle file is valid'
                                        : 'Particle file has validation errors',
                                }, null, 2),
                            },
                        ],
                    };
                }
                catch (error) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
                                    valid: false,
                                    error: `Invalid JSON: ${error}`,
                                }),
                            },
                        ],
                        isError: true,
                    };
                }
            }
            case 'create_particle_template': {
                const identifier = args?.identifier;
                const emitterType = args?.emitter_type || 'steady';
                if (!identifier) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({ error: 'identifier parameter is required' }),
                            },
                        ],
                        isError: true,
                    };
                }
                let emitterComponent = {};
                let lifetimeComponent = {};
                switch (emitterType) {
                    case 'steady':
                        emitterComponent = {
                            'minecraft:emitter_rate_steady': {
                                spawn_rate: 10,
                                max_particles: 100,
                            },
                        };
                        lifetimeComponent = {
                            'minecraft:emitter_lifetime_looping': {
                                active_time: 1,
                            },
                        };
                        break;
                    case 'instant':
                        emitterComponent = {
                            'minecraft:emitter_rate_instant': {
                                num_particles: 10,
                            },
                        };
                        lifetimeComponent = {
                            'minecraft:emitter_lifetime_once': {
                                active_time: 1,
                            },
                        };
                        break;
                    case 'looping':
                        emitterComponent = {
                            'minecraft:emitter_rate_steady': {
                                spawn_rate: 5,
                                max_particles: 50,
                            },
                        };
                        lifetimeComponent = {
                            'minecraft:emitter_lifetime_looping': {
                                active_time: 2,
                                sleep_time: 1,
                            },
                        };
                        break;
                }
                const template = {
                    format_version: '1.10.0',
                    particle_effect: {
                        description: {
                            identifier,
                            basic_render_parameters: {
                                material: 'particles_alpha',
                                texture: 'textures/particle/particles',
                            },
                        },
                        components: {
                            ...emitterComponent,
                            ...lifetimeComponent,
                            'minecraft:emitter_shape_point': {
                                offset: [0, 0, 0],
                            },
                            'minecraft:particle_lifetime_expression': {
                                max_lifetime: 1,
                            },
                            'minecraft:particle_initial_speed': 1,
                            'minecraft:particle_appearance_billboard': {
                                size: [0.1, 0.1],
                                facing_camera_mode: 'lookat_xyz',
                            },
                        },
                    },
                };
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                success: true,
                                message: `Created ${emitterType} particle template`,
                                template,
                            }, null, 2),
                        },
                    ],
                };
            }
            case 'get_particle_components': {
                const componentName = args?.component_name;
                if (componentName) {
                    const component = PARTICLE_COMPONENTS[componentName];
                    if (!component) {
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify({
                                        error: `Component '${componentName}' not found`,
                                        available_components: Object.keys(PARTICLE_COMPONENTS),
                                    }),
                                },
                            ],
                            isError: true,
                        };
                    }
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
                                    component_name: componentName,
                                    ...component,
                                }, null, 2),
                            },
                        ],
                    };
                }
                else {
                    // Return all components
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
                                    components: PARTICLE_COMPONENTS,
                                    count: Object.keys(PARTICLE_COMPONENTS).length,
                                }, null, 2),
                            },
                        ],
                    };
                }
            }
            default:
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({ error: `Unknown tool: ${name}` }),
                        },
                    ],
                    isError: true,
                };
        }
    }
    catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        error: `Error executing tool: ${error}`,
                    }),
                },
            ],
            isError: true,
        };
    }
});
// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Snowstorm MCP Server running on stdio');
}
main().catch((error) => {
    console.error('Fatal error in main():', error);
    process.exit(1);
});
