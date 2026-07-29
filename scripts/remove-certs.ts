import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { neon } from '@neondatabase/serverless';

async function main() {
    const sql = neon(process.env.DATABASE_URL!);
    console.log('Removing all certifications...');
    
    // Delete dependent attempt answers
    await sql`DELETE FROM assessment_attempt_answers`;
    
    // Delete certificates
    await sql`DELETE FROM certificates`;
    
    // Delete attempts
    await sql`DELETE FROM assessment_attempts`;
    
    // Delete assessment_tests
    await sql`DELETE FROM assessment_tests`;
    
    // Delete asset references
    await sql`DELETE FROM commerce_orders WHERE asset_id IN (SELECT id FROM assets WHERE type = 'cert_test')`;
    await sql`DELETE FROM asset_ownership WHERE asset_id IN (SELECT id FROM assets WHERE type = 'cert_test')`;
    await sql`DELETE FROM asset_content WHERE asset_id IN (SELECT id FROM assets WHERE type = 'cert_test')`;
    
    // Finally, delete the corresponding assets
    await sql`DELETE FROM assets WHERE type = 'cert_test'`;
    
    console.log('Success! All certifications removed.');
}

main().catch(console.error);
