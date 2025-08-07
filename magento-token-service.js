const { Pool } = require('pg');
const axios = require('axios');

class MagentoTokenService {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    this.magentoBaseUrl = process.env.MAGENTO_BASE_URL || 'https://woodstockoutlet.com/rest/V1';
    this.magentoUsername = process.env.MAGENTO_USERNAME;
    this.magentoPassword = process.env.MAGENTO_PASSWORD;
    
    if (!this.magentoUsername || !this.magentoPassword) {
      console.error('❌ ERROR: MAGENTO_USERNAME and MAGENTO_PASSWORD are required');
      throw new Error('Missing Magento credentials');
    }
    
    console.log('🔧 MagentoTokenService initialized with database connection');
  }

  async getFreshToken() {
    try {
      // Always get the freshest token from database
      const result = await this.pool.query(`
        SELECT access_token, expires_at 
        FROM magento_tokens 
        WHERE service_name = 'magento_api' 
          AND is_active = true 
          AND expires_at > NOW()
        ORDER BY updated_at DESC 
        LIMIT 1
      `);

      if (result.rows.length > 0) {
        const token = result.rows[0].access_token;
        const expiresAt = result.rows[0].expires_at;
        console.log(`🔑 Fresh Magento token retrieved from database (expires: ${expiresAt})`);
        return token;
      }

      // If no valid token found, generate a new one
      console.log('🔄 No valid token found in database, generating fresh token...');
      return await this.generateNewToken();

    } catch (error) {
      console.error('❌ Error getting fresh token from database:', error.message);
      
      // Fallback: try to generate new token
      console.log('🔄 Attempting to generate new token as fallback...');
      return await this.generateNewToken();
    }
  }

  async generateNewToken() {
    try {
      console.log('🔄 Generating new Magento API token...');
      
      // Use the exact endpoint from your Postman collection
      const response = await axios({
        method: 'POST',
        url: 'https://woodstockoutlet.com/rest/all/V1/integration/admin/token',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          username: this.magentoUsername,
          password: this.magentoPassword
        },
        // Bypass SSL for development (matching your current setup)
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: false
        })
      });

      if (response.status !== 200) {
        throw new Error(`Magento token request failed with status: ${response.status}`);
      }

      // Clean the token (remove quotes)
      const newToken = response.data.replace(/"/g, '');
      
      // Store in database with 50-minute expiry (safe margin from 60-minute actual expiry)
      await this.pool.query(`
        INSERT INTO magento_tokens (service_name, access_token, expires_at, is_active, created_at, updated_at)
        VALUES ('magento_api', $1, NOW() + INTERVAL '50 minutes', true, NOW(), NOW())
        ON CONFLICT (service_name) 
        DO UPDATE SET 
          access_token = EXCLUDED.access_token,
          expires_at = EXCLUDED.expires_at,
          updated_at = NOW(),
          is_active = true
      `, [newToken]);

      console.log('✅ Fresh token generated and stored in database');
      return newToken;

    } catch (error) {
      console.error('❌ Error generating new Magento token:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      throw error;
    }
  }

  async makeAuthenticatedRequest(endpoint, method = 'GET', data = null) {
    try {
      const token = await this.getFreshToken();
      const url = `${this.magentoBaseUrl}${endpoint}`;
      
      const config = {
        method,
        url,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: data ? JSON.stringify(data) : undefined,
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: false
        })
      };
      
      const response = await axios(config);
      return response.data;
      
    } catch (error) {
      // If we get a 401, the token might be expired - try refreshing once
      if (error.response && error.response.status === 401) {
        console.log('🔄 Got 401 error, token might be expired. Generating new token...');
        
        try {
          const newToken = await this.generateNewToken();
          
          // Retry the request with new token
          const retryConfig = {
            method,
            url: `${this.magentoBaseUrl}${endpoint}`,
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json'
            },
            data: data ? JSON.stringify(data) : undefined,
            httpsAgent: new (require('https').Agent)({
              rejectUnauthorized: false
            })
          };
          
          const retryResponse = await axios(retryConfig);
          console.log('✅ Request succeeded after token refresh');
          return retryResponse.data;
          
        } catch (retryError) {
          console.error('❌ Request failed even after token refresh:', retryError.message);
          throw retryError;
        }
      }
      
      console.error('❌ Magento API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Utility method to check token status
  async getTokenStatus() {
    try {
      const result = await this.pool.query(`
        SELECT access_token, expires_at, created_at, updated_at, is_active
        FROM magento_tokens 
        WHERE service_name = 'magento_api' 
        ORDER BY updated_at DESC 
        LIMIT 1
      `);

      if (result.rows.length > 0) {
        const token = result.rows[0];
        const now = new Date();
        const expiresAt = new Date(token.expires_at);
        const isExpired = expiresAt <= now;
        const timeUntilExpiry = expiresAt - now;
        const minutesUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60));

        return {
          hasToken: true,
          isActive: token.is_active,
          isExpired: isExpired,
          expiresAt: token.expires_at,
          minutesUntilExpiry: isExpired ? 0 : minutesUntilExpiry,
          lastUpdated: token.updated_at
        };
      }

      return {
        hasToken: false,
        isActive: false,
        isExpired: true,
        expiresAt: null,
        minutesUntilExpiry: 0,
        lastUpdated: null
      };

    } catch (error) {
      console.error('❌ Error checking token status:', error.message);
      throw error;
    }
  }

  // Close database connection (for cleanup)
  async close() {
    await this.pool.end();
    console.log('🔒 Database connection closed');
  }
}

module.exports = MagentoTokenService; 