import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

// 20 Cybersecurity Fundamentals Questions
const questions = [
  {
    content: "Which Linux command is used to list directory contents?",
    options: [
      { text: "ls", isCorrect: true },
      { text: "cd", isCorrect: false },
      { text: "pwd", isCorrect: false },
      { text: "mkdir", isCorrect: false }
    ]
  },
  {
    content: "What does the 'chmod' command do in Linux?",
    options: [
      { text: "Changes file permissions", isCorrect: true },
      { text: "Changes the file owner", isCorrect: false },
      { text: "Moves a file to another directory", isCorrect: false },
      { text: "Checks the md5 checksum", isCorrect: false }
    ]
  },
  {
    content: "Which Linux command displays the current working directory?",
    options: [
      { text: "pwd", isCorrect: true },
      { text: "cd", isCorrect: false },
      { text: "dir", isCorrect: false },
      { text: "path", isCorrect: false }
    ]
  },
  {
    content: "How do you search for a specific string inside a file in Linux?",
    options: [
      { text: "grep", isCorrect: true },
      { text: "find", isCorrect: false },
      { text: "search", isCorrect: false },
      { text: "locate", isCorrect: false }
    ]
  },
  {
    content: "Which command is used to display network interfaces and IP addresses in modern Linux systems?",
    options: [
      { text: "ip addr", isCorrect: true },
      { text: "netstat", isCorrect: false },
      { text: "ping", isCorrect: false },
      { text: "ifconfig", isCorrect: false }
    ]
  },
  {
    content: "What is an IP address?",
    options: [
      { text: "A numerical label assigned to a device on a network", isCorrect: true },
      { text: "The physical hardware address of a network card", isCorrect: false },
      { text: "A protocol for transferring files", isCorrect: false },
      { text: "The domain name of a website", isCorrect: false }
    ]
  },
  {
    content: "What is a MAC address?",
    options: [
      { text: "A unique physical identifier assigned to a network interface controller", isCorrect: true },
      { text: "An Apple computer's network identifier", isCorrect: false },
      { text: "A dynamically assigned network address", isCorrect: false },
      { text: "The address of the main internet gateway", isCorrect: false }
    ]
  },
  {
    content: "How many bits are in an IPv4 address?",
    options: [
      { text: "32 bits", isCorrect: true },
      { text: "64 bits", isCorrect: false },
      { text: "128 bits", isCorrect: false },
      { text: "16 bits", isCorrect: false }
    ]
  },
  {
    content: "How many bits are in a MAC address?",
    options: [
      { text: "48 bits", isCorrect: true },
      { text: "32 bits", isCorrect: false },
      { text: "64 bits", isCorrect: false },
      { text: "128 bits", isCorrect: false }
    ]
  },
  {
    content: "Which port does HTTP use by default?",
    options: [
      { text: "80", isCorrect: true },
      { text: "443", isCorrect: false },
      { text: "22", isCorrect: false },
      { text: "21", isCorrect: false }
    ]
  },
  {
    content: "What is the primary purpose of Nmap?",
    options: [
      { text: "Network discovery and port scanning", isCorrect: true },
      { text: "Password cracking", isCorrect: false },
      { text: "Web application vulnerability scanning", isCorrect: false },
      { text: "Packet sniffing", isCorrect: false }
    ]
  },
  {
    content: "In Nmap, which flag is used for a SYN scan (Stealth Scan)?",
    options: [
      { text: "-sS", isCorrect: true },
      { text: "-sT", isCorrect: false },
      { text: "-sU", isCorrect: false },
      { text: "-sV", isCorrect: false }
    ]
  },
  {
    content: "Which Nmap flag is used to detect the version of the running services?",
    options: [
      { text: "-sV", isCorrect: true },
      { text: "-O", isCorrect: false },
      { text: "-sS", isCorrect: false },
      { text: "-v", isCorrect: false }
    ]
  },
  {
    content: "Which Nmap flag attempts to determine the target's operating system?",
    options: [
      { text: "-O", isCorrect: true },
      { text: "-sO", isCorrect: false },
      { text: "-A", isCorrect: false },
      { text: "-os", isCorrect: false }
    ]
  },
  {
    content: "What is Gobuster primarily used for?",
    options: [
      { text: "Directory and DNS brute-forcing", isCorrect: true },
      { text: "Exploiting database vulnerabilities", isCorrect: false },
      { text: "Intercepting network traffic", isCorrect: false },
      { text: "Cracking wireless passwords", isCorrect: false }
    ]
  },
  {
    content: "Which mode in Gobuster is used to find hidden directories on a web server?",
    options: [
      { text: "dir", isCorrect: true },
      { text: "dns", isCorrect: false },
      { text: "vhost", isCorrect: false },
      { text: "fuzz", isCorrect: false }
    ]
  },
  {
    content: "What flag in Gobuster is used to specify the wordlist?",
    options: [
      { text: "-w", isCorrect: true },
      { text: "-u", isCorrect: false },
      { text: "-l", isCorrect: false },
      { text: "-t", isCorrect: false }
    ]
  },
  {
    content: "Which Linux command displays the contents of a file directly in the terminal?",
    options: [
      { text: "cat", isCorrect: true },
      { text: "view", isCorrect: false },
      { text: "echo", isCorrect: false },
      { text: "read", isCorrect: false }
    ]
  },
  {
    content: "Which tool would you use to intercept and modify web traffic between your browser and the server?",
    options: [
      { text: "Burp Suite", isCorrect: true },
      { text: "Nmap", isCorrect: false },
      { text: "Gobuster", isCorrect: false },
      { text: "Hashcat", isCorrect: false }
    ]
  },
  {
    content: "What is the purpose of the `/etc/passwd` file in Linux?",
    options: [
      { text: "Stores user account information", isCorrect: true },
      { text: "Stores user passwords in plain text", isCorrect: false },
      { text: "Stores system configuration settings", isCorrect: false },
      { text: "Stores network interface configurations", isCorrect: false }
    ]
  }
];

// Helper to generate a basic ID
const generateId = () => Math.random().toString(36).substring(2, 10);

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  console.log("Seeding Cybersecurity Fundamentals Test...");

  try {
    // 1. We need a system admin user to own the asset
    const users = await sql`SELECT id FROM users LIMIT 1`;
    let ownerId = users.length > 0 ? users[0].id : null;
    
    if (!ownerId) {
      console.log("No users found. Creating a dummy system user...");
      ownerId = generateId();
      await sql`INSERT INTO users (id, name, email, email_verified) VALUES (${ownerId}, 'System Admin', 'admin@progeta.in', true)`;
      await sql`INSERT INTO identity_profiles (id, user_id, display_name) VALUES (${generateId()}, ${ownerId}, 'System Admin')`;
    }

    // 2. Create the Asset
    const assetId = generateId();
    await sql`
      INSERT INTO assets (id, type, status, title, description, slug, owner_id)
      VALUES (${assetId}, 'cert_test', 'published', 'Cybersecurity Fundamentals', 'Test your knowledge on Linux, Networking, Nmap, and Gobuster.', 'cybersecurity-fundamentals', ${ownerId})
    `;

    // 3. Create the Assessment Test
    const testId = generateId();
    await sql`
      INSERT INTO assessment_tests (id, asset_id, passing_percent, time_limit_mins, max_attempts)
      VALUES (${testId}, ${assetId}, 70, 30, null)
    `;

    // 4. Create the Certificate Template
    const templateId = generateId();
    await sql`
      INSERT INTO certificate_templates (id, name, html_content)
      VALUES (${templateId}, 'Standard White Certificate', '<div>Certificate</div>')
    `;

    // 5. Insert questions & options
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const qId = generateId();
      
      await sql`
        INSERT INTO assessment_questions (id, test_id, type, content, points, sort_order)
        VALUES (${qId}, ${testId}, 'mcq', ${q.content}, 1, ${i})
      `;

      for (let j = 0; j < q.options.length; j++) {
        const opt = q.options[j];
        const oId = generateId();
        await sql`
          INSERT INTO assessment_options (id, question_id, content, is_correct, sort_order)
          VALUES (${oId}, ${qId}, ${opt.text}, ${opt.isCorrect}, ${j})
        `;
      }
    }

    console.log("✅ Seed completed successfully.");
    console.log("Asset ID:", assetId);
    console.log("Test ID:", testId);
    console.log("Template ID:", templateId);
  } catch (err) {
    console.error("❌ Seed failed:", err);
  }
}

run();
