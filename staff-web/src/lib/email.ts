import prisma from "@/lib/prisma";

export type EmailProvider = "console" | "resend" | "sendgrid" | "nodemailer";

export interface EmailOptions {
  to: string | string[];
  subject?: string;
  html?: string;
  text?: string;
  template?: EmailTemplate;
  data?: Record<string, unknown>;
}

export type EmailTemplate = 
  | "new_donation"
  | "new_volunteer"
  | "new_proposal"
  | "new_job_application"
  | "worker_approved"
  | "worker_rejected"
  | "assignment_completed"
  | "general";

const emailTemplates: Record<EmailTemplate, { subject: string; html: string }> = {
  new_donation: {
    subject: "New Donation Received - Al-Momineen",
    html: `
      <h2>Assalamu Alaikum,</h2>
      <p>A new donation has been received!</p>
      <h3>Donation Details:</h3>
      <ul>
        <li><strong>Amount:</strong> {{amount}}</li>
        <li><strong>Donor:</strong> {{donorName}}</li>
        <li><strong>Email:</strong> {{donorEmail}}</li>
        <li><strong>Campaign:</strong> {{campaign}}</li>
        <li><strong>Type:</strong> {{type}}</li>
      </ul>
      <p>JazakAllah Khair for your support!</p>
    `,
  },
  new_volunteer: {
    subject: "New Volunteer Application - Al-Momineen",
    html: `
      <h2>Assalamu Alaikum,</h2>
      <p>A new volunteer has applied!</p>
      <h3>Volunteer Details:</h3>
      <ul>
        <li><strong>Name:</strong> {{name}}</li>
        <li><strong>Email:</strong> {{email}}</li>
        <li><strong>Phone:</strong> {{phone}}</li>
        <li><strong>Skills:</strong> {{skills}}</li>
        <li><strong>Opportunity:</strong> {{opportunity}}</li>
      </ul>
    `,
  },
  new_proposal: {
    subject: "New Community Proposal - Al-Momineen",
    html: `
      <h2>Assalamu Alaikum,</h2>
      <p>A new community proposal has been submitted!</p>
      <h3>Proposal Details:</h3>
      <ul>
        <li><strong>Title:</strong> {{title}}</li>
        <li><strong>Submitter:</strong> {{submitterName}}</li>
        <li><strong>Category:</strong> {{category}}</li>
        <li><strong>Budget:</strong> {{budget}}</li>
      </ul>
      <p>Please review in the staff portal.</p>
    `,
  },
  new_job_application: {
    subject: "New Job Application - Al-Momineen",
    html: `
      <h2>Assalamu Alaikum,</h2>
      <p>A new job application has been received!</p>
      <h3>Application Details:</h3>
      <ul>
        <li><strong>Position:</strong> {{jobTitle}}</li>
        <li><strong>Applicant:</strong> {{applicantName}}</li>
        <li><strong>Email:</strong> {{applicantEmail}}</li>
      </ul>
    `,
  },
  worker_approved: {
    subject: "Your Worker Profile Approved - Al-Momineen",
    html: `
      <h2>Assalamu Alaikum {{name}},</h2>
      <p>Your worker profile has been approved and is now visible to the community!</p>
      <p>You can now apply for jobs and receive inquiries from employers.</p>
      <p>JazakAllah!</p>
    `,
  },
  worker_rejected: {
    subject: "Worker Profile Update - Al-Momineen",
    html: `
      <h2>Assalamu Alaikum {{name}},</h2>
      <p>Unfortunately, your worker profile was not approved at this time.</p>
      <p>Reason: {{reason}}</p>
      <p>Please contact us for more information.</p>
    `,
  },
  assignment_completed: {
    subject: "Assignment Completed - Al-Momineen",
    html: `
      <h2>Assalamu Alaikum,</h2>
      <p>An assignment has been completed.</p>
      <h3>Details:</h3>
      <ul>
        <li><strong>Student:</strong> {{studentName}}</li>
        <li><strong>Rating:</strong> {{rating}}</li>
        <li><strong>Date:</strong> {{date}}</li>
      </ul>
    `,
  },
  general: {
    subject: "Al-Momineen Notification",
    html: `
      <h2>Assalamu Alaikum,</h2>
      {{content}}
    `,
  },
};

function replaceTemplateVariables(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return data[key] !== undefined ? String(data[key]) : "";
  });
}

function sendViaConsole(to: string | string[], subject: string, html: string): boolean {
  const recipients = Array.isArray(to) ? to.join(", ") : to;
  console.log("=== EMAIL ===");
  console.log(`To: ${recipients}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${html}`);
  console.log("=============");
  return true;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const { to, subject, html, text, template, data } = options;

  let emailHtml = html || "";
  let emailSubject = subject || "";

  if (template && emailTemplates[template]) {
    const templateData = emailTemplates[template];
    emailSubject = data ? replaceTemplateVariables(templateData.subject, data) : templateData.subject;
    emailHtml = data ? replaceTemplateVariables(templateData.html, data) : templateData.html;
  }

  if (!emailHtml && text) {
    emailHtml = `<pre>${text}</pre>`;
  }

  const provider = (process.env.EMAIL_PROVIDER || "console") as EmailProvider;

  switch (provider) {
    case "console":
      return sendViaConsole(to, emailSubject, emailHtml);
    
    case "resend":
      console.warn("Resend provider not configured - install resend package");
      return sendViaConsole(to, emailSubject, emailHtml);
    
    case "sendgrid":
      console.warn("SendGrid provider not configured - install @sendgrid/mail package");
      return sendViaConsole(to, emailSubject, emailHtml);
    
    case "nodemailer":
      console.warn("Nodemailer provider not configured - install nodemailer package");
      return sendViaConsole(to, emailSubject, emailHtml);
    
    default:
      return sendViaConsole(to, emailSubject, emailHtml);
  }
}

export async function getNotificationEmails(): Promise<string[]> {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: "notification_email" },
  });
  
  if (setting?.value) {
    return setting.value.split(",").map(e => e.trim());
  }
  
  return [];
}

export async function shouldNotify(settingKey: string): Promise<boolean> {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: settingKey },
  });
  
  return setting?.value === "true";
}
