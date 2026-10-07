import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

async function updatePracticalCybersecurity() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  console.log('Connecting to database...');

  // 1. Locate Instructor: Anmol Madan
  const instructorRows = await sql`
    SELECT id, name, email, role FROM users 
    WHERE name ILIKE '%Anmol Madan%' OR email = 'anmolmadan20@gmail.com' 
    LIMIT 1
  `;
  if (instructorRows.length === 0) {
    console.error('Instructor Anmol Madan not found');
    process.exit(1);
  }
  const instructor = instructorRows[0];
  console.log(`Instructor found: ${instructor.name} (${instructor.id})`);

  // Ensure role is teacher
  if (instructor.role !== 'teacher' && instructor.role !== 'admin' && instructor.role !== 'owner') {
    await sql`UPDATE users SET role = 'teacher' WHERE id = ${instructor.id}`;
    console.log(`Updated Anmol Madan role to teacher`);
  }

  // 2. Prepare comprehensive course details
  const slug = 'practical-cybersecurity';
  const title = 'Practical Cybersecurity · Beginner to Intermediate';
  const description = 'Build. Break. Detect. Respond. A practical, project-led cybersecurity program where students learn through one continuous security problem and progressively build a working defensive system.';
  const pricePaise = 1599900; // Rs 15,999 for live cohorts

  const metadata = {
    category: 'Cybersecurity',
    level: 'Beginner → Intermediate',
    duration: '25 Total Hours',
    totalHours: 25,
    structure: '4 Modules + 1 Project',
    tagline: 'Build. Break. Detect. Respond.',
    institution: 'Progeta Technologies × MSET Academy',
    certifyingBodies: [
      { name: 'MSET Academy', role: 'Accreditation & Certification Authority' },
      { name: 'Progeta Technologies', role: 'Practical Labs & Project Certification' }
    ],
    instructor: 'Anmol Madan',
    courseApproach: 'The course avoids treating cybersecurity as a collection of disconnected topics. Each module introduces knowledge because the capstone needs it. Students learn, experiment, build and test throughout the program.',
    coreIdea: 'Students learn how to investigate a system, understand an attack, turn security evidence into useful data, detect suspicious behaviour and automate a practical defensive response.',
    learningJourney: [
      'Understand',
      'Explore',
      'Attack',
      'Observe',
      'Parse',
      'Detect',
      'Alert',
      'Respond',
      'Automate'
    ],
    modules: [
      {
        number: '01',
        title: 'Foundations & Finding the Attack',
        summary: 'Students learn to look at a system from both the attacker and defender perspective. The focus is on understanding where systems are exposed, what activity looks like and where useful security evidence can be found.',
        covered: [
          'Cybersecurity fundamentals and security roles',
          'Attacker vs defender mindset',
          'Assets, threats, vulnerabilities and risk',
          'Linux fundamentals, users, permissions, processes and services',
          'Linux logs and system activity',
          'Networking: IPs, ports, TCP/UDP, DNS and HTTP',
          'Basic reconnaissance and attack-surface discovery',
          'Nmap, Wireshark and basic OSINT'
        ],
        practical: 'Students inspect a Linux environment, identify exposed services, investigate network activity and perform authorised reconnaissance. They begin identifying the evidence that a defender would need during an incident.',
        outcome: 'Students understand where attacks happen, what evidence they leave and where to look for it.'
      },
      {
        number: '02',
        title: 'Web Security, Attacks & Evidence',
        summary: 'Students safely generate attack activity in controlled environments so they can understand how common vulnerabilities work and, more importantly, what evidence those attacks create.',
        covered: [
          'Web security fundamentals',
          'OWASP Top 10 concepts',
          'Authentication and access control',
          'Injection, XSS and common web weaknesses',
          'Vulnerabilities vs exploits',
          'Basic vulnerability assessment',
          'Penetration testing methodology',
          'Reconnaissance, enumeration and controlled exploitation',
          'Nmap, Gobuster and Burp Suite exposure'
        ],
        practical: 'Students use deliberately vulnerable applications and authorised lab targets to identify weaknesses, perform controlled attacks and observe what gets recorded.',
        outcome: 'Students can connect a vulnerability to an attack and then to the evidence it produces: Vulnerability → Attack → Evidence → Log.'
      },
      {
        number: '03',
        title: 'Logs, Parsing & Detection',
        summary: 'Students move from generating security activity to building the machinery that can understand it. Raw logs are turned into structured information and then evaluated for suspicious behaviour.',
        covered: [
          'Security logs and events',
          'Authentication, system, web and application logs',
          'Basic observability: logs, metrics and traces',
          'Regex, patterns, groups and named groups',
          'Log parsing and structured data',
          'JSON and Python for security automation',
          'Detection rules and suspicious behaviour',
          'Thresholds, simple behaviour-based detection',
          'Severity and false positives',
          'Security alert generation'
        ],
        practical: 'Students build a small processing pipeline that reads raw logs, extracts fields such as IP, timestamp and username, creates structured events and identifies patterns such as repeated failed logins.',
        outcome: 'Students can turn messy security data into structured events and actionable alerts.'
      },
      {
        number: '04',
        title: 'Response, Automation & Defence',
        summary: 'Students complete the defensive workflow by investigating incidents, taking controlled response actions, automating repetitive tasks and improving the security of the system.',
        covered: [
          'Alert investigation and triage',
          'Incident timelines and evidence',
          'Containment and recovery concepts',
          'Security automation with Bash and Python',
          'Automated response and simple containment',
          'Human approval vs automatic actions',
          'Response logging',
          'Linux hardening',
          'SSH, permissions and firewall basics',
          'Basic security configuration checks',
          'Incident reporting'
        ],
        practical: 'Students connect their detection system to a controlled response. They investigate simulated incidents, validate suspicious activity, perform a predefined defensive action and document the result.',
        outcome: 'Students understand how a security team moves from detection to investigation, response and improvement.'
      }
    ],
    capstoneProject: {
      title: 'Security Monitoring & Automated Response System',
      description: 'The project is the centre of the course. Students progressively build a lightweight defensive system that can process security logs, identify suspicious activity, generate alerts and perform selected automated responses.',
      pipelineText: 'LOG SOURCES ↓ COLLECTION ↓ PARSING ↓ STRUCTURED EVENTS ↓ DETECTION ↓ ALERT ↓ INVESTIGATION ↓ AUTOMATED RESPONSE ↓ REPORT',
      pipelineSteps: [
        'LOG SOURCES',
        'COLLECTION',
        'PARSING',
        'STRUCTURED EVENTS',
        'DETECTION',
        'ALERT',
        'INVESTIGATION',
        'AUTOMATED RESPONSE',
        'REPORT'
      ],
      scenario: 'A final scenario might involve repeated login attempts, suspicious web requests or another controlled attack. Students must use the system they built to discover what happened rather than simply being given the answer.',
      deliverables: [
        'Log collection',
        'Regex / parsing module',
        'Structured JSON events',
        'Detection rules',
        'Alert generation',
        'Automated response',
        'Incident investigation',
        'Final security report'
      ]
    },
    finalOutcome: {
      headline: 'What students leave with',
      summary: 'By the end of the 25-hour program, students should be able to work with a Linux security environment, investigate basic network and web activity, perform authorised reconnaissance, understand common vulnerabilities, read and parse security logs, write practical Python and Bash automation, create simple detections and alerts, investigate a simulated incident, and automate selected defensive actions.',
      largerSkill: 'The larger skill is a repeatable security problem-solving process: find the evidence, understand what it means, test a hypothesis, detect important behaviour and automate the repeatable parts.'
    },
    tags: [
      'Cybersecurity',
      'Linux',
      'Network Security',
      'OWASP',
      'Web Security',
      'Log Analysis',
      'Python Automation',
      'Bash Scripting',
      'Detection Engineering',
      'Incident Response'
    ]
  };

  // 3. Find or update the Asset record
  const assetRows = await sql`SELECT id FROM assets WHERE slug = ${slug} OR title ILIKE '%Practical Cybersecurity%' LIMIT 1`;
  if (assetRows.length === 0) {
    console.error('Asset not found');
    process.exit(1);
  }
  const assetId = assetRows[0].id;

  console.log(`Updating asset ${assetId} with instructor ${instructor.id}...`);
  await sql`
    UPDATE assets
    SET 
      title = ${title},
      description = ${description},
      owner_id = ${instructor.id},
      price_paise = ${pricePaise},
      delivery_format = 'live_batch',
      is_self_paced_enabled = false,
      is_live_batches_enabled = true,
      metadata = ${JSON.stringify(metadata)}::jsonb,
      updated_at = NOW()
    WHERE id = ${assetId}
  `;
  console.log('Asset record updated.');

  // 4. Update Cohorts:
  // Batch 1 has WhatsApp Link: https://chat.whatsapp.com/FaTkNU1448QIbVc2lfzQ7i
  // Update instructor_id to Anmol Madan
  const whatsappUrl = 'https://chat.whatsapp.com/FaTkNU1448QIbVc2lfzQ7i';

  // Batch 1
  await sql`
    UPDATE cohorts
    SET 
      instructor_id = ${instructor.id},
      community_url = ${whatsappUrl},
      max_students = 25,
      price_paise = ${pricePaise},
      updated_at = NOW()
    WHERE course_id = ${assetId} AND name ILIKE '%Batch 1%'
  `;
  console.log('Batch 1 updated with WhatsApp link & Anmol Madan.');

  // Other batches
  await sql`
    UPDATE cohorts
    SET 
      instructor_id = ${instructor.id},
      max_students = 25,
      price_paise = ${pricePaise},
      updated_at = NOW()
    WHERE course_id = ${assetId} AND name NOT ILIKE '%Batch 1%'
  `;
  console.log('Remaining cohorts assigned to Anmol Madan.');

  console.log('Database update completed successfully!');
}

updatePracticalCybersecurity().catch(e => {
  console.error('Update failed:', e);
  process.exit(1);
});
