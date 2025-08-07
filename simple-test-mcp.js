#!/usr/bin/env node
const express = require('express');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { SSEServerTransport } = require('@modelcontextprotocol/sdk/server/sse.js');
const { z } = require('zod');

const app = express();
const PORT = process.env.PORT || 3000;

// Create MCP server
const server = new McpServer({
  name: "simple-test-mcp",
  version: "1.0.0"
});

// Add a simple test tool
server.tool(
  "test_tool",
  "A simple test tool",
  {
    message: z.string().describe("A test message")
  },
  async ({ message }) => {
    return {
      content: [
        {
          type: "text",
          text: `Test response: ${message}`
        }
      ]
    };
  }
);

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// SSE endpoint
app.get('/sse', async (req, res) => {
  console.log('Simple SSE connection received');
  
  try {
    const transport = new SSEServerTransport('/sse', res);
    await server.connect(transport);
    console.log('Simple MCP server connected');
  } catch (error) {
    console.error('Simple MCP error:', error.message);
    res.status(500).send('Simple MCP connection failed');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Simple MCP test server running on port ${PORT}`);
  console.log(`📡 SSE endpoint: http://localhost:${PORT}/sse`);
}); 