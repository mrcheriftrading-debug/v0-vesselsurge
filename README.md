# Maritime Hotspot Updater

## Overview
The Maritime Hotspot Updater is a tool designed to facilitate the tracking and updating of maritime hotspots. This README provides setup instructions, including the necessary GitHub Secrets configuration and SQL commands for creating the required Supabase tables.

## Prerequisites
- A GitHub account with access to the repository.
- A Supabase account for managing the database and tables.

## GitHub Secrets Configuration
To securely store sensitive information, use GitHub Secrets. Follow these steps to configure your GitHub Secrets:

1. Navigate to your GitHub repository (mrcheriftrading-debug/v0-vesselsurge).
2. Go to the **Settings** tab.
3. In the left sidebar, click on **Secrets and variables** > **Actions** > **New repository secret**.
4. Create the following secrets:
   - `SUPABASE_URL`: Your Supabase project URL.
   - `SUPABASE_ANON_KEY`: Your Supabase anonymous key.
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (if applicable).

Ensure that the secret names match the keys used in your codebase.

## Supabase Table Creation
To set up the database for the Maritime Hotspot Updater, you will need to create the required tables in your Supabase project. Use the following SQL commands to create the necessary tables:

```sql
-- Create hotspots table
CREATE TABLE hotspots (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    latitude DECIMAL(9,6) NOT NULL,
    longitude DECIMAL(9,6) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create updates table
CREATE TABLE updates (
    id SERIAL PRIMARY KEY,
    hotspot_id INTEGER REFERENCES hotspots(id),
    update_description TEXT NOT NULL,
    update_time TIMESTAMP DEFAULT NOW()
);
```

### Notes
- Replace the SQL commands as per your specific requirements.
- Ensure your Supabase project is correctly set up and accessible by your application.

## Running the Updater
1. Clone the repository to your local machine using `git clone <repository-url>`.
2. Install necessary dependencies.
3. Run the application using the provided commands in the documentation.

## Conclusion
You have now configured the Maritime Hotspot Updater. Follow the above instructions to ensure everything is set up correctly. For further assistance or issues, please check the documentation or the project's repository for help.