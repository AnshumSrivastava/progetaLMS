export const slideData = [
	{
		title: 'The Threat Landscape',
		content: '<p>Welcome to Module 1.</p><p>Cybersecurity is the practice of protecting systems, networks, and programs from digital attacks. These cyberattacks are usually aimed at accessing, changing, or destroying sensitive information; extorting money from users; or interrupting normal business processes.</p><ul><li>Phishing</li><li>Ransomware</li><li>Malware</li><li>Social Engineering</li></ul>',
		image: 'Threat Matrix Diagram'
	},
	{
		title: 'Social Engineering',
		content: '<p>Social engineering is a manipulation technique that exploits human error to gain private information, access, or valuables.</p><p>In cybercrime, these "human hacking" scams tend to lure unsuspecting users into exposing data, spreading malware infections, or giving access to restricted systems.</p>',
		image: 'Phishing Email Example'
	},
	{
		title: 'Zero Trust Architecture',
		subtitle: 'Never trust, always verify.',
		type: 'statement' as const,
		content: '<p>Zero Trust is a strategic initiative that helps prevent successful data breaches by eliminating the concept of trust from an organization\'s network architecture.</p>'
	}
];

export const quizData = [
	{
		id: 'q1',
		question: 'Which of the following is considered a primary vector for Social Engineering attacks?',
		options: ['SQL Injection', 'Cross-Site Scripting (XSS)', 'Phishing Emails', 'Distributed Denial of Service (DDoS)']
	},
	{
		id: 'q2',
		question: 'What is the core principle of a "Zero Trust" architecture?',
		options: ['Trust internal networks, verify external networks', 'Never trust, always verify', 'Implement strong firewalls and trust all internal traffic', 'Use VPNs for all employee connections']
	},
	{
		id: 'q3',
		question: 'What type of malware is designed to block access to a computer system until a sum of money is paid?',
		options: ['Spyware', 'Ransomware', 'Adware', 'Trojan Horse']
	}
];

export const readingMock = {
	title: 'Firewalls & Proxies: The First Line of Defense',
	readingTime: '8 min read',
	htmlContent: `
		<p>In the realm of network security, <strong>firewalls</strong> and <strong>proxies</strong> serve as fundamental components to protect internal assets from external threats.</p>
		<h2>Understanding Firewalls</h2>
		<p>A firewall is a network security device that monitors and filters incoming and outgoing network traffic based on an organization's previously established security policies.</p>
		<blockquote>A firewall is simply a barrier or shield that is intended to protect your PC, tablet, or phone from the data-based malware dangers that exist on the Internet.</blockquote>
		<p>Firewalls can be hardware, software, or both. They operate at different layers of the OSI model:</p>
		<ul>
			<li><strong>Packet-filtering firewalls:</strong> Operate at the network layer, inspecting packets and deciding whether to pass or drop them.</li>
			<li><strong>Stateful inspection firewalls:</strong> Track the operating state and characteristics of network connections.</li>
			<li><strong>Next-Generation Firewalls (NGFW):</strong> Combine traditional firewall tech with additional functionality, such as encrypted traffic inspection and intrusion prevention systems (IPS).</li>
		</ul>
		<h2>The Role of Proxies</h2>
		<p>While a firewall blocks ports and programs that try to gain unauthorized access to your computer, a proxy server basically hides your internal network from the Internet.</p>
		<p>A proxy acts as an intermediary for requests from clients seeking resources from other servers. It provides administrative control and caching services, which can improve performance and security.</p>
	`
};

export const videoMock = {
	title: 'Core Concepts: CIA Triad',
	description: 'A deep dive into Confidentiality, Integrity, and Availability—the foundational model for information security.',
	durationStr: '4:15',
	poster: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80'
};
