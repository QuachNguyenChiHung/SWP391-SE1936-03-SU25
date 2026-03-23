import fs from 'fs';
import path from 'path';
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  Packer,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';

const rootDir = process.cwd();
const srsPath = path.join(rootDir, 'docs', 'SRS_Data_Labeling_Support_System_FPTU.md');
const outPath = path.join(rootDir, 'docs', 'FPTU_Data_Labeling_Project_Report.docx');

const today = new Date();
const formatDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

const heading = (text, level = 1) => {
  const map = {
    1: HeadingLevel.HEADING_1,
    2: HeadingLevel.HEADING_2,
    3: HeadingLevel.HEADING_3,
    4: HeadingLevel.HEADING_4,
  };
  return new Paragraph({ text, heading: map[level] ?? HeadingLevel.HEADING_1, spacing: { after: 160 } });
};

const p = (text, opts = {}) =>
  new Paragraph({
    children: [new TextRun({ text })],
    spacing: { after: 120 },
    alignment: opts.align ?? AlignmentType.JUSTIFIED,
  });

const bullet = (text, level = 0) =>
  new Paragraph({
    text,
    bullet: { level },
    spacing: { after: 80 },
  });

const numbered = (text, reference = 'default-numbering', level = 0) =>
  new Paragraph({
    text,
    numbering: { reference, level },
    spacing: { after: 90 },
  });

const tocLine = (text, level = 0) =>
  new Paragraph({
    text: `${'    '.repeat(level)}${text}............................................................`,
    spacing: { after: 70 },
  });

const codeLine = (text) =>
  new Paragraph({
    children: [new TextRun({ text, font: 'Consolas', size: 20 })],
    spacing: { after: 40 },
    alignment: AlignmentType.LEFT,
  });

const normalizeInline = (text) =>
  text
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .trim();

const createTable = (headers, rows) => {
  const makeCell = (value, isHeader = false) =>
    new TableCell({
      children: [
        new Paragraph({
          children: [new TextRun({ text: normalizeInline(String(value ?? '')), bold: isHeader })],
          spacing: { after: 80 },
          alignment: AlignmentType.LEFT,
        }),
      ],
      margins: { top: 80, bottom: 80, left: 100, right: 100 },
    });

  const tableRows = [
    new TableRow({ children: headers.map((h) => makeCell(h, true)) }),
    ...rows.map((row) => new TableRow({ children: row.map((cell) => makeCell(cell)) })),
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
    },
  });
};

const kvRow = (label, value, span = 3) =>
  new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
        margins: { top: 80, bottom: 80, left: 100, right: 100 },
      }),
      new TableCell({
        columnSpan: span,
        children: [new Paragraph({ text: value })],
        margins: { top: 80, bottom: 80, left: 100, right: 100 },
      }),
    ],
  });

const useCaseTable = ({
  ucName,
  primaryActor,
  secondaryActor,
  trigger,
  description,
  preconditions = [],
  postconditions = [],
  normalFlow = [],
  alternativeFlows = [],
  exceptions = [],
  businessRules = [],
}) => {
  const numberedText = (items) => (items.length ? items.map((item, idx) => `${idx + 1}. ${item}`).join('\n') : 'None');
  const bulletText = (items) => (items.length ? items.map((item) => `- ${item}`).join('\n') : 'None');

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
    },
    rows: [
      kvRow('UC Name', ucName),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Primary Actor', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ text: primaryActor })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Secondary Actor', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ text: secondaryActor || 'None' })] }),
        ],
      }),
      kvRow('Trigger', trigger),
      kvRow('Description', description),
      kvRow('Preconditions', numberedText(preconditions)),
      kvRow('Postconditions', numberedText(postconditions)),
      kvRow('Normal Flow', numberedText(normalFlow)),
      kvRow('Alternative Flows', bulletText(alternativeFlows)),
      kvRow('Exceptions', bulletText(exceptions)),
      kvRow('Business Rules', businessRules.length ? businessRules.join(', ') : 'None'),
    ],
  });
};

const parseTableRow = (line) =>
  line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => normalizeInline(c));

const isSeparatorRow = (line) => {
  const cells = parseTableRow(line);
  return cells.length > 0 && cells.every((c) => /^:?-{3,}:?$/.test(c));
};

const parseMarkdownToParagraphs = (markdown) => {
  const lines = markdown.split(/\r?\n/);
  const blocks = [];
  let inCode = false;

  for (let i = 0; i < lines.length; i += 1) {
    const rawLine = lines[i];
    const line = rawLine.trimEnd();

    if (line.startsWith('```')) {
      inCode = !inCode;
      if (!inCode) blocks.push(new Paragraph({ text: '' }));
      continue;
    }

    if (inCode) {
      blocks.push(codeLine(line));
      continue;
    }

    if (!line.trim()) {
      blocks.push(new Paragraph({ text: '' }));
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      blocks.push(heading(normalizeInline(headingMatch[2]), Math.min(4, headingMatch[1].length)));
      continue;
    }

    if (/^\|.*\|$/.test(line) && i + 1 < lines.length && isSeparatorRow(lines[i + 1])) {
      const headers = parseTableRow(line);
      const rows = [];
      i += 2;
      while (i < lines.length && /^\|.*\|$/.test(lines[i].trim())) {
        rows.push(parseTableRow(lines[i]));
        i += 1;
      }
      i -= 1;
      blocks.push(createTable(headers, rows));
      blocks.push(new Paragraph({ text: '' }));
      continue;
    }

    const numberedMatch = line.match(/^\d+\.\s+(.*)$/);
    if (numberedMatch) {
      blocks.push(numbered(normalizeInline(numberedMatch[1])));
      continue;
    }

    const bulletMatch = line.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      blocks.push(bullet(normalizeInline(bulletMatch[1])));
      continue;
    }

    blocks.push(p(normalizeInline(line)));
  }

  return blocks;
};

const sectionOne = [
  heading('I. Project Introduction', 1),
  heading('1. Overview', 2),
  heading('1.1 Project Information', 3),
  createTable(
    ['Field', 'Details'],
    [
      ['Project Name', 'Data Labeling Support System'],
      ['Project Type', 'Web-based role-driven platform for annotation production, quality review, and operational management'],
      ['Report Date', formatDate],
      ['University', 'FPT University'],
      ['Capstone Context', 'Final presentation and graduation report documentation'],
    ],
  ),
  new Paragraph({ text: '' }),
  heading('1.2 Project Team', 3),
  heading('1.2.1 Supervisor', 4),
  createTable(
    ['Role', 'Name', 'Notes'],
    [['Supervisor', '[Insert supervisor full name]', 'Academic advisor for capstone project']],
  ),
  new Paragraph({ text: '' }),
  heading('1.2.2 Team Members', 4),
  createTable(
    ['No.', 'Full Name', 'Student ID', 'Project Role'],
    [
      ['1', '[Insert member 1]', '[Insert ID]', '[Insert role]'],
      ['2', '[Insert member 2]', '[Insert ID]', '[Insert role]'],
      ['3', '[Insert member 3]', '[Insert ID]', '[Insert role]'],
      ['4', '[Insert member 4]', '[Insert ID]', '[Insert role]'],
    ],
  ),
  new Paragraph({ text: '' }),
  p('Note: Keep the same FPT University branding images from your original template by replacing placeholder logo blocks in Word if needed.'),
  heading('2. Product Background', 2),
  p('Machine learning projects require high-quality labeled data, but manual annotation is often fragmented across spreadsheets, messaging tools, and disconnected storage. This makes progress tracking difficult, introduces inconsistency, and causes quality drift over time.'),
  p('The Data Labeling Support System addresses these problems with a unified, role-based workflow where managers configure projects and labels, annotators produce data labels in a dedicated workspace, reviewers verify quality, and administrators supervise system users.'),
  heading('3. Existing Systems', 2),
  createTable(
    ['System', 'Strengths', 'Gaps Compared To This Project'],
    [
      ['Label Studio', 'Strong labeling tools and format support', 'Needs custom process tuning for strict educational role workflows'],
      ['Scale AI Platform', 'Enterprise-scale operations and quality pipeline', 'Cost and complexity are high for student teams'],
      ['Labelbox', 'Mature project and QA features', 'Less customizable for capstone-specific workflow/report requirements'],
    ],
  ),
  new Paragraph({ text: '' }),
  heading('3.1 Label Studio', 3),
  p('Label Studio provides strong labeling capabilities and broad data format support. However, teams usually require additional custom workflow design to match assignment and review governance used in academic capstone projects.'),
  heading('3.2 Scale AI Platform', 3),
  p('Scale AI demonstrates enterprise-grade annotation operations, but onboarding complexity and cost can be high for small teams and educational settings.'),
  heading('3.3 Labelbox', 3),
  p('Labelbox has mature project and quality management features. For student projects, custom internal platforms can still be preferable when strict role flow and specific course output documents are required.'),
  heading('4. Business Opportunity', 2),
  p('A focused platform for data labeling operations provides value in education and small AI teams by reducing turnaround time and improving annotation reliability. The opportunity comes from standardizing processes that are otherwise ad hoc.'),
  bullet('Reduce annotation cycle time through assignment and workspace efficiency.'),
  bullet('Improve quality via explicit review states and rejection feedback loops.'),
  bullet('Increase transparency with dashboards, notifications, and activity logs.'),
  bullet('Enable scalability across multiple projects, datasets, and user groups.'),
  heading('5. Software Product Vision', 2),
  p('Build a practical, maintainable, and role-driven labeling platform that supports end-to-end dataset preparation: from project definition to annotation production and quality acceptance, while remaining easy to extend for future media types and analytics.'),
  heading('6. Project Scope & Limitations', 2),
  heading('6.1 Major Features', 3),
  bullet('Authentication and role-based route authorization.'),
  bullet('Admin user management with filtering, pagination, and activity feed.'),
  bullet('Manager project lifecycle: create, edit, configure datasets, labels, and guidelines.'),
  bullet('Task assignment to annotators with progress tracking.'),
  bullet('Annotation workspace with rectangle, polygon, and freehand tools.'),
  bullet('Reviewer queue with accept/reject decisions and feedback.'),
  bullet('Notification and profile management.'),
  heading('6.2 Limitations & Exclusions', 3),
  bullet('Current implementation focuses on web frontend and API integration assumptions.'),
  bullet('Advanced MLOps integrations and model-assisted annotation are not in this release scope.'),
  bullet('Real-time collaboration conflict resolution is limited in current prototype.'),
  bullet('Mobile native application is not included in this project release.'),
];

const sectionTwo = [
  heading('II. Project Management Plan', 1),
  heading('1. Overview', 2),
  heading('1.1 Scope & Estimation', 3),
  p('The project scope includes role-based screens, workflow logic, and API-ready frontend modules. Estimation is based on feature clusters: authentication, management modules, annotation workspace, and review/monitoring modules.'),
  createTable(
    ['Work Package', 'Estimated Effort (%)', 'Description'],
    [
      ['Authentication & Access Control', '15%', 'Login, session, route guard by role'],
      ['Admin Module', '15%', 'User management and system monitoring'],
      ['Manager Module', '25%', 'Project setup, dataset, labels, guidelines, assignment'],
      ['Annotator Module', '30%', 'Workspace tools and labeling productivity'],
      ['Reviewer Module', '10%', 'Review queue and accept/reject workflow'],
      ['Documentation & QA', '5%', 'SRS/report and final validation'],
    ],
  ),
  new Paragraph({ text: '' }),
  heading('1.2 Project Objectives', 3),
  bullet('Deliver complete role-based core flows aligned with SRS.'),
  bullet('Maintain modular frontend architecture for future backend integration.'),
  bullet('Provide comprehensive documentation suitable for defense presentation.'),
  heading('1.3 Project Risks', 3),
  createTable(
    ['Risk ID', 'Risk Description', 'Impact', 'Mitigation'],
    [
      ['R-01', 'Backend contract mismatch during integration', 'High', 'Freeze API schema per sprint and verify with mock responses'],
      ['R-02', 'Schedule compression near final defense', 'High', 'Prioritize core scope and lock non-critical change requests'],
      ['R-03', 'Late feature expansion from stakeholder feedback', 'Medium', 'Apply change control and impact assessment before acceptance'],
      ['R-04', 'Annotation inconsistency due to unclear labels', 'Medium', 'Strengthen guideline review and reviewer feedback loops'],
    ],
  ),
  new Paragraph({ text: '' }),
  heading('2. Management Approach', 2),
  heading('2.1 Project Process', 3),
  p('The team applies iterative delivery: requirement consolidation, UI/UX implementation, feature completion, integration verification, and final quality pass. Each iteration maps to role-based user flows.'),
  heading('2.2 Quality Management', 3),
  bullet('Coding conventions and component-level structure by feature domain.'),
  bullet('Manual scenario tests for role permissions and route protection.'),
  bullet('Validation of annotation lifecycle and review state transitions.'),
  bullet('Document review to ensure consistency between implementation and SRS.'),
  heading('2.3 Training Plan', 3),
  p('Internal handover includes module walkthrough sessions for Admin, Manager, Annotator, and Reviewer flows; onboarding notes for startup commands; and issue triage conventions for bug reporting.'),
  heading('3. Project Deliverables', 2),
  createTable(
    ['Deliverable', 'Format', 'Owner', 'Status'],
    [
      ['Frontend source code', 'Repository', 'Development team', 'Completed'],
      ['SRS + Project report', 'DOCX/PDF', 'BA & Documentation owner', 'Completed'],
      ['Final presentation slides', 'PPTX', 'All members', 'In progress'],
      ['Demo dataset and account set', 'Data package', 'Manager + QA', 'Completed'],
    ],
  ),
  new Paragraph({ text: '' }),
  heading('4. Responsibility Assignments', 2),
  p('Responsibilities are distributed by module ownership: authentication/profile, admin management, manager workflows, annotation workspace, reviewer workflows, and documentation/testing.'),
  createTable(
    ['Module', 'Primary Owner', 'Supporting Members'],
    [
      ['Authentication & Profile', '[Member Name]', '[Member Name, Member Name]'],
      ['Admin Management', '[Member Name]', '[Member Name]'],
      ['Manager Workflows', '[Member Name]', '[Member Name]'],
      ['Annotation Workspace', '[Member Name]', '[Member Name]'],
      ['Reviewer Workflows', '[Member Name]', '[Member Name]'],
      ['Documentation & QA', '[Member Name]', '[Member Name]'],
    ],
  ),
  new Paragraph({ text: '' }),
  heading('5. Project Communications', 2),
  p('Team communication follows weekly sprint sync, daily issue updates, and milestone review checkpoints with supervisor feedback integration.'),
  heading('6. Configuration Management', 2),
  heading('6.1 Document Management', 3),
  p('Documents are versioned with clear revision history and baseline references to source code and schema snapshots.'),
  heading('6.2 Source Code Management', 3),
  p('Source code is managed via Git with feature branches, pull-request reviews, and controlled merge to protected branch for release-ready states.'),
  heading('6.3 Tools & Infrastructures', 3),
  bullet('React + Vite frontend stack.'),
  bullet('Axios for API communication.'),
  bullet('Bootstrap and custom CSS for responsive UI.'),
  bullet('VS Code + ESLint for development quality control.'),
];

const sectionFour = [
  heading('IV. Software Design Description', 1),
  heading('1. System Design', 2),
  heading('1.1 System Architecture', 3),
  p('The architecture follows a role-aware SPA model. Route protection is enforced at app level, feature modules encapsulate role-specific UIs, shared utilities provide reusable services, and API access is centralized through HTTP helpers.'),
  heading('1.2 Frontend Package Overview', 3),
  bullet('app: route orchestration and layout.'),
  bullet('features/admin: dashboard and account operations.'),
  bullet('features/manager: project setup, datasets, labels, guidelines, and assignment.'),
  bullet('features/annotator: dashboards, workspace, notifications, settings.'),
  bullet('features/reviewer: review dashboard and queue handling.'),
  bullet('shared: reusable components, types, mock data, and utilities.'),
  heading('2. Database Design', 2),
  heading('2.1 Data Dictionary (Core)', 3),
  createTable(
    ['Entity', 'Key Attributes', 'Description'],
    [
      ['User', 'Name, Email, Role, Status', 'System account and authorization source'],
      ['Project', 'Name, Type, Deadline, Status', 'Top-level container for labeling work'],
      ['Dataset / DataItem', 'ProjectId, file metadata, status', 'Stores project data inventory and item units'],
      ['Label / Guideline', 'Name, Color, Shortcut, Content', 'Defines annotation taxonomy and instruction'],
      ['AnnotationTask / TaskItem', 'Assignee, status, progress counts', 'Assignment and per-item workload tracking'],
      ['Annotation', 'Coordinates, attributes, label link', 'Labeling output created by annotator'],
      ['Review / ErrorType', 'Decision, feedback, error mapping', 'Quality control and rejection reason catalog'],
      ['Notification / ActivityLog', 'Type, target, timestamp', 'Operational event and audit history'],
    ],
  ),
  new Paragraph({ text: '' }),
  heading('3. Detailed Design', 2),
  heading('3.1 Annotation Production Flow', 3),
  p('From assigned task batches, annotators open each item, create and edit labels using supported tools, and persist progress through manual save or autosave. Status transitions are tracked to maintain production visibility.'),
  heading('3.2 Review & Quality Control Flow', 3),
  p('Reviewers inspect completed annotations against project guidelines. Decisions update item states to accepted or rejected. Rejections include feedback and optional error typing for actionable correction.'),
  heading('3.3 Assignment Flow', 3),
  p('Managers allocate workloads to annotators by task groups or items. The system tracks completion metrics, enabling workload balancing and bottleneck detection.'),
];

const sectionFive = [
  heading('V. Software Testing Documentation', 1),
  heading('1. Scope of Testing', 2),
  p('Testing scope covers functional validation for all role-based flows, route authorization, task lifecycle transitions, annotation operations, review decisions, and notification behavior.'),
  heading('2. Test Strategy', 2),
  heading('2.1 Testing Types', 3),
  bullet('Functional testing by use-case scenarios.'),
  bullet('UI responsiveness and navigation consistency checks.'),
  bullet('State-transition testing for task and review statuses.'),
  heading('2.2 Test Levels', 3),
  bullet('Component-level tests for isolated screens and forms.'),
  bullet('Integration-level tests across role workflows.'),
  bullet('System-level demo validation with complete end-to-end paths.'),
  heading('2.3 Supporting Tools', 3),
  bullet('Browser developer tools for runtime validation.'),
  bullet('Postman/API mocks for endpoint behavior assumptions.'),
  bullet('Issue tracking sheet for defect triage and retest status.'),
  heading('3. Test Plan', 2),
  heading('3.1 Human Resources', 3),
  p('Each role flow is tested by one primary tester and one reviewer for cross-checking expected outcomes against SRS.'),
  heading('3.2 Test Environment', 3),
  p('Web browser testing is executed on modern Chromium-based browsers with responsive viewport checks.'),
  heading('3.3 Test Milestones', 3),
  bullet('Milestone 1: Authentication and route security complete.'),
  bullet('Milestone 2: Admin and manager modules complete.'),
  bullet('Milestone 3: Annotation and review modules complete.'),
  bullet('Milestone 4: Regression pass and final acceptance.'),
  heading('4. Test Cases & Test Report', 2),
  p('The project maintains scenario-based test cases linked to functional requirements (FR-01 to FR-51), including expected results and pass/fail records for each build candidate.'),
  createTable(
    ['Test ID', 'Scenario', 'Expected Result', 'Status'],
    [
      ['TC-01', 'Login with valid role account', 'Redirect to correct dashboard', 'Pass'],
      ['TC-02', 'Access protected route without session', 'Redirect to public page/login', 'Pass'],
      ['TC-03', 'Manager creates project and uploads dataset', 'Project and items appear with progress data', 'Pass'],
      ['TC-04', 'Annotator submits annotation then reviewer rejects', 'Item state changes and notification generated', 'Pass'],
      ['TC-05', 'Admin creates/edits/deactivates user', 'User list and activity feed updated', 'Pass'],
    ],
  ),
];

const sectionSix = [
  heading('VI. Release Package & User Guides', 1),
  heading('1. Deliverable Package', 2),
  bullet('Frontend source code and configuration files.'),
  bullet('SRS and final report documents.'),
  bullet('Deployment and run instructions.'),
  bullet('Presentation slides and demo credentials.'),
  heading('2. Installation Guides', 2),
  heading('2.1 System Requirements', 3),
  bullet('Node.js 18.17+'),
  bullet('npm 9+'),
  bullet('Modern browser (Chrome/Edge/Firefox latest stable)'),
  heading('2.2 Installation Instructions (Web App)', 3),
  createTable(
    ['Step', 'Command / Action', 'Expected Output'],
    [
      ['1', 'Clone source code repository to local machine', 'Project folder is available locally'],
      ['2', 'Open terminal in frontend root', 'Terminal points to project path'],
      ['3', 'npm install', 'Dependencies installed without critical errors'],
      ['4', 'npm run dev', 'Vite dev server starts and displays local URL'],
      ['5', 'Open http://localhost:5173 in browser', 'Application home/login page loads successfully'],
    ],
  ),
  new Paragraph({ text: '' }),
  heading('3. User Manual', 2),
  heading('3.1 Admin', 3),
  bullet('Log in with Admin account and open dashboard.'),
  bullet('Access Admin Panel to search, filter, create, edit, and deactivate users.'),
  bullet('Review activity feed for audit visibility.'),
  heading('3.2 Manager', 3),
  bullet('Create project and set metadata (type, deadline, description).'),
  bullet('Upload dataset and manage data items.'),
  bullet('Define labels and guideline content.'),
  bullet('Assign annotators and monitor project progress.'),
  heading('3.3 Annotator', 3),
  bullet('Open assigned batches from dashboard.'),
  bullet('Annotate items using rectangle/polygon/freehand tools.'),
  bullet('Use keyboard shortcuts and workspace support utilities.'),
  bullet('Check notifications and settings for personal workflow control.'),
  heading('3.4 Reviewer', 3),
  bullet('Open review queue and inspect completed annotations.'),
  bullet('Accept high-quality output or reject with clear feedback.'),
  bullet('Track approval/rejection metrics on reviewer dashboard.'),
];

const groupTable = new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 2,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'Group SE1936', bold: true, size: 34 })],
            }),
          ],
          margins: { top: 180, bottom: 180, left: 120, right: 120 },
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'Group Members', bold: true, size: 30 })],
              alignment: AlignmentType.CENTER,
            }),
          ],
          margins: { top: 140, bottom: 140, left: 120, right: 120 },
        }),
        new TableCell({
          children: [
            new Paragraph({ text: 'Hoang Anh Khoa - Team Member - SE161381', spacing: { after: 120 } }),
            new Paragraph({ text: 'Pham Duc Hung - Team Member - SE182153', spacing: { after: 120 } }),
            new Paragraph({ text: 'Quach Nguyen Chi Hung - Team Member - SE192175', spacing: { after: 120 } }),
            new Paragraph({ text: 'Tran Xuan Hoang Lam - Team Member - SE183264', spacing: { after: 120 } }),
            new Paragraph({ text: 'Pham Le Nhat Huy - Team Member - SE183324', spacing: { after: 120 } }),
          ],
          margins: { top: 140, bottom: 140, left: 120, right: 120 },
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'Supervisor', bold: true, size: 30 })],
            }),
          ],
          margins: { top: 140, bottom: 140, left: 120, right: 120 },
        }),
        new TableCell({
          children: [new Paragraph({ text: 'Nguyen Thi Cam Huong' })],
          margins: { top: 140, bottom: 140, left: 120, right: 120 },
        }),
      ],
    }),
  ],
  borders: {
    top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
    insideVertical: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
  },
});

const manualTocSection = [
  heading('Table of content', 1),
  tocLine('I. Overview'),
  tocLine('User Requirements', 1),
  tocLine('1.1 Actors', 2),
  tocLine('1.2 Use Cases', 2),
  tocLine('a. UseCase Diagram(s)', 3),
  tocLine('b. Descriptions', 3),
  tocLine('Overall Functionalities', 1),
  tocLine('2.1 Screens Flow', 2),
  tocLine('2.2 Screen Descriptions', 2),
  tocLine('2.3 Screen Authorization', 2),
  tocLine('2.4 Non-UI Functions', 2),
  tocLine('System High Level Design', 1),
  tocLine('3.1 Database Design', 2),
  tocLine('a. Database Schema', 3),
  tocLine('b. Table Descriptions', 3),
  tocLine('3.2 Code Packages', 2),
  tocLine('II. Requirement Specifications'),
  tocLine('Authentication Feature', 1),
  tocLine('1.1 Login', 2),
  tocLine('a. UC Specification', 3),
  tocLine('b. Business Rules', 3),
  tocLine('1.2 Register Account', 2),
  tocLine('a. UC Specification', 3),
  tocLine('b. Business Rules', 3),
  tocLine('1.3 Change Password', 2),
  tocLine('a. UC Specification', 3),
  tocLine('b. Business Rules', 3),
  tocLine('1.4 Forgot Password', 2),
  tocLine('a. UC Specification', 3),
  tocLine('b. Business Rules', 3),
  tocLine('User Profile Feature', 1),
  tocLine('2.1 Edit Account Information', 2),
  tocLine('a. UC Specification', 3),
  tocLine('b. Business Rules', 3),
  tocLine('User Management Feature', 1),
  tocLine('3.1 View user list', 2),
  tocLine('3.2 Add new user', 2),
  tocLine('3.3 Edit user information', 2),
  tocLine('3.4 Deactivate user', 2),
  tocLine('3.5 Search user', 2),
  tocLine('Project Management Feature', 1),
  tocLine('4.1 Add new project', 2),
  tocLine('4.2 Edit project', 2),
  tocLine('4.3 Archive project', 2),
  tocLine('Annotation Production Feature', 1),
  tocLine('5.1 Annotate assigned item', 2),
  tocLine('5.2 Save annotation', 2),
  tocLine('Review Management Feature', 1),
  tocLine('6.1 View review queue', 2),
  tocLine('6.2 Accept annotation', 2),
  tocLine('6.3 Reject annotation', 2),
  tocLine('Assignment Management Feature', 1),
  tocLine('7.1 Assign annotator', 2),
  tocLine('7.2 Reassign task', 2),
  tocLine('Common Feature', 1),
  tocLine('8.1 Dashboard overview', 2),
  tocLine('8.2 Search by date/filter', 2),
  tocLine('Label & Guideline Management Feature', 1),
  tocLine('9.1 View label list', 2),
  tocLine('9.2 Add label', 2),
  tocLine('9.3 Delete label', 2),
  tocLine('9.4 Edit label', 2),
  tocLine('9.5 Manage guideline', 2),
  tocLine('Dataset Management Feature', 1),
  tocLine('10.1 View data item list', 2),
  tocLine('10.2 Upload dataset', 2),
  tocLine('10.3 Delete data item', 2),
  tocLine('Notification & Activity Feature', 1),
  tocLine('11.1 View notification list', 2),
  tocLine('11.2 Mark notification as read', 2),
  tocLine('11.3 View activity log', 2),
  tocLine('Quality Analytics Feature', 1),
  tocLine('12.1 View approval/rejection statistic', 2),
  tocLine('12.2 View annotator performance', 2),
  tocLine('Workspace Utility Feature', 1),
  tocLine('13.1 Use keyboard shortcuts', 2),
  tocLine('13.2 Copy/paste annotation', 2),
  tocLine('III. Screen Designs'),
  tocLine('Authentication', 1),
  tocLine('1.1 Login', 2),
  tocLine('1.2 Forgot password', 2),
  tocLine('1.3 Register account', 2),
  tocLine('1.4 Change password', 2),
  tocLine('Navigation', 1),
  tocLine('2.1 Home page', 2),
  tocLine('User management', 1),
  tocLine('3.1 User list', 2),
  tocLine('3.2 Add user', 2),
  tocLine('3.3 Edit user', 2),
  tocLine('Project management', 1),
  tocLine('4.1 Project list', 2),
  tocLine('4.2 Project details', 2),
  tocLine('Dataset and labels', 1),
  tocLine('5.1 Data items', 2),
  tocLine('5.2 Labels', 2),
  tocLine('5.3 Guidelines', 2),
  tocLine('Annotation workspace', 1),
  tocLine('6.1 Task batch', 2),
  tocLine('6.2 Workspace canvas', 2),
  tocLine('Review management', 1),
  tocLine('7.1 Review queue', 2),
  tocLine('7.2 Review decision', 2),
  tocLine('Notifications', 1),
  tocLine('8.1 Notification page', 2),
  tocLine('Profile', 1),
  tocLine('9.1 View profile', 2),
  tocLine('9.2 Update profile', 2),
  tocLine('IV. Code Designs'),
  tocLine('Authentication/Login - Class Diagram', 1),
  tocLine('Authentication/Login - Sequence Diagram', 1),
  tocLine('User Management - Class Diagram', 1),
  tocLine('User Management - Sequence Diagram', 1),
  tocLine('Project Management - Class Diagram', 1),
  tocLine('Project Management - Sequence Diagram', 1),
  tocLine('Dataset Management - Class Diagram', 1),
  tocLine('Dataset Management - Sequence Diagram', 1),
  tocLine('Label Management - Class Diagram', 1),
  tocLine('Label Management - Sequence Diagram', 1),
  tocLine('Assignment Management - Class Diagram', 1),
  tocLine('Assignment Management - Sequence Diagram', 1),
  tocLine('Annotation Workspace - Class Diagram', 1),
  tocLine('Annotation Workspace - Sequence Diagram', 1),
  tocLine('Review Management - Class Diagram', 1),
  tocLine('Review Management - Sequence Diagram', 1),
  tocLine('Notification Management - Class Diagram', 1),
  tocLine('Notification Management - Sequence Diagram', 1),
  tocLine('V. Appendix'),
  tocLine('Assumptions & Dependencies', 1),
  tocLine('1.1 Assumptions', 2),
  tocLine('1.2 Dependencies', 2),
  tocLine('1.2.1 Software Dependencies', 3),
  tocLine('1.2.2 Libraries', 3),
  tocLine('Limitations & Exclusions', 1),
  tocLine('2.1 Limitations', 2),
  tocLine('2.2 Exclusions', 2),
  tocLine('Business Rules', 1),
  new Paragraph({ text: '' }),
  p('This table of content is aligned with the full structure you provided and adapted to the Data Labeling Support System domain.'),
];

const overviewSection = [
  heading('I. Overview', 1),
  heading('Record of Changes', 2),
  createTable(
    ['Version', 'Date', 'Description', 'Author'],
    [['1.0', formatDate, 'Initial requirement/design document generated from current implemented project flows', 'Group SE1936']],
  ),
  new Paragraph({ text: '' }),
  heading('1. User Requirements', 2),
  heading('1.1 Actors', 3),
  createTable(
    ['Actor', 'Description', 'Main Permissions'],
    [
      ['Guest', 'Unauthenticated visitor', 'Access Home/Login/Forgot Password'],
      ['Admin', 'System operator', 'Manage users and monitor activities'],
      ['Manager', 'Project owner/team lead', 'Create projects, labels, guidelines, assignments'],
      ['Annotator', 'Production labeler', 'Annotate assigned task items in workspace'],
      ['Reviewer', 'Quality controller', 'Review completed annotations and decide Accept/Reject'],
    ],
  ),
  new Paragraph({ text: '' }),
  heading('1.2 Use Cases', 3),
  heading('a. UseCase Diagram(s)', 3),
  p('Title: Use Case Diagram - Full System Actors and Interactions'),
  p('[Insert Diagram Image Here]'),
  heading('b. Descriptions', 3),
  p('Detailed use case specifications are provided in Section II.'),
  heading('2. Overall Functionalities', 2),
  heading('2.1 Screens Flow', 3),
  p('Title: Screen Flow Diagram - Role-based Navigation'),
  p('[Insert Diagram Image Here]'),
  heading('2.2 Screen Descriptions', 3),
  createTable(
    ['Screen Group', 'Main Screens', 'Purpose'],
    [
      ['Public', 'Home, Login, Forgot Password, Change Password', 'Authentication and account recovery'],
      ['Admin', 'Admin Dashboard, Admin Panel', 'User management and monitoring'],
      ['Manager', 'Manager Dashboard, Projects, Project Details', 'Project setup and assignment'],
      ['Annotator', 'Annotator Dashboard, Workspace, Settings', 'Annotation production flow'],
      ['Reviewer', 'Reviewer Dashboard, Review Queue', 'Quality control workflow'],
      ['Shared', 'Profile, Notifications', 'User profile and event updates'],
    ],
  ),
  new Paragraph({ text: '' }),
  heading('2.3 Screen Authorization', 3),
  createTable(
    ['Role', 'Authorized Screen Prefixes'],
    [
      ['Admin', '/admin/*, /profile'],
      ['Manager', '/manager/*, /profile'],
      ['Annotator', '/annotator/*, /profile'],
      ['Reviewer', '/reviewer/*, /profile'],
    ],
  ),
  new Paragraph({ text: '' }),
  heading('2.4 Non-UI Functions', 3),
  bullet('Role-based route protection and redirect logic.'),
  bullet('Autosave for annotation updates.'),
  bullet('Notification state update and read tracking.'),
  bullet('Task and review status transitions.'),
  heading('3. System High Level Design', 2),
  heading('3.1 Database Design', 3),
  heading('a. Database Schema', 3),
  p('Title: Database ER Diagram - Data Labeling Support System'),
  p('[Insert Diagram Image Here]'),
  heading('b. Table Descriptions', 3),
  createTable(
    ['Table', 'Description'],
    [
      ['Users', 'Stores account identity, role, and status fields'],
      ['Projects', 'Stores project metadata and lifecycle status'],
      ['Datasets/DataItems', 'Stores imported data and annotation target items'],
      ['Labels/Guidelines', 'Stores taxonomy and instructions'],
      ['AnnotationTasks/TaskItems', 'Stores assignment batches and item ownership'],
      ['Annotations', 'Stores annotation geometry and metadata'],
      ['Reviews', 'Stores quality decisions and feedback'],
      ['Notifications/ActivityLogs', 'Stores event and audit tracking'],
    ],
  ),
  new Paragraph({ text: '' }),
  heading('3.2 Code Packages', 3),
  p('Title: Code Package Diagram - Frontend Modules'),
  p('[Insert Diagram Image Here]'),
];

const businessRuleMap = {
  'BR-01': 'Only authenticated users can access protected modules.',
  'BR-02': 'Each user has one role controlling route permissions.',
  'BR-03': 'Project must exist before datasets, labels, and assignments.',
  'BR-04': 'Each label belongs to exactly one project.',
  'BR-05': 'Task item must belong to one annotation task.',
  'BR-06': 'Annotation must reference one data item and one label.',
  'BR-07': 'Review decision must be Accept or Reject.',
  'BR-08': 'Rejected review should include feedback and optional error type.',
  'BR-09': 'Notification read state must be tracked by user.',
  'BR-10': 'Autosave should preserve latest annotation state.',
};

const ucGroups = [
  {
    featureTitle: '1. Authentication Feature',
    cases: [
      { id: '1.1', title: 'Login', ucName: 'UC01_Login', primaryActor: 'Guest', secondaryActor: 'System', trigger: 'User submits login form.', description: 'Authenticate and redirect by role.', preconditions: ['Valid account exists.'], postconditions: ['User session is active.'], normalFlow: ['Open login page', 'Enter credentials', 'Submit', 'System validates', 'Redirect to dashboard'], alternativeFlows: ['Invalid credentials'], exceptions: ['Auth service unavailable'], businessRules: ['BR-01', 'BR-02'] },
      { id: '1.2', title: 'Register Account', ucName: 'UC02_RegisterAccount', primaryActor: 'Guest', secondaryActor: 'System', trigger: 'User submits register form.', description: 'Create new account under system policy.', preconditions: ['Registration feature is enabled.'], postconditions: ['Account is created or pending approval.'], normalFlow: ['Open register page', 'Input personal data', 'Submit', 'System validates uniqueness', 'Create account'], alternativeFlows: ['Email already exists'], exceptions: ['Register API timeout'], businessRules: ['BR-01', 'BR-02'] },
      { id: '1.3', title: 'Change Password', ucName: 'UC03_ChangePassword', primaryActor: 'Authenticated User', secondaryActor: 'System', trigger: 'User submits change password form.', description: 'Update account password.', preconditions: ['User is authenticated.'], postconditions: ['Password is changed.'], normalFlow: ['Open change password', 'Enter current/new password', 'Submit', 'System validates and updates'], alternativeFlows: ['Weak password'], exceptions: ['Current password mismatch'], businessRules: ['BR-01', 'BR-02'] },
      { id: '1.4', title: 'Forgot Password', ucName: 'UC04_ForgotPassword', primaryActor: 'Guest', secondaryActor: 'System', trigger: 'User requests reset.', description: 'Start password recovery process.', preconditions: ['User can access forgot password page.'], postconditions: ['Reset instruction is delivered.'], normalFlow: ['Open forgot password', 'Enter email', 'Submit request', 'System processes reset'], alternativeFlows: ['Email does not exist'], exceptions: ['Email service failure'], businessRules: ['BR-01'] },
    ],
  },
  {
    featureTitle: '2. User Profile Feature',
    cases: [
      { id: '2.1', title: 'Edit Account Information', ucName: 'UC05_EditAccountInfo', primaryActor: 'Authenticated User', secondaryActor: 'System', trigger: 'User updates profile fields.', description: 'Update display information.', preconditions: ['User logged in.'], postconditions: ['Profile updated.'], normalFlow: ['Open profile', 'Edit fields', 'Save', 'System persists changes'], alternativeFlows: ['Cancel edit'], exceptions: ['Profile service unavailable'], businessRules: ['BR-01'] },
    ],
  },
  {
    featureTitle: '3. User Management Feature',
    cases: [
      { id: '3.1', title: 'View user list', ucName: 'UC06_ViewUserList', primaryActor: 'Admin', secondaryActor: 'System', trigger: 'Admin opens user panel.', description: 'Display user list with pagination.', preconditions: ['Admin logged in.'], postconditions: ['Users are visible.'], normalFlow: ['Open panel', 'System loads user data', 'Display list'], alternativeFlows: ['No data'], exceptions: ['Load error'], businessRules: ['BR-01', 'BR-02'] },
      { id: '3.2', title: 'Add new user', ucName: 'UC07_AddUser', primaryActor: 'Admin', secondaryActor: 'System', trigger: 'Admin submits add-user form.', description: 'Create a new user account.', preconditions: ['Admin has create permission.'], postconditions: ['New user created.'], normalFlow: ['Open create modal', 'Input data', 'Submit', 'System validates and saves'], alternativeFlows: ['Duplicate email'], exceptions: ['Create API error'], businessRules: ['BR-01', 'BR-02'] },
      { id: '3.3', title: 'Edit user information', ucName: 'UC08_EditUser', primaryActor: 'Admin', secondaryActor: 'System', trigger: 'Admin updates user information.', description: 'Edit user account fields.', preconditions: ['Target user exists.'], postconditions: ['User data updated.'], normalFlow: ['Open edit modal', 'Change fields', 'Save', 'System updates record'], alternativeFlows: ['No changes detected'], exceptions: ['Update API error'], businessRules: ['BR-01', 'BR-02'] },
      { id: '3.4', title: 'Deactivate user', ucName: 'UC09_DeactivateUser', primaryActor: 'Admin', secondaryActor: 'System', trigger: 'Admin confirms deactivate action.', description: 'Disable user account.', preconditions: ['Target user exists.'], postconditions: ['User status becomes inactive.'], normalFlow: ['Select user', 'Click deactivate', 'Confirm', 'System updates status'], alternativeFlows: ['Admin cancels action'], exceptions: ['Status update error'], businessRules: ['BR-01', 'BR-02'] },
      { id: '3.5', title: 'Search user', ucName: 'UC10_SearchUser', primaryActor: 'Admin', secondaryActor: 'System', trigger: 'Admin enters search keyword.', description: 'Filter users by name/email.', preconditions: ['User list is loaded.'], postconditions: ['Filtered results shown.'], normalFlow: ['Input keyword', 'Apply filters', 'Display result list'], alternativeFlows: ['No match found'], exceptions: ['Search API error'], businessRules: ['BR-01'] },
    ],
  },
  {
    featureTitle: '4. Project Management Feature',
    cases: [
      { id: '4.1', title: 'Add new project', ucName: 'UC11_AddProject', primaryActor: 'Manager', secondaryActor: 'System', trigger: 'Manager submits create project form.', description: 'Create project metadata.', preconditions: ['Manager logged in.'], postconditions: ['Project created.'], normalFlow: ['Open create project', 'Input fields', 'Submit', 'System saves project'], alternativeFlows: ['Invalid deadline'], exceptions: ['Create project failed'], businessRules: ['BR-03'] },
      { id: '4.2', title: 'Edit project', ucName: 'UC12_EditProject', primaryActor: 'Manager', secondaryActor: 'System', trigger: 'Manager updates project details.', description: 'Edit project information.', preconditions: ['Project exists.'], postconditions: ['Project updated.'], normalFlow: ['Open project detail', 'Edit fields', 'Save'], alternativeFlows: ['No changes'], exceptions: ['Update failed'], businessRules: ['BR-03'] },
      { id: '4.3', title: 'Archive project', ucName: 'UC13_ArchiveProject', primaryActor: 'Manager', secondaryActor: 'System', trigger: 'Manager archives project.', description: 'Close project lifecycle.', preconditions: ['Project exists and eligible to archive.'], postconditions: ['Project status archived.'], normalFlow: ['Open project', 'Select archive', 'Confirm', 'System updates status'], alternativeFlows: ['Archive blocked by active tasks'], exceptions: ['Archive API error'], businessRules: ['BR-03'] },
    ],
  },
  {
    featureTitle: '5. Annotation Production Feature',
    cases: [
      { id: '5.1', title: 'Annotate assigned item', ucName: 'UC14_AnnotateItem', primaryActor: 'Annotator', secondaryActor: 'System', trigger: 'Annotator opens assigned item.', description: 'Create/edit annotations.', preconditions: ['Task item assigned.'], postconditions: ['Annotation stored.'], normalFlow: ['Open task item', 'Draw annotation', 'Save/autosave'], alternativeFlows: ['Delete and redraw object'], exceptions: ['Autosave fail'], businessRules: ['BR-05', 'BR-06', 'BR-10'] },
      { id: '5.2', title: 'Save annotation', ucName: 'UC15_SaveAnnotation', primaryActor: 'Annotator', secondaryActor: 'System', trigger: 'Annotator clicks save.', description: 'Persist annotation data.', preconditions: ['There is unsaved annotation data.'], postconditions: ['Latest annotation persisted.'], normalFlow: ['Edit annotation', 'Click save', 'System validates and stores data'], alternativeFlows: ['No changes to save'], exceptions: ['Save API error'], businessRules: ['BR-06', 'BR-10'] },
    ],
  },
  {
    featureTitle: '6. Review Management Feature',
    cases: [
      { id: '6.1', title: 'View review queue', ucName: 'UC16_ViewReviewQueue', primaryActor: 'Reviewer', secondaryActor: 'System', trigger: 'Reviewer opens review dashboard.', description: 'Display pending review items.', preconditions: ['Reviewer logged in.'], postconditions: ['Queue loaded.'], normalFlow: ['Open queue', 'Load pending items', 'Select target item'], alternativeFlows: ['No pending items'], exceptions: ['Queue load error'], businessRules: ['BR-07'] },
      { id: '6.2', title: 'Accept annotation', ucName: 'UC17_AcceptAnnotation', primaryActor: 'Reviewer', secondaryActor: 'System', trigger: 'Reviewer selects accept.', description: 'Approve annotation result.', preconditions: ['Review item exists.'], postconditions: ['Status becomes accepted.'], normalFlow: ['Open review item', 'Check quality', 'Click accept', 'System updates status'], alternativeFlows: ['Reviewer postpones decision'], exceptions: ['Decision save error'], businessRules: ['BR-07'] },
      { id: '6.3', title: 'Reject annotation', ucName: 'UC18_RejectAnnotation', primaryActor: 'Reviewer', secondaryActor: 'System', trigger: 'Reviewer selects reject.', description: 'Reject annotation with feedback.', preconditions: ['Review item exists.'], postconditions: ['Status becomes rejected and feedback saved.'], normalFlow: ['Open review item', 'Click reject', 'Enter feedback/error type', 'Submit decision'], alternativeFlows: ['Reviewer edits feedback before submit'], exceptions: ['Reject save error'], businessRules: ['BR-07', 'BR-08', 'BR-09'] },
    ],
  },
  {
    featureTitle: '7. Assignment Management Feature',
    cases: [
      { id: '7.1', title: 'Assign annotator', ucName: 'UC19_AssignAnnotator', primaryActor: 'Manager', secondaryActor: 'System', trigger: 'Manager confirms assignment.', description: 'Assign workload to annotator.', preconditions: ['Annotator and data items available.'], postconditions: ['Task assigned.'], normalFlow: ['Open assignment tab', 'Select annotator and items', 'Confirm assignment'], alternativeFlows: ['No available annotator'], exceptions: ['Assignment conflict'], businessRules: ['BR-05'] },
      { id: '7.2', title: 'Reassign task', ucName: 'UC20_ReassignTask', primaryActor: 'Manager', secondaryActor: 'System', trigger: 'Manager changes assignee.', description: 'Move task from one annotator to another.', preconditions: ['Task exists.'], postconditions: ['Task owner updated.'], normalFlow: ['Open task detail', 'Choose new annotator', 'Confirm reassignment'], alternativeFlows: ['Keep original assignee'], exceptions: ['Reassignment blocked'], businessRules: ['BR-05'] },
    ],
  },
  {
    featureTitle: '8. Common Feature',
    cases: [
      { id: '8.1', title: 'Dashboard overview', ucName: 'UC21_DashboardOverview', primaryActor: 'Admin/Manager/Annotator/Reviewer', secondaryActor: 'System', trigger: 'User opens dashboard.', description: 'Display role summary data.', preconditions: ['User authenticated.'], postconditions: ['Dashboard widgets displayed.'], normalFlow: ['Open dashboard', 'System loads summary cards', 'Display metrics'], alternativeFlows: ['Partial data not available'], exceptions: ['Dashboard API error'], businessRules: ['BR-01'] },
      { id: '8.2', title: 'Search by date/filter', ucName: 'UC22_SearchByFilter', primaryActor: 'Authenticated User', secondaryActor: 'System', trigger: 'User applies filter criteria.', description: 'Filter list data by date/status.', preconditions: ['List data loaded.'], postconditions: ['Filtered result displayed.'], normalFlow: ['Select date/status filters', 'Apply filter', 'View result list'], alternativeFlows: ['No data after filtering'], exceptions: ['Filter request failed'], businessRules: ['BR-01'] },
    ],
  },
  {
    featureTitle: '9. Label & Guideline Management Feature',
    cases: [
      { id: '9.1', title: 'View label list', ucName: 'UC23_ViewLabelList', primaryActor: 'Manager', secondaryActor: 'System', trigger: 'Manager opens labels tab.', description: 'Display labels in project.', preconditions: ['Project exists.'], postconditions: ['Label list loaded.'], normalFlow: ['Open labels tab', 'System fetches labels', 'Display label list'], alternativeFlows: ['No labels defined'], exceptions: ['Label fetch error'], businessRules: ['BR-04'] },
      { id: '9.2', title: 'Add label', ucName: 'UC24_AddLabel', primaryActor: 'Manager', secondaryActor: 'System', trigger: 'Manager submits add label form.', description: 'Create new label definition.', preconditions: ['Project exists.'], postconditions: ['Label added.'], normalFlow: ['Open add label', 'Input name/color/shortcut', 'Save label'], alternativeFlows: ['Duplicate shortcut'], exceptions: ['Save label fail'], businessRules: ['BR-04'] },
      { id: '9.3', title: 'Delete label', ucName: 'UC25_DeleteLabel', primaryActor: 'Manager', secondaryActor: 'System', trigger: 'Manager confirms delete label.', description: 'Remove label from project.', preconditions: ['Label exists.'], postconditions: ['Label removed.'], normalFlow: ['Select label', 'Click delete', 'Confirm action'], alternativeFlows: ['Delete canceled'], exceptions: ['Delete blocked by linked annotations'], businessRules: ['BR-04'] },
      { id: '9.4', title: 'Edit label', ucName: 'UC26_EditLabel', primaryActor: 'Manager', secondaryActor: 'System', trigger: 'Manager updates label settings.', description: 'Edit label metadata.', preconditions: ['Label exists.'], postconditions: ['Label updated.'], normalFlow: ['Open edit label', 'Change values', 'Save updates'], alternativeFlows: ['No field changed'], exceptions: ['Update label fail'], businessRules: ['BR-04'] },
      { id: '9.5', title: 'Manage guideline', ucName: 'UC27_ManageGuideline', primaryActor: 'Manager', secondaryActor: 'System', trigger: 'Manager edits guideline content.', description: 'Create/update annotation guideline.', preconditions: ['Project exists.'], postconditions: ['Guideline saved.'], normalFlow: ['Open guideline tab', 'Edit content', 'Save guideline'], alternativeFlows: ['Revert unsaved content'], exceptions: ['Guideline save fail'], businessRules: ['BR-03'] },
    ],
  },
  {
    featureTitle: '10. Dataset Management Feature',
    cases: [
      { id: '10.1', title: 'View data item list', ucName: 'UC28_ViewDataItems', primaryActor: 'Manager', secondaryActor: 'System', trigger: 'Manager opens data items tab.', description: 'Display data item list.', preconditions: ['Dataset exists.'], postconditions: ['Data items shown.'], normalFlow: ['Open data items tab', 'System loads item list', 'Display paginated data'], alternativeFlows: ['No items in dataset'], exceptions: ['Data load error'], businessRules: ['BR-03'] },
      { id: '10.2', title: 'Upload dataset', ucName: 'UC29_UploadDataset', primaryActor: 'Manager', secondaryActor: 'System', trigger: 'Manager uploads files.', description: 'Import dataset into project.', preconditions: ['Project exists.'], postconditions: ['Dataset items added.'], normalFlow: ['Select files', 'Start upload', 'Track progress', 'Finish import'], alternativeFlows: ['Some files skipped'], exceptions: ['Upload interrupted'], businessRules: ['BR-03'] },
      { id: '10.3', title: 'Delete data item', ucName: 'UC30_DeleteDataItem', primaryActor: 'Manager', secondaryActor: 'System', trigger: 'Manager confirms delete item.', description: 'Remove selected data item.', preconditions: ['Data item exists.'], postconditions: ['Item deleted.'], normalFlow: ['Select item', 'Click delete', 'Confirm', 'System removes item'], alternativeFlows: ['Delete canceled'], exceptions: ['Delete request fail'], businessRules: ['BR-03'] },
    ],
  },
  {
    featureTitle: '11. Notification & Activity Feature',
    cases: [
      { id: '11.1', title: 'View notification list', ucName: 'UC31_ViewNotificationList', primaryActor: 'Authenticated User', secondaryActor: 'System', trigger: 'User opens notification view.', description: 'Display notifications by status.', preconditions: ['User logged in.'], postconditions: ['Notifications displayed.'], normalFlow: ['Open notification page', 'System fetches notifications', 'Render list'], alternativeFlows: ['No notifications'], exceptions: ['Notification API error'], businessRules: ['BR-09'] },
      { id: '11.2', title: 'Mark notification as read', ucName: 'UC32_MarkAsRead', primaryActor: 'Authenticated User', secondaryActor: 'System', trigger: 'User marks notification read.', description: 'Update notification read state.', preconditions: ['Notification exists.'], postconditions: ['Notification state updated.'], normalFlow: ['Select notification', 'Mark as read', 'System updates state'], alternativeFlows: ['Already read item'], exceptions: ['Update fail'], businessRules: ['BR-09'] },
      { id: '11.3', title: 'View activity log', ucName: 'UC33_ViewActivityLog', primaryActor: 'Admin', secondaryActor: 'System', trigger: 'Admin opens activity feed.', description: 'Display operational history.', preconditions: ['Admin logged in.'], postconditions: ['Log data shown.'], normalFlow: ['Open activity feed', 'Filter actions', 'Review entries'], alternativeFlows: ['No activity records'], exceptions: ['Activity feed load fail'], businessRules: ['BR-09'] },
    ],
  },
  {
    featureTitle: '12. Quality Analytics Feature',
    cases: [
      { id: '12.1', title: 'View approval/rejection statistic', ucName: 'UC34_ViewQAStats', primaryActor: 'Reviewer/Manager', secondaryActor: 'System', trigger: 'User opens quality dashboard.', description: 'Display QA metrics.', preconditions: ['Review data exists.'], postconditions: ['Stats rendered.'], normalFlow: ['Open dashboard', 'System aggregates review metrics', 'Display charts'], alternativeFlows: ['Insufficient data period'], exceptions: ['Aggregation API fail'], businessRules: ['BR-07', 'BR-08'] },
      { id: '12.2', title: 'View annotator performance', ucName: 'UC35_ViewAnnotatorPerformance', primaryActor: 'Manager', secondaryActor: 'System', trigger: 'Manager opens performance view.', description: 'Analyze annotator throughput and quality.', preconditions: ['Task and review data available.'], postconditions: ['Performance metrics shown.'], normalFlow: ['Open performance panel', 'Select date range', 'System loads metrics'], alternativeFlows: ['No data in selected range'], exceptions: ['Metric service fail'], businessRules: ['BR-05', 'BR-07'] },
    ],
  },
  {
    featureTitle: '13. Workspace Utility Feature',
    cases: [
      { id: '13.1', title: 'Use keyboard shortcuts', ucName: 'UC36_UseKeyboardShortcuts', primaryActor: 'Annotator', secondaryActor: 'System', trigger: 'Annotator opens shortcut help.', description: 'Use keyboard shortcuts in workspace.', preconditions: ['Workspace is open.'], postconditions: ['Annotator improves operation speed.'], normalFlow: ['Open shortcut help', 'Review key bindings', 'Use shortcuts in annotation'], alternativeFlows: ['Help panel hidden'], exceptions: ['Shortcut config load fail'], businessRules: ['BR-10'] },
      { id: '13.2', title: 'Copy/paste annotation', ucName: 'UC37_CopyPasteAnnotation', primaryActor: 'Annotator', secondaryActor: 'System', trigger: 'Annotator uses copy/paste action.', description: 'Duplicate annotation objects.', preconditions: ['At least one annotation selected.'], postconditions: ['New duplicated annotation created.'], normalFlow: ['Select annotation', 'Copy', 'Paste', 'Adjust position and save'], alternativeFlows: ['Copy disabled for empty selection'], exceptions: ['Clipboard action fail'], businessRules: ['BR-06', 'BR-10'] },
    ],
  },
];

const requirementSpecSection = [
  heading('II. Requirement Specifications', 1),
  ...ucGroups.flatMap((group) => [
    heading(group.featureTitle, 2),
    ...group.cases.flatMap((uc) => [
      heading(`${uc.id} ${uc.title}`, 3),
      heading('a. UC Specification', 4),
      useCaseTable(uc),
      heading('b. Business Rules', 4),
      createTable(
        ['Rule ID', 'Rule Description'],
        uc.businessRules.map((id) => [id, businessRuleMap[id] || 'Project-specific business rule.']),
      ),
      heading('Diagram Placeholder', 4),
      p(`Title: ${uc.ucName} - Sequence Diagram`),
      p('[Insert Diagram Image Here]'),
      new Paragraph({ text: '' }),
    ]),
  ]),
];

const screenDesignSection = [
  heading('III. Screen Designs', 1),
  heading('Authentication', 2),
  heading('1.1 Login', 3), p('Title: Login Screen'), p('[Insert Diagram/Image Here]'),
  heading('1.2 Forgot password', 3), p('Title: Forgot Password Screen'), p('[Insert Diagram/Image Here]'),
  heading('1.3 Register account', 3), p('Title: Register Screen'), p('[Insert Diagram/Image Here]'),
  heading('1.4 Change password', 3), p('Title: Change Password Screen'), p('[Insert Diagram/Image Here]'),
  heading('Navigation', 2),
  heading('2.1 Home page', 3), p('Title: Home Page Screen'), p('[Insert Diagram/Image Here]'),
  heading('User management', 2),
  heading('3.1 User list', 3), p('Title: User List Screen'), p('[Insert Diagram/Image Here]'),
  heading('3.2 Add user', 3), p('Title: Add User Screen'), p('[Insert Diagram/Image Here]'),
  heading('3.3 Edit user', 3), p('Title: Edit User Screen'), p('[Insert Diagram/Image Here]'),
  heading('Project management', 2),
  heading('4.1 Project list', 3), p('Title: Project List Screen'), p('[Insert Diagram/Image Here]'),
  heading('4.2 Project details', 3), p('Title: Project Details Screen'), p('[Insert Diagram/Image Here]'),
  heading('Dataset and labels', 2),
  heading('5.1 Data items', 3), p('Title: Data Items Screen'), p('[Insert Diagram/Image Here]'),
  heading('5.2 Labels', 3), p('Title: Label Management Screen'), p('[Insert Diagram/Image Here]'),
  heading('5.3 Guidelines', 3), p('Title: Guidelines Screen'), p('[Insert Diagram/Image Here]'),
  heading('Annotation workspace', 2),
  heading('6.1 Task batch', 3), p('Title: Annotator Dashboard Screen'), p('[Insert Diagram/Image Here]'),
  heading('6.2 Workspace canvas', 3), p('Title: Annotation Workspace Screen'), p('[Insert Diagram/Image Here]'),
  heading('Review management', 2),
  heading('7.1 Review queue', 3), p('Title: Review Queue Screen'), p('[Insert Diagram/Image Here]'),
  heading('7.2 Review decision', 3), p('Title: Review Decision Screen'), p('[Insert Diagram/Image Here]'),
  heading('Notifications', 2),
  heading('8.1 Notification page', 3), p('Title: Notifications Screen'), p('[Insert Diagram/Image Here]'),
  heading('Profile', 2),
  heading('9.1 View profile', 3), p('Title: Profile Screen'), p('[Insert Diagram/Image Here]'),
  heading('9.2 Update profile', 3), p('Title: Edit Profile Screen'), p('[Insert Diagram/Image Here]'),
];

const codeDesignSection = [
  heading('IV. Code Designs', 1),
  ...[
    'Authentication/Login',
    'User Management',
    'Project Management',
    'Dataset Management',
    'Label Management',
    'Assignment Management',
    'Annotation Workspace',
    'Review Management',
    'Notification Management',
  ].flatMap((name) => [
    heading(name, 2),
    heading('Class Diagram', 3),
    p(`Title: ${name} - Class Diagram`),
    p('[Insert Diagram Image Here]'),
    heading('Sequence Diagram', 3),
    p(`Title: ${name} - Sequence Diagram`),
    p('[Insert Diagram Image Here]'),
    new Paragraph({ text: '' }),
  ]),
];

const appendixSection = [
  heading('V. Appendix', 1),
  heading('Assumptions & Dependencies', 2),
  heading('1.1 Assumptions', 3),
  bullet('Backend APIs follow expected schema from current frontend integration patterns.'),
  bullet('Role model includes Admin, Manager, Annotator, and Reviewer.'),
  heading('1.2 Dependencies', 3),
  heading('1.2.1 Software Dependencies', 4),
  bullet('Node.js 18.17+'),
  bullet('Modern web browser support.'),
  heading('1.2.2 Libraries', 4),
  bullet('React, React Router, Axios, Bootstrap.'),
  heading('Limitations & Exclusions', 2),
  heading('2.1 Limitations', 3),
  bullet('Current scope focuses on web-based workflow and assumes API availability.'),
  bullet('Real-time collaborative annotation conflict resolution is limited.'),
  heading('2.2 Exclusions', 3),
  bullet('Model-assisted auto-labeling is not included in this release.'),
  bullet('Native mobile application is outside current scope.'),
  heading('Business Rules', 2),
  createTable(
    ['Rule ID', 'Description'],
    Object.entries(businessRuleMap).map(([id, desc]) => [id, desc]),
  ),
];

const useCaseDetailsSection = [
  heading('2.2.2 Descriptions', 3),
  p('Use cases are documented in table format to match the sample report style.'),
  heading('UC-01: User Login', 4),
  useCaseTable({
    ucName: 'UC01_Login',
    primaryActor: 'Guest',
    secondaryActor: 'System',
    trigger: 'User opens the login page and submits credentials.',
    description: 'Authenticate the user and redirect to role-specific dashboard.',
    preconditions: ['User account exists and is active.', 'Application is reachable from browser.'],
    postconditions: ['Session is established.', 'User is redirected to authorized dashboard.'],
    normalFlow: ['User opens Login screen.', 'User enters email and password.', 'System validates credentials.', 'System stores session information.', 'System redirects by role.'],
    alternativeFlows: ['Invalid credentials show error message.', 'Locked account blocks login and shows support instruction.'],
    exceptions: ['Authentication API unavailable.', 'Cookie storage blocked by browser settings.'],
    businessRules: ['BR-01', 'BR-02'],
  }),
  new Paragraph({ text: '' }),
  heading('UC-02: Manage User Accounts', 4),
  useCaseTable({
    ucName: 'UC02_ManageUsers',
    primaryActor: 'Admin',
    secondaryActor: 'System',
    trigger: 'Admin opens Admin Panel.',
    description: 'Create, edit, filter, and deactivate user accounts.',
    preconditions: ['Admin is authenticated.', 'Admin has permission to user management module.'],
    postconditions: ['User list and account data are updated.', 'Activity feed records admin actions.'],
    normalFlow: ['Admin opens user list.', 'Admin searches or filters users.', 'Admin performs create/edit/deactivate action.', 'System validates input and updates records.', 'System refreshes list and writes activity log.'],
    alternativeFlows: ['Duplicate email is rejected.', 'Admin cancels operation before confirmation.'],
    exceptions: ['Server error when updating user data.'],
    businessRules: ['BR-01', 'BR-02', 'BR-09'],
  }),
  new Paragraph({ text: '' }),
  heading('UC-03: Configure Project', 4),
  useCaseTable({
    ucName: 'UC03_ConfigureProject',
    primaryActor: 'Manager',
    secondaryActor: 'System',
    trigger: 'Manager creates a new project from Projects screen.',
    description: 'Set up project metadata, upload dataset, define labels, and write guidelines.',
    preconditions: ['Manager is authenticated.', 'Manager has access to project module.'],
    postconditions: ['Project configuration is ready for assignment.'],
    normalFlow: ['Manager creates project.', 'Manager uploads dataset files.', 'Manager defines labels and shortcuts.', 'Manager writes guideline content.', 'System stores project configuration.'],
    alternativeFlows: ['Dataset import partially fails and system reports failed items.'],
    exceptions: ['Upload service timeout.'],
    businessRules: ['BR-03', 'BR-04'],
  }),
  new Paragraph({ text: '' }),
  heading('UC-04: Assign Annotation Tasks', 4),
  useCaseTable({
    ucName: 'UC04_AssignTasks',
    primaryActor: 'Manager',
    secondaryActor: 'Annotator, System',
    trigger: 'Manager opens Annotators tab in project details.',
    description: 'Allocate task groups/items to annotators.',
    preconditions: ['Project has dataset items.', 'Annotator accounts are available.'],
    postconditions: ['Task ownership and assignment status are created.'],
    normalFlow: ['Manager loads annotator list.', 'Manager selects assignee(s).', 'Manager confirms assignment.', 'System creates AnnotationTask and TaskItem records.', 'Annotator sees new assignments in dashboard.'],
    alternativeFlows: ['No available annotator in selected filter criteria.'],
    exceptions: ['Assignment API returns conflict due to stale data.'],
    businessRules: ['BR-03', 'BR-05'],
  }),
  new Paragraph({ text: '' }),
  heading('UC-05: Annotate Assigned Item', 4),
  useCaseTable({
    ucName: 'UC05_AnnotateItem',
    primaryActor: 'Annotator',
    secondaryActor: 'System',
    trigger: 'Annotator opens a task item in workspace.',
    description: 'Create and edit annotations using supported drawing tools.',
    preconditions: ['Task is assigned to annotator.', 'Labels and guidelines are available.'],
    postconditions: ['Annotation data is saved and item status progresses.'],
    normalFlow: ['Annotator opens batch and item.', 'System marks item InProgress when first opened.', 'Annotator draws/edit annotations.', 'System auto-saves and/or manual save occurs.', 'Annotator moves to next item.'],
    alternativeFlows: ['Annotator deletes wrong annotation and redraws.'],
    exceptions: ['Autosave request fails and warning is shown.'],
    businessRules: ['BR-05', 'BR-06', 'BR-10'],
  }),
  new Paragraph({ text: '' }),
  heading('UC-06: Review Annotation Result', 4),
  useCaseTable({
    ucName: 'UC06_ReviewAnnotation',
    primaryActor: 'Reviewer',
    secondaryActor: 'Annotator, System',
    trigger: 'Reviewer opens review queue and selects completed item.',
    description: 'Accept or reject annotation quality with feedback.',
    preconditions: ['Completed item exists in review queue.', 'Reviewer account has permission.'],
    postconditions: ['Review decision stored and item status updated.'],
    normalFlow: ['Reviewer opens item details.', 'Reviewer evaluates annotation against guideline.', 'Reviewer selects Accept or Reject.', 'Reviewer adds feedback and error types for rejection.', 'System updates status and sends notification.'],
    alternativeFlows: ['Reviewer postpones decision and returns item to queue.'],
    exceptions: ['Review save fails due to network interruption.'],
    businessRules: ['BR-07', 'BR-08', 'BR-09'],
  }),
  new Paragraph({ text: '' }),
  heading('UC-07: Manage Notifications', 4),
  useCaseTable({
    ucName: 'UC07_Notifications',
    primaryActor: 'Authenticated User',
    secondaryActor: 'System',
    trigger: 'User opens notification dropdown/page.',
    description: 'Read and update notification status.',
    preconditions: ['User is logged in.', 'Notification records exist.'],
    postconditions: ['Selected notifications are marked as read.'],
    normalFlow: ['System displays unread/read notifications.', 'User opens notification detail.', 'User marks notification as read.', 'System updates read state.'],
    alternativeFlows: ['No notifications available.'],
    exceptions: ['Notification API unavailable.'],
    businessRules: ['BR-09'],
  }),
  new Paragraph({ text: '' }),
  heading('UC-08: Update Profile and Password', 4),
  useCaseTable({
    ucName: 'UC08_UpdateProfile',
    primaryActor: 'Authenticated User',
    secondaryActor: 'System',
    trigger: 'User opens profile page and submits changes.',
    description: 'Update display information and change account password.',
    preconditions: ['User is authenticated.'],
    postconditions: ['Profile data/password is updated successfully.'],
    normalFlow: ['User opens profile page.', 'User edits display name and saves.', 'User opens change password form.', 'User submits current and new password.', 'System validates and updates account.'],
    alternativeFlows: ['User updates only profile or only password.'],
    exceptions: ['Current password mismatch.', 'Password policy validation fails.'],
    businessRules: ['BR-01', 'BR-02'],
  }),
  new Paragraph({ text: '' }),
];

const srsMarkdown = fs.readFileSync(srsPath, 'utf8');
const sectionThree = [
  heading('III. Software Requirement Specification', 1),
  ...parseMarkdownToParagraphs(srsMarkdown),
];

const coverTable = new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              text: 'FPT UNIVERSITY LOGO PLACEHOLDER',
              alignment: AlignmentType.CENTER,
              spacing: { after: 120 },
            }),
            new Paragraph({
              text: 'Keep original template image here',
              alignment: AlignmentType.CENTER,
            }),
          ],
        }),
      ],
    }),
  ],
});

const doc = new Document({
  styles: {
    default: {
      document: {
        run: {
          font: 'Times New Roman',
          size: 24,
        },
        paragraph: {
          spacing: { line: 360 },
        },
      },
    },
  },
  numbering: {
    config: [
      {
        reference: 'default-numbering',
        levels: [
          {
            level: 0,
            format: 'decimal',
            text: '%1.',
            alignment: AlignmentType.START,
          },
        ],
      },
    ],
  },
  sections: [
    {
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: 'Downloaded by Hoang Anh Khoa (K16_HCM) (khoahase161381@fpt.edu.vn)', size: 14 }),
              ],
              spacing: { after: 40 },
            }),
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [PageNumber.CURRENT],
            }),
          ],
        }),
      },
      children: [
        coverTable,
        new Paragraph({ text: '' }),
        new Paragraph({
          text: 'GRADUATION PROJECT REPORT',
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          text: 'Data Labeling Support System',
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({ text: '' }),
        p('Prepared for: FPT University Capstone / Final Presentation', { align: AlignmentType.CENTER }),
        p('Document Type: Full Software Project Documentation', { align: AlignmentType.CENTER }),
        p(`Date: ${formatDate}`, { align: AlignmentType.CENTER }),
        new Paragraph({ text: '' }),
        p('Team Name: Group SE1936', { align: AlignmentType.CENTER }),
        p('Supervisor: Nguyen Thi Cam Huong', { align: AlignmentType.CENTER }),
        p('Members: Hoang Anh Khoa, Pham Duc Hung, Quach Nguyen Chi Hung, Tran Xuan Hoang Lam, Pham Le Nhat Huy', { align: AlignmentType.CENTER }),
        new Paragraph({ text: '' }),
        groupTable,
        new Paragraph({ text: '', pageBreakBefore: true }),
        ...manualTocSection,
        new Paragraph({ text: '', pageBreakBefore: true }),
        ...overviewSection,
        new Paragraph({ text: '', pageBreakBefore: true }),
        ...requirementSpecSection,
        new Paragraph({ text: '', pageBreakBefore: true }),
        ...screenDesignSection,
        new Paragraph({ text: '', pageBreakBefore: true }),
        ...codeDesignSection,
        new Paragraph({ text: '', pageBreakBefore: true }),
        ...appendixSection,
      ],
    },
  ],
});

const buffer = await Packer.toBuffer(doc);

const outputCandidates = [
  outPath,
  path.join(rootDir, 'docs', 'FPTU_Data_Labeling_Project_Report_v2.docx'),
  path.join(rootDir, 'docs', 'FPTU_Data_Labeling_Project_Report_v3.docx'),
  path.join(rootDir, 'docs', `FPTU_Data_Labeling_Project_Report_${Date.now()}.docx`),
];

let generatedPath = null;
let lastError = null;

for (const candidate of outputCandidates) {
  try {
    fs.writeFileSync(candidate, buffer);
    generatedPath = candidate;
    break;
  } catch (error) {
    lastError = error;
    if (!error || error.code !== 'EBUSY') {
      throw error;
    }
  }
}

if (!generatedPath) {
  throw lastError;
}

console.log(`Generated: ${generatedPath}`);
