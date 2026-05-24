import { Client } from 'pg';

async function runOAuthMigrations() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '123',
    database: process.env.DB_NAME || 'coin_iq',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if the oauth_providers table exists
    const tableCheckQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'oauth_providers'
      );
    `;

    const tableCheckResult = await client.query(tableCheckQuery);
    const tableExists = tableCheckResult.rows[0].exists;

    if (!tableExists) {
      console.log('Creating oauth_providers table...');
      
      const createTableQuery = `
        CREATE TABLE oauth_providers (
          id SERIAL PRIMARY KEY,
          provider VARCHAR(20) NOT NULL, -- 'google' or 'facebook'
          provider_user_id VARCHAR(255) NOT NULL,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          email VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(provider, provider_user_id) -- Ensure unique provider-user combinations
        );
      `;

      await client.query(createTableQuery);
      console.log('oauth_providers table created successfully');

      // Create indexes for better query performance
      await client.query('CREATE INDEX IF NOT EXISTS idx_oauth_providers_user_id ON oauth_providers(user_id);');
      await client.query('CREATE INDEX IF NOT EXISTS idx_oauth_providers_provider_and_id ON oauth_providers(provider, provider_user_id);');
      console.log('Indexes created for oauth_providers table');

      // Create trigger for updating updated_at timestamp
      await client.query(`
        CREATE OR REPLACE FUNCTION update_oauth_providers_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql';
      `);

      await client.query(`
        CREATE TRIGGER update_oauth_providers_updated_at 
            BEFORE UPDATE ON oauth_providers 
            FOR EACH ROW 
            EXECUTE FUNCTION update_oauth_providers_updated_at_column();
      `);
      console.log('Trigger created for oauth_providers table');
    } else {
      console.log('oauth_providers table already exists');
    }

    console.log('OAuth migration completed successfully!');
  } catch (error) {
    console.error('OAuth migration error:', error);
    throw error;
  } finally {
    await client.end();
  }
}

async function main(): Promise<void> {
  await runOAuthMigrations();
  process.exit(0);
}

if (typeof require !== 'undefined' && require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

export default runOAuthMigrations;