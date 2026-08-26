/**
 * Fix: Reassign instructor handles correctly by matching on user name
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function fixHandles() {
  const correct = [
    { name: 'Anshum Srivastava',   handle: 'anshum-srivastava' },
    { name: 'CURIOUS ENTITY',      handle: 'curious-entity' },
    { name: 'Progeta Technologies', handle: 'progeta-technologies' },
    { name: 'Anmol Madan',         handle: 'anmol-madan' },
    { name: 'Mananpreet Kaur',     handle: 'mananpreet-kaur' }
  ];

  // First null out all handles to avoid unique conflict during reassignment
  await sql`UPDATE identity_profiles SET mentoring_handle = null`;

  for (const { name, handle } of correct) {
    const res = await sql`
      UPDATE identity_profiles ip
      SET mentoring_handle = ${handle}
      FROM users u
      WHERE ip.user_id = u.id AND u.name = ${name}
      RETURNING u.name, ip.mentoring_handle
    `;
    console.log(`→ ${name}: ${res[0]?.mentoring_handle ?? 'NOT FOUND'}`);
  }

  // Also fix incorrect bio/headline assignments per user
  const headlines = [
    { name: 'Anshum Srivastava',   headline: 'Cloud Security Architect & Penetration Testing Lead | AWS Security Specialist', yearsExp: 8 },
    { name: 'CURIOUS ENTITY',      headline: 'Cybersecurity Practitioner & Independent Researcher', yearsExp: 5 },
    { name: 'Progeta Technologies', headline: 'Platform Architect & Full-Stack Security Educator', yearsExp: 10 },
    { name: 'Anmol Madan',         headline: 'Senior Cloud Security Engineer | Kubernetes & Container Security', yearsExp: 7 },
    { name: 'Mananpreet Kaur',     headline: 'AppSec Lead & Secure SDLC Advocate | OWASP Chapter Lead', yearsExp: 6 }
  ];

  for (const { name, headline, yearsExp } of headlines) {
    await sql`
      UPDATE identity_profiles ip
      SET mentoring_headline = ${headline}, mentoring_years_exp = ${yearsExp}
      FROM users u
      WHERE ip.user_id = u.id AND u.name = ${name}
    `;
  }

  console.log('\nHandles and headlines corrected.');
}

fixHandles().catch(err => { console.error(err); process.exit(1); });
