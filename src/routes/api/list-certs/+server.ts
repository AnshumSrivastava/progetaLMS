import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/client';
import { certificates } from '$lib/server/db/schema/certificates.schema';

export async function GET() {
    const certs = await db.select().from(certificates).limit(5);
    return json(certs);
}
