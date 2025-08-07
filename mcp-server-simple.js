#!/usr/bin/env node
const express = require('express');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { SSEServerTransport } = require('@modelcontextprotocol/sdk/server/sse.js');
const { z } = require('zod');

const app = express();
const PORT = process.env.PORT || 3000;

// Create MCP server
const server = new McpServer({
  name: "magento-mcp-simple",
  version: "1.0.0"
});

// Add a simple health check tool (no database needed)
server.tool(
  "health_check",
  "Check if the MCP server is running",
  {},
  async () => {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ 
            status: "MCP server is running!", 
            timestamp: new Date().toISOString(),
            message: "This is a simplified version without database dependency"
          }, null, 2)
        }
      ]
    };
  }
);

// Add a test Magento-style tool (without actual API calls)
server.tool(
  "test_magento_tool",
  "Test Magento-style tool without actual API calls",
  {
    test_param: z.string().describe("A test parameter")
  },
  async ({ test_param }) => {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            message: "This would be a Magento API response",
            test_param: test_param,
            timestamp: new Date().toISOString(),
            note: "No actual Magento API calls made - this is just a test"
          }, null, 2)
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
  console.log('Simple Magento SSE connection received');
  
  try {
    const transport = new SSEServerTransport('/sse', res);
    await server.connect(transport);
    console.log('Simple Magento MCP server connected');
  } catch (error) {
    console.error('Simple Magento MCP error:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).send('Simple Magento MCP connection failed');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Simple Magento MCP server running on port ${PORT}`);
  console.log(`📡 SSE endpoint: http://localhost:${PORT}/sse`);
}); 