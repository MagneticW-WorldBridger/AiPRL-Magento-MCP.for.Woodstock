#!/usr/bin/env node
const express = require('express');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { SSEServerTransport } = require('@modelcontextprotocol/sdk/server/sse.js');
const { z } = require('zod');

const app = express();
const PORT = process.env.PORT || 3000;

// Create MCP server with proper initialization
const server = new McpServer({
  name: "magento-test-mcp",
  version: "1.0.0"
}, {
  capabilities: {
    tools: {},
    resources: {}
  }
});

console.log('🔧 MCP Server instance created');

// Add a simple working tool
server.tool(
  "test_tool",
  "A simple test tool that works",
  {
    message: z.string().describe("A test message")
  },
  async ({ message }) => {
    console.log('🔧 test_tool called with:', message);
    return {
      content: [
        {
          type: "text",
          text: `Test response: ${message} - Server is working!`
        }
      ]
    };
  }
);

console.log('✅ Tools registered');

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    tools: 1
  });
});

// SSE endpoint with proper error handling
app.get('/sse', async (req, res) => {
  console.log('🔌 SSE connection request received');
  
  try {
    console.log('🔧 Creating SSE transport...');
    const transport = new SSEServerTransport('/sse', res);
    
    console.log('🔧 Connecting MCP server to transport...');
    await server.connect(transport);
    
    console.log('✅ MCP Server connected via SSE successfully');
    
    // Handle server events
    server.on('error', (error) => {
      console.error('❌ MCP Server error:', error);
    });
    
    transport.on('error', (error) => {
      console.error('❌ SSE Transport error:', error);
    });
    
  } catch (error) {
    console.error('❌ Failed to connect MCP server:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    // Send proper error response
    res.status(500).json({
      error: 'MCP connection failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Fixed Magento MCP Server running on port ${PORT}`);
  console.log(`📡 SSE endpoint: http://localhost:${PORT}/sse`);
  console.log(`🩺 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 MCP Server initialized with capabilities:`, server.capabilities);
}); 