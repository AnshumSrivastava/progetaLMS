/**
 * Demo Asset Seeder
 * Inserts publishable sample assets into the database so the catalog has real data.
 * Run: node seed_demo_assets.mjs
 */
import { neon } from '@neondatabase/serverless';
import { createId } from '@paralleldrive/cuid2';

const db = neon("postgresql://neondb_owner:npg_ofZTuJjdO04B@ep-calm-haze-ay9a3yr4.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require");

async function run() {
  // Get admin user to be the owner
  const users = await db`SELECT id FROM users LIMIT 1`;
  if (!users.length) { console.error('No users found. Run the app first to create admin.'); process.exit(1); }
  const ownerId = users[0].id;
  console.log('Using owner:', ownerId);

  const assets = [
    {
      id: createId(), slug: 'cybersecurity-fundamentals',
      title: 'Cybersecurity Fundamentals',
      description: 'Master the core concepts of cybersecurity: threats, defenses, and best practices for the modern digital landscape.',
      type: 'html', status: 'published', visibility: 'public',
      owner_id: ownerId, price_paise: 100, sort_order: 1,
      metadata: JSON.stringify({ level: 'Beginner', duration: '4h 30m', instructor: 'Dr. Sarah Jenkins', thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80' })
    },
    {
      id: createId(), slug: 'cloud-security-architecture',
      title: 'Cloud Security Architecture',
      description: 'Design resilient, secure cloud systems on AWS, GCP, and Azure. Covers IAM, network segmentation, and compliance.',
      type: 'html', status: 'published', visibility: 'public',
      owner_id: ownerId, price_paise: 100, sort_order: 2,
      metadata: JSON.stringify({ level: 'Intermediate', duration: '6h 15m', instructor: 'Alex Morales', thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80' })
    },
    {
      id: createId(), slug: 'advanced-penetration-testing',
      title: 'Advanced Penetration Testing',
      description: 'Hands-on ethical hacking techniques: reconnaissance, exploitation, post-exploitation, and reporting.',
      type: 'html', status: 'published', visibility: 'public',
      owner_id: ownerId, price_paise: 100, sort_order: 3,
      metadata: JSON.stringify({ level: 'Advanced', duration: '12h 0m', instructor: 'David Kim', thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80' })
    },
    {
      id: createId(), slug: 'network-defense-cert-test',
      title: 'Network Defense Associate',
      description: 'Prove your knowledge of network defense fundamentals. 60 questions, 90-minute time limit. Pass to earn a verified certificate.',
      type: 'cert_test', status: 'published', visibility: 'public',
      owner_id: ownerId, price_paise: 100, sort_order: 10,
      metadata: JSON.stringify({ questions: 60, duration: '90 min', level: 'Intermediate' })
    },
    {
      id: createId(), slug: 'incident-response-playbook',
      title: 'Incident Response Playbook',
      description: 'A comprehensive PDF template covering all phases of incident response. Ready to deploy in your organization.',
      type: 'pdf', status: 'published', visibility: 'public',
      owner_id: ownerId, price_paise: 100, sort_order: 20,
      metadata: JSON.stringify({ fileType: 'PDF', pages: 42 })
    }
  ];

  for (const asset of assets) {
    const existing = await db`SELECT id FROM assets WHERE slug = ${asset.slug}`;
    if (existing.length > 0) {
      console.log(`  ✓ Asset '${asset.title}' already exists`);
      continue;
    }
    await db`
      INSERT INTO assets (id, slug, title, description, type, status, visibility, owner_id, price_paise, sort_order, metadata)
      VALUES (${asset.id}, ${asset.slug}, ${asset.title}, ${asset.description}, ${asset.type}, ${asset.status}, ${asset.visibility}, ${asset.owner_id}, ${asset.price_paise}, ${asset.sort_order}, ${asset.metadata}::jsonb)
    `;
    console.log(`  + Created '${asset.title}'`);
    
    // For html assets, add a sample content record
    if (asset.type === 'html') {
      const contentId = createId();
      const sampleHtml = `<h1>${asset.title}</h1><p>Welcome to this course. Content is being added by the instructor.</p><p><em>Check back soon for full lesson materials.</em></p>`;
      await db`
        INSERT INTO asset_content (id, asset_id, version, content, content_type, is_current, created_by)
        VALUES (${contentId}, ${asset.id}, 1, ${sampleHtml}, 'html', true, ${ownerId})
      `;
      console.log(`    + Added content for '${asset.title}'`);
    }
  }
  
  console.log('\n✅ Demo assets seeded!');
}

run().catch(e => { console.error(e); process.exit(1); });
