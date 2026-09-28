import { neon } from '@neondatabase/serverless';
import 'dotenv/config';
import { createId } from '@paralleldrive/cuid2';

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  console.log('Connecting to database...');

  // 1. Find user by email: anshum8864@gmail.com
  const userRows = await sql`SELECT id, name, email, role FROM users WHERE email = 'anshum8864@gmail.com' LIMIT 1`;
  if (userRows.length === 0) {
    console.error('Target user anshum8864@gmail.com not found in database.');
    process.exit(1);
  }

  const owner = userRows[0];
  console.log(`Found Instructor/Owner: ${owner.name} (${owner.id}) [Role: ${owner.role}]`);

  const slug = 'practical-cybersecurity';
  const title = 'Practical Cybersecurity';
  const description = 'Build. Break. Detect. Respond. A 25-hour, practical cybersecurity program for beginners to intermediate learners built around an end-to-end security monitoring and automated response capstone project. In collaboration with Progeta Technologies & MSET Academy.';
  const thumbnail = '/thumbnails/practical-cybersecurity.jpg';
  const pricePaise = 1599900; // Rs 15,999

  const metadata = {
    category: 'Cybersecurity',
    level: 'Beginner → Intermediate',
    duration: '25 hours',
    totalHours: 25,
    totalModules: 4,
    instructor: owner.name || 'Anshum Srivastava',
    institution: 'Progeta Technologies × MSET Academy',
    collaboration: {
      partner1: 'Progeta Technologies',
      partner2: 'MSET Academy'
    },
    tagline: 'Build. Break. Detect. Respond.',
    overview: 'A 25-hour, practical cybersecurity program for beginners to intermediate learners. The course is built around one project, with every module contributing a piece to the final system.',
    courseApproach: 'Students do not learn cybersecurity as a list of unrelated tools. They learn concepts when the project needs them, apply them immediately, and use the result in the next stage.',
    coreObjective: 'Learn to investigate a system, understand how attacks appear in evidence, process that evidence, detect suspicious activity and automate practical defensive responses. Understand the system → Understand the attack → Understand the evidence → Defend and automate.',
    tags: [
      'Cybersecurity',
      'Linux',
      'Web Security',
      'OWASP',
      'Log Analysis',
      'Python Automation',
      'Detection Rules',
      'Incident Response',
      'Nmap',
      'Wireshark',
      'Burp Suite'
    ],
    modules: [
      {
        number: '01',
        title: 'Foundations & Finding the Attack',
        summary: 'Build the basic knowledge needed to investigate a system. Students learn how systems communicate, where they are exposed and where a defender can find useful evidence.',
        covered: [
          'Cybersecurity fundamentals',
          'Attacker and defender perspectives',
          'Assets, threats, vulnerabilities and risk',
          'Linux, users, permissions, processes and services',
          'Linux logs and system activity',
          'IP addresses, ports, TCP/UDP, DNS and HTTP',
          'Basic reconnaissance and attack surface',
          'Nmap, Wireshark and OSINT basics'
        ],
        practicalWork: 'Investigate a Linux environment, identify exposed services, inspect network activity and perform authorised reconnaissance. Students begin identifying the evidence that a defender would need during an incident.',
        output: 'A simple security monitoring plan and an investigated lab environment.'
      },
      {
        number: '02',
        title: 'Web Security, Attacks & Evidence',
        summary: 'Safely generate attack activity in controlled environments. Students learn common vulnerabilities and see how attacks become observable security evidence.',
        covered: [
          'Web security fundamentals',
          'OWASP Top 10 concepts',
          'Authentication and access control',
          'Injection, XSS and common weaknesses',
          'Vulnerabilities vs exploits',
          'Penetration testing methodology',
          'Reconnaissance and enumeration',
          'Nmap, Gobuster and Burp Suite exposure'
        ],
        practicalWork: 'Use deliberately vulnerable applications and authorised lab targets to identify weaknesses, perform controlled attacks and observe what the target records.',
        output: 'A vulnerability-to-evidence map showing how attacks create observable activity.'
      },
      {
        number: '03',
        title: 'Logs, Parsing & Detection',
        summary: 'Turn raw security evidence into useful information. Students build the first major technical components of the capstone: parsing, structured events and detection.',
        covered: [
          'Authentication, system, web and application logs',
          'Security events and basic observability',
          'Regex, patterns, groups and named groups',
          'Log parsing and structured data',
          'JSON and Python for security automation',
          'Detection rules and suspicious behaviour',
          'Thresholds and simple behaviour-based detection',
          'Severity, false positives and alerts'
        ],
        practicalWork: 'Build a pipeline that reads raw logs, extracts IPs, timestamps, users and other fields, creates structured events and detects patterns such as repeated failed logins.',
        output: 'A working parser, structured event format, detection rules and alert generation.'
      },
      {
        number: '04',
        title: 'Response, Automation & Defence',
        summary: 'Complete the defensive workflow. Students investigate incidents, respond to them, automate repetitive actions and apply basic hardening to the system.',
        covered: [
          'Alert investigation and triage',
          'Incident timelines and evidence',
          'Containment and recovery concepts',
          'Bash and Python security automation',
          'Automated response and simple containment',
          'Human approval vs automatic actions',
          'Linux hardening, SSH, permissions and firewall basics',
          'Security checks and incident reporting'
        ],
        practicalWork: 'Connect detection to a controlled response, investigate a simulated incident, validate suspicious activity, perform a predefined defensive action and document the complete incident.',
        output: 'An end-to-end detection, investigation and automated response workflow.'
      }
    ],
    capstoneProject: {
      name: 'Security Monitoring & Automated Response System',
      description: 'The project runs through the entire course. Students progressively build a lightweight defensive system that takes security logs, understands them, identifies suspicious behaviour and performs selected defensive actions.',
      pipeline: 'LOG SOURCES → COLLECTION → PARSING → STRUCTURED EVENTS → DETECTION → ALERT → INVESTIGATION → AUTOMATED RESPONSE → REPORT',
      challenge: 'The final challenge gives students a controlled security incident. They are expected to discover what happened using their own system rather than simply being given the answer.',
      deliverables: [
        'Log collection',
        'Regex / parsing module',
        'Structured security events',
        'Detection rules',
        'Alert generation',
        'Automated response',
        'Incident investigation',
        'Final security report'
      ]
    },
    finalOutcome: 'By the end of the program, students should be able to work with a Linux security environment, investigate basic network and web activity, perform authorised reconnaissance, understand common vulnerabilities, read and parse security logs, write practical Python and Bash automation, create simple detections and alerts, investigate a simulated incident and automate selected defensive actions.'
  };

  // 2. Check if asset exists or create
  const existingAssets = await sql`SELECT id FROM assets WHERE slug = ${slug}`;
  let assetId;

  if (existingAssets.length > 0) {
    assetId = existingAssets[0].id;
    console.log(`Asset '${slug}' already exists (${assetId}). Updating...`);
    await sql`
      UPDATE assets
      SET 
        title = ${title},
        description = ${description},
        thumbnail = ${thumbnail},
        type = 'html',
        delivery_format = 'live_batch',
        status = 'published',
        visibility = 'public',
        is_self_paced_enabled = true,
        is_live_batches_enabled = true,
        owner_id = ${owner.id},
        currency = 'INR',
        price_paise = ${pricePaise},
        metadata = ${JSON.stringify(metadata)}::jsonb,
        updated_at = NOW()
      WHERE id = ${assetId}
    `;
    console.log(`Asset updated.`);
  } else {
    assetId = createId();
    console.log(`Creating new asset with ID: ${assetId}`);
    await sql`
      INSERT INTO assets (
        id, slug, title, description, thumbnail, type,
        delivery_format, status, visibility, is_self_paced_enabled, is_live_batches_enabled,
        owner_id, currency, price_paise, metadata, sort_order, created_at, updated_at
      ) VALUES (
        ${assetId}, ${slug}, ${title}, ${description}, ${thumbnail}, 'html',
        'live_batch', 'published', 'public', true, true,
        ${owner.id}, 'INR', ${pricePaise}, ${JSON.stringify(metadata)}::jsonb, 0, NOW(), NOW()
      )
    `;
    console.log(`Asset '${title}' created successfully.`);
  }

  // 3. Upsert initial asset_content
  const existingContent = await sql`SELECT id FROM asset_content WHERE asset_id = ${assetId} LIMIT 1`;
  const overviewHtml = `
    <div class="prose max-w-none">
      <div class="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-6 mb-8 text-cyan-200">
        <h2 class="text-2xl font-bold tracking-tight text-white mb-2">Practical Cybersecurity: Build. Break. Detect. Respond.</h2>
        <p class="text-gray-300">A 25-hour, practical cybersecurity program for beginners to intermediate learners in collaboration with <strong>Progeta Technologies</strong> and <strong>MSET Academy</strong>.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
        <div class="p-5 rounded-lg bg-gray-900 border border-gray-800">
          <h3 class="text-lg font-semibold text-emerald-400 mb-2">Program Format</h3>
          <ul class="space-y-1 text-sm text-gray-300">
            <li>• <strong>25 Total Hours</strong> of live guided instruction & practical labs</li>
            <li>• <strong>4 Progressive Modules</strong></li>
            <li>• <strong>1 Integrated Capstone Project</strong></li>
            <li>• <strong>Cohort Size:</strong> Strictly 25 Students per Batch</li>
          </ul>
        </div>
        <div class="p-5 rounded-lg bg-gray-900 border border-gray-800">
          <h3 class="text-lg font-semibold text-cyan-400 mb-2">Capstone Deliverable</h3>
          <p class="text-sm text-gray-300">You will architect and deploy an end-to-end <strong>Security Monitoring & Automated Response System</strong> taking security logs from collection and parsing to detection, alert triage, and automated incident containment.</p>
        </div>
      </div>

      <h3 class="text-xl font-bold text-white mt-8 mb-4">Curriculum Breakdown</h3>
      <div class="space-y-4">
        <div class="p-4 rounded-lg bg-gray-900/60 border border-gray-800">
          <div class="flex items-center gap-2 text-cyan-400 font-semibold mb-1">
            <span class="px-2 py-0.5 rounded bg-cyan-950 text-xs border border-cyan-800">MODULE 01</span>
            <span>Foundations & Finding the Attack</span>
          </div>
          <p class="text-sm text-gray-400">Cybersecurity fundamentals, Linux systems, network protocols, reconnaissance, Nmap & Wireshark basics. Output: Lab environment analysis & security monitoring plan.</p>
        </div>
        <div class="p-4 rounded-lg bg-gray-900/60 border border-gray-800">
          <div class="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
            <span class="px-2 py-0.5 rounded bg-emerald-950 text-xs border border-emerald-800">MODULE 02</span>
            <span>Web Security, Attacks & Evidence</span>
          </div>
          <p class="text-sm text-gray-400">OWASP Top 10 vulnerabilities, authentication bypass, Burp Suite, Gobuster, and evidence tracing. Output: Vulnerability-to-evidence attack mapping.</p>
        </div>
        <div class="p-4 rounded-lg bg-gray-900/60 border border-gray-800">
          <div class="flex items-center gap-2 text-purple-400 font-semibold mb-1">
            <span class="px-2 py-0.5 rounded bg-purple-950 text-xs border border-purple-800">MODULE 03</span>
            <span>Logs, Parsing & Detection</span>
          </div>
          <p class="text-sm text-gray-400">Structured event extraction, Regex parsing, Python automation, threshold logic, and custom detection rules. Output: Live parser and alert generation pipeline.</p>
        </div>
        <div class="p-4 rounded-lg bg-gray-900/60 border border-gray-800">
          <div class="flex items-center gap-2 text-amber-400 font-semibold mb-1">
            <span class="px-2 py-0.5 rounded bg-amber-950 text-xs border border-amber-800">MODULE 04</span>
            <span>Response, Automation & Defence</span>
          </div>
          <p class="text-sm text-gray-400">Incident investigation, Bash/Python automated containment, Linux system hardening, and full incident report generation. Output: End-to-end defensive workflow.</p>
        </div>
      </div>
    </div>
  `;

  if (existingContent.length > 0) {
    console.log('Updating asset_content...');
    await sql`
      UPDATE asset_content
      SET content = ${overviewHtml}, content_type = 'html', is_current = true
      WHERE id = ${existingContent[0].id}
    `;
  } else {
    console.log('Creating asset_content...');
    await sql`
      INSERT INTO asset_content (id, asset_id, version, content, content_type, is_current, created_by, created_at)
      VALUES (${createId()}, ${assetId}, 1, ${overviewHtml}, 'html', true, ${owner.id}, NOW())
    `;
  }

  // 4. Create 4 Cohorts: October 2026 Batch 1 to Batch 4 with Monday start dates
  const batches = [
    { name: 'October 2026 Batch 1', startDate: '2026-10-05T00:00:00+05:30' },
    { name: 'October 2026 Batch 2', startDate: '2026-10-12T00:00:00+05:30' },
    { name: 'October 2026 Batch 3', startDate: '2026-10-19T00:00:00+05:30' },
    { name: 'October 2026 Batch 4', startDate: '2026-10-26T00:00:00+05:30' }
  ];

  console.log('\nSetting up Cohorts / Batches...');
  for (const b of batches) {
    const existingCohort = await sql`
      SELECT id FROM cohorts 
      WHERE course_id = ${assetId} AND name = ${b.name}
      LIMIT 1
    `;

    if (existingCohort.length > 0) {
      console.log(`Cohort '${b.name}' already exists (${existingCohort[0].id}). Updating limits, start date, and instructor...`);
      await sql`
        UPDATE cohorts
        SET 
          instructor_id = ${owner.id},
          max_students = 25,
          price_paise = ${pricePaise},
          start_date = ${b.startDate}::timestamptz,
          meeting_url = NULL,
          community_url = NULL,
          status = 'upcoming',
          is_active = true,
          updated_at = NOW()
        WHERE id = ${existingCohort[0].id}
      `;
    } else {
      const cohortId = createId();
      console.log(`Inserting cohort '${b.name}' (ID: ${cohortId})...`);
      await sql`
        INSERT INTO cohorts (
          id, course_id, name, instructor_id, max_students, price_paise,
          start_date, meeting_url, community_url, sessions_data, status, is_active,
          timezone, created_at, updated_at
        ) VALUES (
          ${cohortId}, ${assetId}, ${b.name}, ${owner.id}, 25, ${pricePaise},
          ${b.startDate}::timestamptz, NULL, NULL, '[]'::jsonb, 'upcoming', true,
          'Asia/Kolkata', NOW(), NOW()
        )
      `;
      console.log(`Cohort '${b.name}' created.`);
    }
  }

  // 5. Verification query
  const verifiedCohorts = await sql`
    SELECT id, name, max_students, price_paise, status, instructor_id
    FROM cohorts
    WHERE course_id = ${assetId}
    ORDER BY name ASC
  `;

  console.log('\n================ VERIFICATION RESULT ================');
  console.log(`Asset ID: ${assetId} (slug: ${slug})`);
  console.log(`Owner: ${owner.name} (${owner.id})`);
  console.log('Cohorts created/verified:');
  console.table(verifiedCohorts);
  console.log('=====================================================\n');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
