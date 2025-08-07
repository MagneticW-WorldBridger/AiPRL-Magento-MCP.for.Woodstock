# 🚀 Railway Deployment Guide for Magento MCP Server

## 📋 Pre-Deployment Checklist

✅ **HTTP/SSE Version Created**: `mcp-server-http.js` (ready for Railway)  
✅ **All 26 Tools Implemented**: Complete parity with your Postman collection  
✅ **Railway Config Files**: `railway.json`, `Procfile`, updated `package.json`  
✅ **Environment Variables**: `.env` file ready (don't commit this!)  

## 🔧 Railway Deployment Steps

### 1. **Create Railway Project**
```bash
# Install Railway CLI (if not installed)
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway new
```

### 2. **Deploy Your MCP Server**
```bash
# Link to your Railway project
railway link

# Add environment variables to Railway
railway variables set MAGENTO_BASE_URL="https://woodstockoutlet.com/rest/V1"
railway variables set MAGENTO_API_TOKEN="your-current-token-here"
railway variables set NODE_TLS_REJECT_UNAUTHORIZED="0"

# Deploy
railway up
```

### 3. **Get Your Railway URL**
After deployment, Railway will provide you with a URL like:
```
https://your-project-name.up.railway.app
```

### 4. **Your MCP Endpoints**
- **Health Check**: `https://your-project-name.up.railway.app/health`
- **MCP SSE Endpoint**: `https://your-project-name.up.railway.app/sse`

## 🔌 Connecting to Claude Desktop

Add this to your Claude Desktop config:
```json
{
  "mcpServers": {
    "magento_railway": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-fetch",
        "https://your-project-name.up.railway.app/sse"
      ]
    }
  }
}
```

## 🛠️ Environment Variables on Railway

Set these in your Railway dashboard:
- `MAGENTO_BASE_URL`: Your Magento REST API base URL
- `MAGENTO_API_TOKEN`: Your Magento integration token
- `NODE_TLS_REJECT_UNAUTHORIZED`: Set to "0" for development (remove in production)
- `PORT`: Railway sets this automatically

## 📊 Available Tools (26 Total)

### Product Management (9 tools)
- `get_product_by_sku` - Get product details by SKU
- `get_product_by_id` - Get product details by ID  
- `search_products` - Search products by name
- `advanced_product_search` - Advanced filtering
- `get_product_attributes` - Get all product attributes
- `get_product_stock` - Get stock information
- `get_related_products` - Get related products
- `get_product_media` - Get product images/media
- `update_product_attribute` - Update product attributes

### Category & Attribute Management (5 tools)
- `get_all_categories` - Get complete category tree
- `get_product_categories` - Get categories for specific product
- `get_attribute_sets` - Get all attribute sets
- `get_color_attribute` - Get color attribute options
- `get_brand_options` - Get all brand options

### Advanced Product Tools (4 tools)
- `get_configurable_products` - Get configurable products
- `get_products_with_pim_key` - Get products with PIM unique ID
- `get_product_by_loft_id` - Search by Loft ID
- `get_multiple_products_by_ids` - Bulk product retrieval

### Customer Management (2 tools)
- `get_customer_by_id` - Get customer details by ID
- `get_customer_ordered_products_by_email` - Get customer order history

### Order Management (3 tools)
- `get_pending_orders` - Get all pending orders
- `get_customer_orders_by_id` - Get orders by customer ID
- `get_customer_orders_by_email` - Get orders by customer email (existing)

### Analytics & Reports (4 tools)
- `get_revenue` - Revenue analytics with date ranges
- `get_order_count` - Order count statistics  
- `get_product_sales` - Product sales statistics
- `get_revenue_by_country` - Revenue filtered by country

## 🔄 Token Management

Your Magento tokens expire every hour. For production:

1. **Option 1**: Create a permanent integration token in Magento Admin
2. **Option 2**: Set up automatic token refresh (advanced)

## 🚨 Security Notes

- Never commit `.env` file to git
- Remove `NODE_TLS_REJECT_UNAUTHORIZED=0` in production
- Use HTTPS-only tokens in production
- Restrict Railway domain in CORS if needed

## ✅ Testing Your Deployment

```bash
# Test health endpoint
curl https://your-project-name.up.railway.app/health

# Test SSE endpoint (should return event stream)
curl -H "Accept: text/event-stream" https://your-project-name.up.railway.app/sse
```

## 🎯 You're Ready!

Your MCP server will be accessible at:
**`https://your-project-name.up.railway.app/sse`**

Add this URL to Claude Desktop and start casting spells! 🔮⚡ 