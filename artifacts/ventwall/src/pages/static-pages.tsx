import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

function StaticFooter() {
  return (
    <footer className="mt-16 pt-8 border-t border-white/10">
      <p className="text-xs text-muted-foreground/50 font-mono mb-4 italic">
        Views expressed by users are their own and do not represent the views of VentWall.
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-mono text-muted-foreground/40">
        <Link href="/terms" className="hover:text-muted-foreground transition-colors">Terms of Service</Link>
        <Link href="/privacy" className="hover:text-muted-foreground transition-colors">Privacy Policy</Link>
        <Link href="/content-policy" className="hover:text-muted-foreground transition-colors">Content Policy</Link>
        <Link href="/safety" className="hover:text-muted-foreground transition-colors">Safety Rules</Link>
        <a href="mailto:abuse@ventwall.app" className="hover:text-muted-foreground transition-colors">Report Abuse</a>
        <a href="mailto:hello@ventwall.app" className="hover:text-muted-foreground transition-colors">Contact</a>
      </div>
    </footer>
  );
}

export default function StaticPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Layout>
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center">
        <Link href="/" className="mr-4 text-muted-foreground hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="font-medium text-lg">{title}</span>
      </header>
      <div className="overflow-y-auto h-full">
        <div className="p-6 prose prose-invert prose-p:text-muted-foreground prose-headings:text-white max-w-2xl mx-auto">
          {children}
          <StaticFooter />
        </div>
      </div>
    </Layout>
  );
}

export function WhatIsVentWall() {
  return (
    <StaticPage title="What is VentWall?">
      <h2>A space for raw truth.</h2>
      <p>VentWall is not a social network. There are no profiles, no followers, no algorithmic feeds designed to keep you addicted.</p>
      <p>It is a living wall of human emotion. People drop their truths—anger, sadness, joy, confessions—and disappear into the void.</p>
      <p>When you shout into the canyon, you might hear other voices echo back. But you are ultimately alone, safely anonymous, and free to say what you cannot say in the daylight.</p>
    </StaticPage>
  );
}

export function SafetyRules() {
  return (
    <StaticPage title="Safety Rules">
      <h2>Keep the void safe.</h2>
      <ol className="space-y-4">
        <li><strong>No Targeted Harassment:</strong> Do not post personal information or attack specific individuals.</li>
        <li><strong>No Hate Speech:</strong> Bigotry, racism, and discrimination have no place here.</li>
        <li><strong>No Threats:</strong> Any threats of violence against others will be blocked and reported.</li>
        <li><strong>No Spam:</strong> This is a space for emotion, not self-promotion or links.</li>
        <li><strong>Self-Harm:</strong> If you are in immediate danger or thinking about harming yourself, contact local emergency services or call/text <strong>988</strong> in the United States.</li>
        <li><strong>Anonymity is a Shield, Not a Weapon:</strong> Use it to protect yourself, not to hurt others.</li>
        <li><strong>Report Violations:</strong> Help us keep the wall clean by using the report flag on toxic posts.</li>
        <li><strong>Posts Expire:</strong> Remember that all vents disappear eventually. Let it go.</li>
      </ol>
    </StaticPage>
  );
}

export function Terms() {
  return (
    <StaticPage title="Terms of Service">
      <p className="text-xs text-muted-foreground/50 font-mono">Last updated: May 2026</p>

      <p>By accessing or using VentWall, you agree to be bound by these Terms of Service. If you do not agree, do not use the platform.</p>

      <h2>1. User Responsibility</h2>
      <p>Users are solely responsible for all content they create, submit, publish, transmit, or otherwise make available through VentWall. VentWall does not pre-screen user-generated content and cannot guarantee the accuracy, integrity, or quality of content posted by users.</p>

      <h2>2. No Guarantee of Removal</h2>
      <p>VentWall reserves the right, but not the obligation, to remove, restrict, edit, review, preserve, or disclose content where permitted or required by law. The existence of a report or flag does not guarantee that content will be removed.</p>

      <h2>3. Platform Role</h2>
      <p>VentWall operates as a technology platform and anonymous communication service. VentWall does not endorse, adopt, or represent user-generated content and is not responsible for opinions, statements, or expressions made by users. Views expressed by users are their own and do not represent the views of VentWall.</p>

      <h2>4. Content License</h2>
      <p>Users retain ownership of content they submit to VentWall. By submitting content, users grant VentWall a non-exclusive, royalty-free, worldwide license to display, store, transmit, and distribute such content solely for the purposes of operating, maintaining, and improving the service. This license terminates when content is removed or expires from the platform.</p>

      <h2>5. Prohibited Content</h2>
      <p>Users may not post content that:</p>
      <ul>
        <li>Constitutes or contains credible threats of violence against any person or group</li>
        <li>Promotes, glorifies, or facilitates terrorism or mass violence</li>
        <li>Depicts, promotes, or solicits child sexual exploitation or abuse material (CSAM)</li>
        <li>Contains doxxing or non-consensually shared private information</li>
        <li>Constitutes revenge pornography or non-consensual intimate imagery</li>
        <li>Provides instructions for illegal weapon manufacturing</li>
        <li>Facilitates human trafficking or sexual exploitation</li>
        <li>Distributes malware, phishing schemes, or fraud</li>
        <li>Violates any applicable local, state, federal, or international law</li>
      </ul>

      <h2>6. Indemnification</h2>
      <p>Users agree to defend, indemnify, and hold harmless VentWall, its owners, operators, affiliates, contractors, employees, agents, and successors from any and all claims, damages, obligations, losses, liabilities, costs, and expenses (including attorney's fees) arising from: (a) content submitted by the user; (b) use of the platform; (c) violation of these Terms; or (d) violation of any third-party right.</p>

      <h2>7. Limitation of Liability</h2>
      <p>To the maximum extent permitted by applicable law, VentWall and its operators shall not be liable for any indirect, incidental, special, consequential, punitive, or exemplary damages, including but not limited to damages for loss of profits, goodwill, data, or other intangible losses, resulting from use or inability to use the service.</p>

      <h2>8. Termination</h2>
      <p>VentWall may suspend, restrict, or terminate access to the platform at any time, at its sole discretion, with or without notice, for violations of these Terms or for any other reason VentWall deems appropriate. Termination does not affect any rights or obligations that arose before termination.</p>

      <h2>9. Governing Law</h2>
      <p>These Terms shall be governed by and construed in accordance with the laws of the United States of America and, where applicable, the laws of the state in which VentWall operates, without regard to conflict-of-law principles. Any dispute arising under these Terms shall be resolved in the appropriate courts of the United States.</p>

      <h2>10. Geographic Restriction</h2>
      <p>VentWall is intended for users located in the United States. Access from outside the United States may be restricted. By using VentWall, you represent that you are accessing the service from within the United States and agree that the service is governed by applicable United States law. Users who access VentWall from outside the United States do so at their own risk and are solely responsible for compliance with applicable local laws.</p>

      <h2>11. Severability</h2>
      <p>If any provision of these Terms is found by a court of competent jurisdiction to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect. The invalid provision shall be modified to the minimum extent necessary to make it enforceable.</p>

      <h2>12. Changes to Terms</h2>
      <p>VentWall reserves the right to modify these Terms at any time. Continued use of the platform after changes are posted constitutes acceptance of the revised Terms.</p>

      <h2>13. Contact</h2>
      <p>Questions about these Terms may be directed to <a href="mailto:hello@ventwall.app" className="text-primary hover:underline">hello@ventwall.app</a>.</p>
    </StaticPage>
  );
}

export function Privacy() {
  return (
    <StaticPage title="Privacy Policy">
      <p className="text-xs text-muted-foreground/50 font-mono">Last updated: May 2026</p>

      <p>VentWall is designed to be a minimal-data, anonymous-first platform. This policy explains what we collect, why, and your rights regarding that data.</p>

      <h2>Information We Collect</h2>
      <h3>Automatically Collected Data</h3>
      <ul>
        <li><strong>IP address:</strong> Logged automatically with each request for abuse prevention, rate limiting, and legal compliance purposes.</li>
        <li><strong>Device and browser information:</strong> Browser type, operating system, and device category may be recorded in server access logs.</li>
        <li><strong>Session identifiers:</strong> A temporary session identifier is used to associate your actions (such as posts or reactions) within a session for abuse prevention. This is not linked to a personal identity.</li>
        <li><strong>Cookies:</strong> VentWall uses minimal cookies or localStorage for session management and user preferences (such as sound settings). We do not use advertising or tracking cookies.</li>
      </ul>

      <h3>Content You Submit</h3>
      <p>Posts submitted anonymously are not linked to a verified identity. However, we retain post content in our database until it expires or is removed. Moderation logs recording administrative actions on content are retained for safety and legal compliance.</p>

      <h2>How We Use Your Information</h2>
      <ul>
        <li>To operate and deliver the VentWall service</li>
        <li>To prevent abuse, spam, and policy violations</li>
        <li>To investigate reports of illegal or harmful content</li>
        <li>To comply with applicable laws and respond to valid legal requests</li>
        <li>To maintain platform security and integrity</li>
      </ul>

      <h2>Analytics</h2>
      <p>VentWall may collect aggregated, non-personal usage statistics (such as post volume, reaction counts, and active session counts) to understand platform health. This data is not sold or shared with third parties.</p>

      <h2>Abuse Prevention Logging</h2>
      <p>Certain interactions, including post submissions, reports, and moderation actions, are logged to prevent abuse and enforce platform rules. These logs may include IP addresses and session identifiers and are retained for a limited period to support abuse investigations.</p>

      <h2>Legal Compliance and Disclosure</h2>
      <p>VentWall may disclose information we hold in response to valid legal process, including court orders, subpoenas, or law enforcement requests where required by applicable law. We will provide notice to users where legally permissible.</p>

      <h2>Data Retention</h2>
      <ul>
        <li><strong>Posts:</strong> Active posts are visible on the platform until they expire (7 days for anonymous posts, 30 days for named posts) or are removed. Expired and removed posts may remain in database backups for a limited period.</li>
        <li><strong>Moderation and abuse logs:</strong> Retained as necessary for safety and legal compliance, typically no longer than 90 days unless required by legal process.</li>
        <li><strong>Server access logs:</strong> Retained per standard server logging practices, generally 30–90 days.</li>
      </ul>

      <h2>Data Sharing</h2>
      <p>VentWall does not sell, rent, or trade personal data. We do not share data with advertisers or data brokers. Data may be shared with service providers who assist in operating the platform, subject to appropriate data processing agreements.</p>

      <h2>Your Rights</h2>
      <p>Certain privacy rights may apply depending on a user's jurisdiction and applicable law. These may include the right to access, correct, or request deletion of personal data we hold. To exercise these rights, contact us at <a href="mailto:privacy@ventwall.app" className="text-primary hover:underline">privacy@ventwall.app</a>.</p>
      <p>Users in the European Union, United Kingdom, California, and other jurisdictions with specific privacy laws may have additional rights under applicable law.</p>

      <h2>Children</h2>
      <p>VentWall is not directed at children under the age of 13 and does not knowingly collect data from minors. If you believe a minor has submitted content or data, please contact us immediately.</p>

      <h2>Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. Continued use of VentWall after changes are posted constitutes acceptance of the revised policy.</p>

      <h2>Contact</h2>
      <p>Privacy inquiries: <a href="mailto:privacy@ventwall.app" className="text-primary hover:underline">privacy@ventwall.app</a></p>
    </StaticPage>
  );
}

export function ContentPolicy() {
  return (
    <StaticPage title="Content Policy">
      <p>VentWall is a free-expression platform for anonymous venting. The following rules exist to protect users and comply with applicable law—not to silence unpopular or uncomfortable speech.</p>

      <h2>What You Can Post</h2>
      <p>VentWall supports anonymous speech. You may freely post:</p>
      <ul>
        <li>Personal frustrations, anger, sadness, and emotional venting</li>
        <li>Celebrations, gratitude, and positive experiences</li>
        <li>Political opinions and commentary on public figures</li>
        <li>Religious views and philosophical perspectives</li>
        <li>Relationship and work experiences</li>
        <li>Personal struggles, mental health experiences, and confessions</li>
        <li>Unpopular, controversial, or minority opinions</li>
      </ul>
      <p>Provided such content does not violate applicable laws or the rules below.</p>

      <h2>What Is Not Allowed</h2>
      <p>The following content will be removed and may result in access restrictions:</p>
      <ul>
        <li><strong>Credible threats of violence</strong> directed at specific individuals or groups</li>
        <li><strong>Terrorist content</strong> that promotes, glorifies, or recruits for terrorism or mass violence</li>
        <li><strong>Child sexual exploitation material (CSAM)</strong> of any kind</li>
        <li><strong>Doxxing</strong> — posting private personal information (names, addresses, phone numbers, emails) without consent</li>
        <li><strong>Revenge pornography</strong> or non-consensual intimate imagery</li>
        <li><strong>Fraud and scam schemes</strong></li>
        <li><strong>Illegal weapon manufacturing instructions</strong></li>
        <li><strong>Malware or phishing content</strong></li>
        <li><strong>Human trafficking</strong> solicitations or facilitation</li>
        <li><strong>Content prohibited by applicable law</strong> in the user's or platform's jurisdiction</li>
      </ul>

      <h2>Sensitive Content</h2>
      <p>The following content is allowed but subject to additional handling:</p>
      <ul>
        <li><strong>Self-harm and suicide:</strong> Expression of personal struggle is allowed. Graphic encouragement of self-harm is not. If you appear to be in crisis, we will display crisis resources. If you are in immediate danger, contact emergency services or call/text <strong>988</strong> (US).</li>
        <li><strong>Graphic personal venting:</strong> Anger, grief, and dark emotions are welcome. Targeted harassment of specific real individuals is not.</li>
      </ul>

      <h2>Automated Moderation</h2>
      <p>VentWall uses automated filters to detect and block prohibited content before it is published. These filters check for:</p>
      <ul>
        <li>Personal information (phone numbers, email addresses, physical addresses)</li>
        <li>Credible threats and violent intent</li>
        <li>Prohibited content categories listed above</li>
        <li>Spam and link abuse</li>
      </ul>
      <p>Automated systems are imperfect. False positives may occur. Contact us if you believe legitimate content was incorrectly blocked.</p>

      <h2>Community Reporting</h2>
      <p>Every post includes a report option. Reports are reviewed by our moderation team. Posts that receive multiple reports are automatically flagged for review. Content confirmed to violate this policy will be removed.</p>

      <h2>Enforcement</h2>
      <p>Policy violations may result in content removal, temporary or permanent access restrictions, or reporting to law enforcement where legally required.</p>

      <h2>Appeals and Contact</h2>
      <p>Questions, appeals, or abuse reports: <a href="mailto:abuse@ventwall.app" className="text-primary hover:underline">abuse@ventwall.app</a></p>
    </StaticPage>
  );
}
